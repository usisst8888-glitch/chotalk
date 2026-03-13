'use client';

import { useState, useEffect } from 'react';
import { SHOP_NAMES } from '../types';

interface ChoiceTalkService {
  id: string;
  shop_name: string;
  is_active: boolean;
  created_at: string;
}

export default function ChoiceTalkTab() {
  const [services, setServices] = useState<ChoiceTalkService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ shopName: SHOP_NAMES[0], customShopName: '', depositorName: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/aktalk_chotok');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch {
      console.error('Failed to fetch choice talk services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다!');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const shopName = applyForm.shopName === '기타' ? applyForm.customShopName : applyForm.shopName;
    if (!shopName.trim()) {
      alert('가게명을 입력해주세요.');
      return;
    }
    if (!applyForm.depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/aktalk_chotok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName }),
      });

      if (res.ok) {
        alert('초이스톡 서비스 신청이 완료되었습니다. 입금 확인 후 활성화됩니다.');
        setShowApplyModal(false);
        setApplyForm({ shopName: SHOP_NAMES[0], customShopName: '', depositorName: '' });
        fetchServices();
      } else {
        const data = await res.json();
        alert(data.error || '신청에 실패했습니다.');
      }
    } catch {
      alert('서비스 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 서비스를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/aktalk_chotok?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchServices();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">초이스톡 관리</h2>
            <p className="text-neutral-400 text-sm mt-1">초이스톡에서 상황판을 아톡에 메시지를 전달하는 서비스입니다.</p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition"
          >
            서비스 신청
          </button>
        </div>

        {/* 서비스 목록 테이블 */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-neutral-400">로딩 중...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-neutral-600">
              등록된 서비스가 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-4 py-3 text-neutral-500 font-medium">가게명</th>
                  <th className="text-center px-4 py-3 text-neutral-500 font-medium">상태</th>
                  <th className="text-center px-4 py-3 text-neutral-500 font-medium">등록일</th>
                  <th className="text-center px-4 py-3 text-neutral-500 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="px-4 py-3 text-white">{svc.shop_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        svc.is_active ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {svc.is_active ? '이용중' : '입금 확인중'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                      {new Date(svc.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 서비스 신청 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">초이스톡 서비스 신청</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">가게명</label>
                <select
                  value={applyForm.shopName}
                  onChange={(e) => setApplyForm({ ...applyForm, shopName: e.target.value, customShopName: '' })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                >
                  {SHOP_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="기타">기타 (직접입력)</option>
                </select>
                {applyForm.shopName === '기타' && (
                  <input
                    type="text"
                    value={applyForm.customShopName}
                    onChange={(e) => setApplyForm({ ...applyForm, customShopName: e.target.value })}
                    placeholder="가게명 직접 입력"
                    className="w-full mt-2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500"
                  />
                )}
              </div>

              {/* 입금 안내 */}
              <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-4">
                <p className="text-yellow-400 font-bold mb-3 text-center">입금 안내</p>
                <div className="bg-neutral-900 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-sm">은행</span>
                    <span className="text-white font-medium">카카오뱅크</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-sm">계좌번호</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">3333-34-5184801</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('3333345184801')}
                        className="px-2 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded transition"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 text-sm">예금주</span>
                    <span className="text-white font-medium">어시스트솔루션</span>
                  </div>
                  <div className="border-t border-neutral-700 my-2 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 text-sm">초이스톡 (월)</span>
                      <span className="text-yellow-400 font-bold">100,000원</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 입금자명 입력 */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  입금자명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={applyForm.depositorName}
                  onChange={(e) => setApplyForm({ ...applyForm, depositorName: e.target.value })}
                  placeholder="실제 입금하실 이름을 입력해주세요"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ 입금자명이 정확해야 입금 확인이 가능합니다!
                </p>
                <p className="text-red-300 text-xs mt-1">
                  입금 후 관리자 확인 후 활성화됩니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplyForm({ shopName: SHOP_NAMES[0], customShopName: '', depositorName: '' });
                  }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? '신청 중...' : '신청하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
