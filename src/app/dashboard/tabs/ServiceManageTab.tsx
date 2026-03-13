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

export default function ServiceManageTab() {
  const [atokServices, setAtokServices] = useState<ServiceRecord[]>([]);
  const [chotokServices, setChotokServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'atok' | 'chotok'>('atok');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [atokRes, chotokRes] = await Promise.all([
        fetch('/api/admin/services?type=atok'),
        fetch('/api/admin/services?type=chotok'),
      ]);
      if (atokRes.ok) {
        const data = await atokRes.json();
        setAtokServices(data.services || []);
      }
      if (chotokRes.ok) {
        const data = await chotokRes.json();
        setChotokServices(data.services || []);
      }
    } catch {
      console.error('Failed to fetch services');
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

  const handleDelete = async (type: 'atok' | 'chotok', id: string) => {
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

  const renderTable = (services: ServiceRecord[], type: 'atok' | 'chotok') => {
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
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
                >
                  {svc.is_active ? '활성' : '비활성'}
                </button>
              </td>
              <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                {new Date(svc.created_at).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => handleDelete(type, svc.id)}
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
        <h2 className="text-xl font-bold text-white">서비스 신청 관리</h2>
        <p className="text-neutral-400 text-sm mt-1">심부름톡 / 초이스톡 신청 내역을 관리합니다. 상태를 클릭하여 활성/비활성을 변경할 수 있습니다.</p>
      </div>

      {/* 섹션 토글 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection('atok')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'atok'
              ? 'bg-teal-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          심부름톡 ({atokServices.length})
        </button>
        <button
          onClick={() => setActiveSection('chotok')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'chotok'
              ? 'bg-violet-600 text-white'
              : 'bg-neutral-800 text-neutral-500 hover:text-white'
          }`}
        >
          초이스톡 ({chotokServices.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        {activeSection === 'atok' && renderTable(atokServices, 'atok')}
        {activeSection === 'chotok' && renderTable(chotokServices, 'chotok')}
      </div>
    </div>
  );
}
