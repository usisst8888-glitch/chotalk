'use client';

import { useState, useEffect } from 'react';

interface ServiceRecord {
  id: string;
  user_id: string;
  shop_name: string;
  is_active: boolean;
  created_at: string;
  username?: string;
  nickname?: string;
}

interface PaymentRequest {
  id: string;
  username: string;
  depositor_name: string;
  slot_count: number;
  total_amount: number;
  created_at: string;
}

type Section = 'extensions' | 'purchases' | 'atok' | 'chotok';

export default function ServiceManageTab() {
  const [atokServices, setAtokServices] = useState<ServiceRecord[]>([]);
  const [chotokServices, setChotokServices] = useState<ServiceRecord[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<PaymentRequest[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('extensions');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [atokRes, chotokRes, extRes, purRes] = await Promise.all([
        fetch('/api/admin/services?type=atok'),
        fetch('/api/admin/services?type=chotok'),
        fetch('/api/admin/extensions'),
        fetch('/api/admin/slot-purchases'),
      ]);
      if (atokRes.ok) {
        const data = await atokRes.json();
        setAtokServices(data.services || []);
      }
      if (chotokRes.ok) {
        const data = await chotokRes.json();
        setChotokServices(data.services || []);
      }
      if (extRes.ok) {
        const data = await extRes.json();
        setExtensionRequests(data.requests || []);
      }
      if (purRes.ok) {
        const data = await purRes.json();
        setPurchaseRequests(data.requests || []);
      }
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggleActive = async (type: 'atok' | 'chotok', id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, isActive: !currentActive }),
      });
      if (res.ok) {
        fetchAll();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    }
  };

  const handleDeleteService = async (type: 'atok' | 'chotok', id: string) => {
    if (!confirm('이 신청을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/services?type=${type}&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAll();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    }
  };

  const handleApproveExtension = async (requestId: string) => {
    if (!confirm('이 연장 요청을 승인하시겠습니까?')) return;
    try {
      const res = await fetch('/api/admin/extensions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        alert('연장이 승인되었습니다.');
        fetchAll();
      } else {
        const data = await res.json();
        alert(data.error || '승인 실패');
      }
    } catch {
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const handleApprovePurchase = async (requestId: string) => {
    if (!confirm('이 구매 요청을 승인하시겠습니까?')) return;
    try {
      const res = await fetch('/api/admin/slot-purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        alert('구매가 승인되었습니다. 인원이 추가되었습니다.');
        fetchAll();
      } else {
        const data = await res.json();
        alert(data.error || '승인 실패');
      }
    } catch {
      alert('승인 중 오류가 발생했습니다.');
    }
  };

  const pendingAtok = atokServices.filter(s => !s.is_active).length;
  const pendingChotok = chotokServices.filter(s => !s.is_active).length;
  const totalPending = extensionRequests.length + purchaseRequests.length + pendingAtok + pendingChotok;

  const renderPaymentTable = (requests: PaymentRequest[], type: 'extension' | 'purchase') => {
    if (loading) {
      return <div className="text-center py-12 text-neutral-400">로딩 중...</div>;
    }
    if (requests.length === 0) {
      return <div className="text-center py-12 text-neutral-600">대기 중인 요청이 없습니다.</div>;
    }

    return (
      <table className="w-full min-w-[640px]">
        <thead className="bg-neutral-800/50">
          <tr>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">신청일</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">회원명</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">입금자명</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">{type === 'extension' ? '인원수' : '인원수'}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">금액</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">승인</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-neutral-800/30">
              <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                {new Date(req.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-center text-white">{req.username}</td>
              <td className="px-4 py-3 text-center text-yellow-400 font-medium">{req.depositor_name}</td>
              <td className="px-4 py-3 text-center text-neutral-300">
                {req.slot_count}{type === 'extension' ? '명' : '개'}
              </td>
              <td className="px-4 py-3 text-center text-neutral-300">{req.total_amount.toLocaleString()}원</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => type === 'extension' ? handleApproveExtension(req.id) : handleApprovePurchase(req.id)}
                  className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg transition ${
                    type === 'extension'
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-orange-600 hover:bg-orange-500'
                  }`}
                >
                  승인
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderServiceTable = (services: ServiceRecord[], type: 'atok' | 'chotok') => {
    if (loading) {
      return <div className="text-center py-12 text-neutral-400">로딩 중...</div>;
    }
    if (services.length === 0) {
      return <div className="text-center py-12 text-neutral-600">신청 내역이 없습니다.</div>;
    }

    return (
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left px-4 py-3 text-neutral-500 font-medium">회원</th>
            <th className="text-left px-4 py-3 text-neutral-500 font-medium">가게명</th>
            <th className="text-center px-4 py-3 text-neutral-500 font-medium">상태</th>
            <th className="text-center px-4 py-3 text-neutral-500 font-medium">신청일</th>
            <th className="text-center px-4 py-3 text-neutral-500 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
              <td className="px-4 py-3 text-white">
                {svc.nickname || svc.username || '-'}
              </td>
              <td className="px-4 py-3 text-white font-medium">{svc.shop_name}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleActive(type, svc.id, svc.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    svc.is_active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  }`}
                >
                  {svc.is_active ? '이용중' : '입금 확인중'}
                </button>
              </td>
              <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                {new Date(svc.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleDeleteService(type, svc.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">결제/서비스 관리</h2>
          {totalPending > 0 && (
            <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 text-sm font-bold rounded-full">
              {totalPending}건 대기
            </span>
          )}
        </div>
        <p className="text-neutral-400 text-sm mt-1">연장요청, 추가구매, 심부름톡, 초이스톡 결제 요청을 한 곳에서 관리합니다.</p>
      </div>

      {/* 섹션 토글 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveSection('extensions')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeSection === 'extensions'
              ? 'bg-green-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          연장요청
          {extensionRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{extensionRequests.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('purchases')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeSection === 'purchases'
              ? 'bg-orange-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          추가구매
          {purchaseRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{purchaseRequests.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('atok')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeSection === 'atok'
              ? 'bg-teal-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          심부름톡
          {pendingAtok > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{pendingAtok}</span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('chotok')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            activeSection === 'chotok'
              ? 'bg-violet-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          초이스톡
          {pendingChotok > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{pendingChotok}</span>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        {activeSection === 'extensions' && renderPaymentTable(extensionRequests, 'extension')}
        {activeSection === 'purchases' && renderPaymentTable(purchaseRequests, 'purchase')}
        {activeSection === 'atok' && renderServiceTable(atokServices, 'atok')}
        {activeSection === 'chotok' && renderServiceTable(chotokServices, 'chotok')}
      </div>
    </div>
  );
}
