'use client';

import { Slot, SHOP_NAMES } from '../types';

interface SlotsTabProps {
  user: { id: string; username: string; role: string } | null;
  isAnyAdmin: boolean;
  isSuperAdmin: boolean;
  slots: Slot[];
  filteredSlots: Slot[];
  allSlots: (Slot & { username: string })[];
  slotCount: number;
  usedSlots: number;
  emptySlots: number[];
  shops: Array<{ id: string; shop_name: string; start_time: string; end_time: string }>;
  allUsers: Array<{ id: string; username: string; nickname: string | null; phone: string; role: string; slot_count: number; parent_id: string | null; domain: string | null; created_at: string }>;
  filterUserIds: string[];
  setFilterUserIds: (ids: string[]) => void;
  selectedSlotIds: Set<string>;
  setSelectedSlotIds: (ids: Set<string>) => void;
  setShowBatchExtendModal: (show: boolean) => void;
  setShowExtendAllModal: (show: boolean) => void;
  setShowSlotPurchaseModal: (show: boolean) => void;
  setShowAdminAddModal: (show: boolean) => void;
  slotSearch: string;
  setSlotSearch: (search: string) => void;
  slotSort: 'session' | 'expires';
  setSlotSort: (sort: 'session' | 'expires') => void;
  editingSlotIndex: number | null;
  setEditingSlotIndex: (index: number | null) => void;
  inlineNewSlot: { girlName: string; shopName: string; customShopName: string; customClosingTime: string; targetRoom: string };
  setInlineNewSlot: (slot: { girlName: string; shopName: string; customShopName: string; customClosingTime: string; targetRoom: string }) => void;
  submitting: boolean;
  editingSlotKakaoId: string | null;
  setEditingSlotKakaoId: (id: string | null) => void;
  kakaoInviteIds: Array<{ id: string; kakao_id: string; description: string | null; is_active: boolean; created_at: string; slot_count: number }>;
  toggleSlotActive: (slotId: string, currentActive: boolean, expiresAt: string) => void;
  toggleSlotSelection: (id: string) => void;
  toggleAllSlots: () => void;
  openEditModal: (slot: Slot) => void;
  openExtendModal: (slot: Slot) => void;
  openStatusModal: (slot: Slot) => void;
  handleAdminDeleteSlot: (slotId: string) => void;
  handleChangeSlotKakaoId: (slotId: string, newKakaoId: string) => void;
  handleInlineAddSlot: (index: number) => void;
  cancelInlineEdit: () => void;
  copyToClipboard: (text: string) => void;
  formatDate: (dateString: string) => string;
  getDaysRemaining: (expiresAt: string) => number;
  fetchAllUsers: () => void;
}

