'use client';

import { Distributor } from '../types';

interface DistributorsTabProps {
  distributors: Distributor[];
  distributorsLoading: boolean;
  allUsers: Array<{ id: string; username: string; nickname: string | null; phone: string; role: string; slot_count: number; parent_id: string | null; domain: string | null; created_at: string }>;
  setShowAddDistributorModal: (show: boolean) => void;
  editingDistributor: string | null;
  setEditingDistributor: (id: string | null) => void;
  editDistForm: { domain: string; siteName: string; bankName: string; accountNumber: string; accountHolder: string; slotPrice: number; costPrice: number; primaryColor: string; secondaryColor: string };
  setEditDistForm: (form: { domain: string; siteName: string; bankName: string; accountNumber: string; accountHolder: string; slotPrice: number; costPrice: number; primaryColor: string; secondaryColor: string }) => void;
  handleUpdateDistributor: (id: string, data: Record<string, string | boolean | number>) => void;
  handleDeleteDistributor: (id: string) => void;
}

export default function DistributorsTab({
  distributors,
  distributorsLoading,
  setShowAddDistributorModal,
  editingDistributor,
  setEditingDistributor,
  editDistForm,
  setEditDistForm,
  handleUpdateDistributor,
  handleDeleteDistributor,
}: DistributorsTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">총판 관리</h2>
        <button
          onClick={() => setShowAddDistributorModal(true)}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition"
        >
          + 총판 추가
        </button>
      </div>
      {distributorsLoading ? (
        <div className="text-center py-12 text-neutral-400">로딩 중...</div>
      ) : distributors.length === 0 ? (
        <div className="text-center py-12 text-neutral-600">등록된 총판이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {distributors.map((d) => (
            <div key={d.id} className="p-4 bg-neutral-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium text-lg">{d.site_name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${d.is_active ? 'bg-green-600/20 text-green-400' : 'bg-neutral-700 text-neutral-400'}`}>
                    {d.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingDistributor(editingDistributor === d.id ? null : d.id);
                      setEditDistForm({
                        domain: d.domain, siteName: d.site_name,
                        bankName: d.bank_name || '', accountNumber: d.account_number || '', accountHolder: d.account_holder || '',
                        slotPrice: d.slot_price || 100000, costPrice: d.cost_price || 20000,
                        primaryColor: d.primary_color, secondaryColor: d.secondary_color,
                      });
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition"
                  >
                    {editingDistributor === d.id ? '닫기' : '수정'}
                  </button>
                  <button
                    onClick={() => handleUpdateDistributor(d.id, { isActive: !d.is_active })}
                    className={`px-3 py-1 text-xs rounded transition ${d.is_active ? 'bg-neutral-600 hover:bg-neutral-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                  >
                    {d.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => handleDeleteDistributor(d.id)}
                    className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-20">도메인</span>
                  <span className="text-indigo-400">{d.domain}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-20">담당자</span>
                  <span className="text-orange-400">{d.username || '-'}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-neutral-500 w-20">메인 색상</span>
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: d.primary_color }} />
                  <span className="text-neutral-400">{d.primary_color}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-neutral-500 w-20">보조 색상</span>
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: d.secondary_color }} />
                  <span className="text-neutral-400">{d.secondary_color}</span>
                </div>
                {d.logo_url && (
                  <div className="flex gap-2 items-center col-span-2">
                    <span className="text-neutral-500 w-20">로고</span>
                    <img src={d.logo_url} alt="logo" className="w-8 h-8 rounded" />
                  </div>
                )}
                <div className="flex gap-2 col-span-2 mt-2 pt-2 border-t border-neutral-700">
                  <span className="text-neutral-500 w-20">입금계좌</span>
                  <span className="text-emerald-400">
                    {d.bank_name && d.account_number
                      ? `${d.bank_name} ${d.account_number} ${d.account_holder || ''}`
                      : '미설정'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-20">판매 금액</span>
                  <span className="text-yellow-400">{(d.slot_price || 100000).toLocaleString()}원</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-neutral-500 w-20">본사 단가</span>
                  <span className="text-orange-400">{(d.cost_price || 20000).toLocaleString()}원</span>
                </div>
              </div>

              {/* 수정 폼 */}
              {editingDistributor === d.id && (
                <div className="mt-4 pt-4 border-t border-neutral-700 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">도메인</label>
                      <input type="text" value={editDistForm.domain} onChange={(e) => setEditDistForm({ ...editDistForm, domain: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">사이트명</label>
                      <input type="text" value={editDistForm.siteName} onChange={(e) => setEditDistForm({ ...editDistForm, siteName: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">은행명</label>
                      <input type="text" value={editDistForm.bankName} onChange={(e) => setEditDistForm({ ...editDistForm, bankName: e.target.value })}
                        placeholder="국민은행" className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">계좌번호</label>
                      <input type="text" value={editDistForm.accountNumber} onChange={(e) => setEditDistForm({ ...editDistForm, accountNumber: e.target.value })}
                        placeholder="123-456-789" className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">예금주</label>
                      <input type="text" value={editDistForm.accountHolder} onChange={(e) => setEditDistForm({ ...editDistForm, accountHolder: e.target.value })}
                        placeholder="홍길동" className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">판매 금액 (원)</label>
                      <input type="number" value={editDistForm.slotPrice} onChange={(e) => setEditDistForm({ ...editDistForm, slotPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">본사 입금 단가 (원)</label>
                      <input type="number" value={editDistForm.costPrice} onChange={(e) => setEditDistForm({ ...editDistForm, costPrice: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">메인 색상</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editDistForm.primaryColor} onChange={(e) => setEditDistForm({ ...editDistForm, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                        <input type="text" value={editDistForm.primaryColor} onChange={(e) => setEditDistForm({ ...editDistForm, primaryColor: e.target.value })}
                          className="flex-1 px-2 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-xs focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">보조 색상</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editDistForm.secondaryColor} onChange={(e) => setEditDistForm({ ...editDistForm, secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                        <input type="text" value={editDistForm.secondaryColor} onChange={(e) => setEditDistForm({ ...editDistForm, secondaryColor: e.target.value })}
                          className="flex-1 px-2 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-xs focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateDistributor(d.id, {
                      domain: editDistForm.domain,
                      siteName: editDistForm.siteName,
                      bankName: editDistForm.bankName,
                      accountNumber: editDistForm.accountNumber,
                      accountHolder: editDistForm.accountHolder,
                      slotPrice: editDistForm.slotPrice,
                      extensionPrice: editDistForm.slotPrice,
                      costPrice: editDistForm.costPrice,
                      primaryColor: editDistForm.primaryColor,
                      secondaryColor: editDistForm.secondaryColor,
                    })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
                  >
                    저장
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