export default function SlotsTab({
  user,
  isAnyAdmin,
  isSuperAdmin,
  slots,
  filteredSlots,
  allSlots,
  slotCount,
  usedSlots,
  emptySlots,
  shops,
  allUsers,
  filterUserIds,
  setFilterUserIds,
  selectedSlotIds,
  setSelectedSlotIds,
  setShowBatchExtendModal,
  setShowExtendAllModal,
  setShowSlotPurchaseModal,
  setShowAdminAddModal,
  slotSearch,
  setSlotSearch,
  slotSort,
  setSlotSort,
  editingSlotIndex,
  setEditingSlotIndex,
  inlineNewSlot,
  setInlineNewSlot,
  submitting,
  editingSlotKakaoId,
  setEditingSlotKakaoId,
  kakaoInviteIds,
  toggleSlotActive,
  toggleSlotSelection,
  toggleAllSlots,
  openEditModal,
  openExtendModal,
  openStatusModal,
  handleAdminDeleteSlot,
  handleChangeSlotKakaoId,
  handleInlineAddSlot,
  cancelInlineEdit,
  copyToClipboard,
  formatDate,
  getDaysRemaining,
  fetchAllUsers,
}: SlotsTabProps) {
  return (
    <>
        {/* 스타트톡 설명 */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">스타트톡 관리</h2>
            <p className="text-neutral-400 text-sm mt-1">아가씨별 인원을 등록하고 스타트 시간, 끝나는 시간, 연장 등등 카카오톡으로 자동 발송하는 서비스입니다.</p>
          </div>
          {isAnyAdmin ? (
            // 관리자: 전체 인원 표시
            <>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-lg font-semibold text-white">전체 인원 관리</h3>
                <div className="flex items-center gap-3">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !filterUserIds.includes(e.target.value)) {
                        setFilterUserIds([...filterUserIds, e.target.value]);
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">회원 선택</option>
                    {allUsers.filter(u => u.role !== 'superadmin' && !filterUserIds.includes(u.id)).map(u => (
                      <option key={u.id} value={u.id}>{u.nickname || u.username}</option>
                    ))}
                  </select>
                  <span className="text-neutral-500">
                    총 <span className="text-orange-400 font-medium">{filterUserIds.length > 0 ? allSlots.filter(s => filterUserIds.includes(s.user_id)).length : allSlots.length}명</span> 등록됨
                  </span>
                  <button
                    onClick={() => { if (allUsers.length === 0) fetchAllUsers(); setShowAdminAddModal(true); }}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition"
                  >
                    + 인원 추가
                  </button>
                </div>
              </div>
              {filterUserIds.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {filterUserIds.map(uid => {
                    const u = allUsers.find(u => u.id === uid);
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm rounded-full">
                        {u?.nickname || u?.username || uid}
                        <button
                          onClick={() => setFilterUserIds(filterUserIds.filter(id => id !== uid))}
                          className="ml-1 text-indigo-400 hover:text-white transition"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                  <button
                    onClick={() => setFilterUserIds([])}
                    className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-300 transition"
                  >
                    전체 해제
                  </button>
                </div>
              )}
              {selectedSlotIds.size > 0 && (
                <div className="mt-3 flex items-center gap-3 bg-indigo-900/30 border border-indigo-500/30 rounded-xl px-4 py-3">
                  <span className="text-indigo-300 text-sm font-medium">
                    {selectedSlotIds.size}개 선택됨
                  </span>
                  <button
                    onClick={() => setShowBatchExtendModal(true)}
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
                  >
                    일괄 연장
                  </button>
                  <button
                    onClick={() => setSelectedSlotIds(new Set())}
                    className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg font-medium transition"
                  >
                    선택 해제
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 일반 유저: 데스크톱 한 줄 */}
              <div className="hidden md:flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
                  <span className="text-neutral-500">
                    등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowExtendAllModal(true)}
                      disabled={slots.length === 0}
                      className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition"
                    >
                      전체 연장
                    </button>
                    <button
                      onClick={() => setShowSlotPurchaseModal(true)}
                      className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                    >
                      + 추가 구매
                    </button>
                  </div>
                </div>
              </div>
              {/* 일반 유저: 모바일 두 줄 */}
              <div className="md:hidden">
                <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
                  <span className="text-neutral-500">
                    등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowExtendAllModal(true)}
                    disabled={slots.length === 0}
                    className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition"
                  >
                    전체 연장
                  </button>
                  <button
                    onClick={() => setShowSlotPurchaseModal(true)}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                  >
                    + 추가 구매
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 유저용 검색 + 정렬 */}
        {!isAnyAdmin && slots.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={slotSearch}
                onChange={(e) => setSlotSearch(e.target.value)}
                placeholder="아가씨 이름 또는 가게명 검색"
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSlotSort('session')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition ${
                  slotSort === 'session' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSlotSort('expires')}
                className={`px-3 py-2 text-xs rounded-lg font-medium transition ${
                  slotSort === 'expires' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                만료일순
              </button>
            </div>
          </div>
        )}

        {/* 슬롯 목록 - 데스크톱 테이블 */}
        <div className="hidden md:block bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50">
                <tr>
                  {isAnyAdmin && (
                    <th className="px-2 py-3 text-center">
                      <button
                        onClick={toggleAllSlots}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition mx-auto ${
                          (() => {
                            const filtered = filterUserIds.length > 0 ? allSlots.filter(s => filterUserIds.includes(s.user_id)) : allSlots;
                            const allChecked = filtered.length > 0 && filtered.every(s => selectedSlotIds.has(s.id));
                            const someChecked = filtered.some(s => selectedSlotIds.has(s.id));
                            return allChecked ? 'bg-indigo-600 border-indigo-600' : someChecked ? 'bg-indigo-600/30 border-indigo-500' : 'border-neutral-600 hover:border-neutral-400';
                          })()
                        }`}
                      >
                        {(() => {
                          const filtered = filterUserIds.length > 0 ? allSlots.filter(s => filterUserIds.includes(s.user_id)) : allSlots;
                          const allChecked = filtered.length > 0 && filtered.every(s => selectedSlotIds.has(s.id));
                          const someChecked = filtered.some(s => selectedSlotIds.has(s.id));
                          return allChecked ? (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : someChecked ? (
                            <span className="w-2.5 h-0.5 bg-indigo-400 rounded" />
                          ) : null;
                        })()}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">활성화</th>
                  {isAnyAdmin && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">회원</th>
                  )}
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">소속</th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">아가씨 닉네임</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">가게명</th>
                  {isAnyAdmin && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">채팅방</th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">초대할 ID</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">만료일</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {/* 관리자: 전체 슬롯 표시 */}
                {isAnyAdmin && allSlots.filter(s => filterUserIds.length === 0 || filterUserIds.includes(s.user_id)).map((slot) => {
                  const daysRemaining = getDaysRemaining(slot.expires_at);
                  const isExpiringSoon = daysRemaining <= 7;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={slot.id} className={`hover:bg-neutral-800/30 transition ${!slot.is_active ? 'opacity-50' : ''} ${selectedSlotIds.has(slot.id) ? 'bg-indigo-900/20' : ''}`}>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggleSlotSelection(slot.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition mx-auto ${
                            selectedSlotIds.has(slot.id)
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {selectedSlotIds.has(slot.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSlotActive(slot.id, slot.is_active, slot.expires_at)}
                          className={`w-12 h-6 rounded-full mx-auto cursor-pointer transition-colors flex items-center px-1 ${
                          slot.is_active ? 'bg-green-500 justify-end' : 'bg-neutral-700 justify-start'
                        }`}>
                          <span className="block w-4 h-4 bg-white rounded-full" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-orange-400 font-medium">{slot.username}</td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            slot.distributor_name === '본사'
                              ? 'bg-purple-600/20 text-purple-400'
                              : 'bg-emerald-600/20 text-emerald-400'
                          }`}>
                            {slot.distributor_name || '본사'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center text-white font-medium">{slot.girl_name}</td>
                      <td className="px-4 py-3 text-center text-neutral-400">{slot.shop_name || '-'}</td>
                      <td className="px-4 py-3 text-center text-neutral-500">{slot.target_room}</td>
                      <td className="px-4 py-3 text-center">
                        {isSuperAdmin ? (
                          editingSlotKakaoId === slot.id ? (
                            <select
                              defaultValue={slot.kakao_id}
                              onChange={(e) => handleChangeSlotKakaoId(slot.id, e.target.value)}
                              onBlur={() => setEditingSlotKakaoId(null)}
                              autoFocus
                              className="px-2 py-1 bg-neutral-800 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                            >
                              <option value={slot.kakao_id}>{slot.kakao_id}</option>
                              {kakaoInviteIds
                                .filter((k) => k.is_active && k.kakao_id !== slot.kakao_id)
                                .map((k) => (
                                  <option key={k.id} value={k.kakao_id}>
                                    {k.kakao_id} {k.description ? `(${k.description})` : ''}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span
                              onClick={() => setEditingSlotKakaoId(slot.id)}
                              className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                              title="클릭하여 수정"
                            >
                              {slot.kakao_id}
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium">
                            {slot.kakao_id}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-500'}`}>
                        {formatDate(slot.expires_at)}
                        {isExpired ? ' (만료됨)' : isExpiringSoon ? ` (${daysRemaining}일)` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="px-3 py-1.5 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openExtendModal(slot)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                              isExpired || isExpiringSoon
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                            }`}
                          >
                            연장
                          </button>
                          <button
                            onClick={() => openStatusModal(slot)}
                            className="px-3 py-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                          >
                            상황판
                          </button>
                          <button
                            onClick={() => handleAdminDeleteSlot(slot.id)}
                            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* 일반 유저: 자신의 슬롯만 표시 */}
                {!isAnyAdmin && filteredSlots.map((slot) => {
                  const daysRemaining = getDaysRemaining(slot.expires_at);
                  const isExpiringSoon = daysRemaining <= 7;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={slot.id} className={`hover:bg-neutral-800/30 transition ${!slot.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSlotActive(slot.id, slot.is_active, slot.expires_at)}
                          className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                            slot.is_active ? 'bg-green-500 justify-end' : 'bg-neutral-700 justify-start'
                          }`}
                        >
                          <span className="block w-4 h-4 bg-white rounded-full" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-white font-medium">{slot.girl_name}</td>
                      <td className="px-4 py-3 text-center text-neutral-400">{slot.shop_name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            onClick={() => copyToClipboard(slot.kakao_id)}
                            className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                            title="클릭하여 복사"
                          >
                            {slot.kakao_id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(slot.kakao_id)}
                            className="p-1 hover:bg-neutral-700 rounded transition"
                            title="복사"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400 hover:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-center ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-500'}`}>
                        {formatDate(slot.expires_at)}
                        {isExpired ? ' (만료됨)' : isExpiringSoon ? ` (${daysRemaining}일)` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="px-3 py-1.5 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openExtendModal(slot)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                              isExpired || isExpiringSoon
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                            }`}
                          >
                            연장
                          </button>
                          <button
                            onClick={() => openStatusModal(slot)}
                            className="px-3 py-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                          >
                            상황판
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* 빈 슬롯 행들 (일반 유저만) */}
                {!isAnyAdmin && emptySlots.map((index) => (
                  <tr key={`empty-${index}`} className="hover:bg-neutral-800/30 transition bg-neutral-900/50">
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <div className="w-12 h-6 rounded-full bg-neutral-800 opacity-30" />
                      </div>
                    </td>
                    {editingSlotIndex === index ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineNewSlot.girlName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, girlName: e.target.value })}
                            placeholder="아가씨 닉네임"
                            className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={inlineNewSlot.shopName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, shopName: e.target.value, customShopName: '' })}
                            className="w-full px-2 py-1 pr-8 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center]"
                          >
                            {SHOP_NAMES.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="기타">기타</option>
                          </select>
                          {inlineNewSlot.shopName === '기타' && (
                            <input
                              type="text"
                              value={inlineNewSlot.customShopName}
                              onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, customShopName: e.target.value })}
                              placeholder="직접 입력"
                              className="w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-center">-</td>
                        <td className="px-4 py-3 text-neutral-600 text-center">-</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleInlineAddSlot(index)}
                              disabled={submitting}
                              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-lg font-medium transition"
                            >
                              {submitting ? '저장중...' : '저장'}
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-400 rounded-lg font-medium transition"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditingSlotIndex(index);
                            setInlineNewSlot({ girlName: '', shopName: shops[0]?.shop_name || '', customShopName: '', customClosingTime: '', targetRoom: '' });
                          }}
                          className="text-neutral-600 hover:text-indigo-400 transition"
                        >
                          + 인원 추가하기
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isAnyAdmin && allSlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                등록된 인원이 없습니다.
              </div>
            )}
            {!isAnyAdmin && slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
          </div>
        </div>

        {/* 모바일 리스트 */}
        <div className="block md:hidden space-y-4">
            {/* 관리자: 전체 슬롯 */}
            {isAnyAdmin && allSlots.filter(s => filterUserIds.length === 0 || filterUserIds.includes(s.user_id)).map((slot) => {
              const daysRemaining = getDaysRemaining(slot.expires_at);
              const isExpiringSoon = daysRemaining <= 7;
              const isExpired = daysRemaining <= 0;

              return (
                <div key={slot.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${!slot.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-6 rounded-full ${slot.is_active ? 'bg-green-500' : 'bg-neutral-700'}`}>
                        <span className={`block w-4 h-4 bg-white rounded-full relative top-1 ${slot.is_active ? 'ml-auto mr-1' : 'ml-1'}`} />
                      </div>
                      <span className="text-sm text-neutral-500">{slot.is_active ? '활성화' : '비활성화'}</span>
                    </div>
                    {(isExpired || isExpiringSoon) && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                        {isExpired ? '만료됨' : `${daysRemaining}일 남음`}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">회원</span>
                      <span className="text-orange-400 font-semibold">{slot.username}</span>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex border-b border-neutral-800 pb-2">
                        <span className="text-neutral-600 w-28 flex-shrink-0">소속</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          slot.distributor_name === '본사'
                            ? 'bg-purple-600/20 text-purple-400'
                            : 'bg-emerald-600/20 text-emerald-400'
                        }`}>
                          {slot.distributor_name || '본사'}
                        </span>
                      </div>
                    )}
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">아가씨 닉네임</span>
                      <span className="text-white font-semibold">{slot.girl_name}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">가게명</span>
                      <span className="text-neutral-400">{slot.shop_name || '-'}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">채팅방</span>
                      <span className="text-neutral-400">{slot.target_room}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2 items-center">
                      <span className="text-neutral-600 w-28 flex-shrink-0">초대할 ID</span>
                      {isSuperAdmin ? (
                        editingSlotKakaoId === slot.id ? (
                          <select
                            defaultValue={slot.kakao_id}
                            onChange={(e) => handleChangeSlotKakaoId(slot.id, e.target.value)}
                            onBlur={() => setEditingSlotKakaoId(null)}
                            autoFocus
                            className="px-2 py-1 bg-neutral-800 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                          >
                            <option value={slot.kakao_id}>{slot.kakao_id}</option>
                            {kakaoInviteIds
                              .filter((k) => k.is_active && k.kakao_id !== slot.kakao_id)
                              .map((k) => (
                                <option key={k.id} value={k.kakao_id}>
                                  {k.kakao_id} {k.description ? `(${k.description})` : ''}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span
                            onClick={() => setEditingSlotKakaoId(slot.id)}
                            className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                            title="클릭하여 수정"
                          >
                            {slot.kakao_id}
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium">
                          {slot.kakao_id}
                        </span>
                      )}
                    </div>
                    <div className="flex">
                      <span className="text-neutral-600 w-28 flex-shrink-0">만료일</span>
                      <span className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-400'}>
                        {formatDate(slot.expires_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(slot)}
                      className="flex-1 py-2 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => openExtendModal(slot)}
                      className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                        isExpired || isExpiringSoon
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                      }`}
                    >
                      연장
                    </button>
                    <button
                      onClick={() => openStatusModal(slot)}
                      className="flex-1 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                    >
                      상황판
                    </button>
                    <button
                      onClick={() => handleAdminDeleteSlot(slot.id)}
                      className="flex-1 py-2 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 일반 유저: 자신의 슬롯만 */}
            {!isAnyAdmin && filteredSlots.map((slot) => {
              const daysRemaining = getDaysRemaining(slot.expires_at);
              const isExpiringSoon = daysRemaining <= 7;
              const isExpired = daysRemaining <= 0;

              return (
                <div key={slot.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${!slot.is_active ? 'opacity-50' : ''}`}>
                  {/* 활성화 토글 + 만료 경고 배지 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSlotActive(slot.id, slot.is_active, slot.expires_at)}
                        className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                          slot.is_active ? 'bg-green-500 justify-end' : 'bg-neutral-700 justify-start'
                        }`}
                      >
                        <span className="block w-4 h-4 bg-white rounded-full" />
                      </button>
                      <span className="text-sm text-neutral-500">{slot.is_active ? '활성화' : '비활성화'}</span>
                    </div>
                    {(isExpired || isExpiringSoon) && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isExpired ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {isExpired ? '만료됨' : `${daysRemaining}일 남음`}
                      </span>
                    )}
                  </div>

                  {/* 정보 테이블 형식 */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">아가씨 닉네임</span>
                      <span className="text-white font-semibold">{slot.girl_name}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">가게명</span>
                      <span className="text-neutral-400">{slot.shop_name || '-'}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2 items-center">
                      <span className="text-neutral-600 w-28 flex-shrink-0">초대할 ID</span>
                      <span
                        onClick={() => copyToClipboard(slot.kakao_id)}
                        className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                        title="클릭하여 복사"
                      >
                        {slot.kakao_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(slot.kakao_id)}
                        className="ml-2 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-amber-400 rounded transition"
                      >
                        복사
                      </button>
                    </div>
                    <div className="flex">
                      <span className="text-neutral-600 w-28 flex-shrink-0">만료일</span>
                      <span className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-400'}>
                        {formatDate(slot.expires_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(slot)}
                      className="flex-1 py-2 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => openExtendModal(slot)}
                      className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                        isExpired || isExpiringSoon
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                      }`}
                    >
                      연장
                    </button>
                    <button
                      onClick={() => openStatusModal(slot)}
                      className="flex-1 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                    >
                      상황판
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 모바일 빈 슬롯 (일반 유저만) */}
            {!isAnyAdmin && emptySlots.map((index) => (
              <div key={`empty-mobile-${index}`} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                {editingSlotIndex === index ? (
                  <div className="space-y-3">
                    <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-3">
                      <p className="text-yellow-400 text-xs">
                        초톡 단톡방에 있는 정확한 아가씨 닉네임을 입력해주세요.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={inlineNewSlot.girlName}
                      onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, girlName: e.target.value })}
                      placeholder="아가씨 닉네임"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <div>
                      <label className="block text-sm text-neutral-500 mb-2">가게명</label>
                      <select
                        value={inlineNewSlot.shopName}
                        onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, shopName: e.target.value, customShopName: '' })}
                        className="w-full px-3 py-2 pr-10 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                      >
                        {shops.map((shop) => (
                          <option key={shop.id} value={shop.shop_name}>{shop.shop_name}</option>
                        ))}
                        <option value="기타">기타 (직접입력)</option>
                      </select>
                      {inlineNewSlot.shopName === '기타' && (
                        <>
                          <input
                            type="text"
                            value={inlineNewSlot.customShopName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, customShopName: e.target.value })}
                            placeholder="가게명 직접 입력"
                            className="w-full mt-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInlineAddSlot(index)}
                        disabled={submitting}
                        className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-lg font-medium transition"
                      >
                        {submitting ? '저장중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelInlineEdit}
                        className="flex-1 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-400 rounded-lg font-medium transition"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSlotIndex(index);
                      setInlineNewSlot({ girlName: '', shopName: shops[0]?.shop_name || '', customShopName: '', customClosingTime: '', targetRoom: '' });
                    }}
                    className="w-full py-6 text-neutral-600 hover:text-indigo-400 transition text-center"
                  >
                    + 인원 추가하기
                  </button>
                )}
              </div>
            ))}
            {isAnyAdmin && allSlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-2xl">
                등록된 인원이 없습니다.
              </div>
            )}
            {!isAnyAdmin && slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-2xl">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
        </div>
    </>
  );
}
