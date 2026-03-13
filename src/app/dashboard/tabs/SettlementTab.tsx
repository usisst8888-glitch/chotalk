'use client';

import { Settlement } from '../types';

interface SettlementTabProps {
  settlements: Settlement[];
  settlementMonth: string;
  setSettlementMonth: (month: string) => void;
  settlementLoading: boolean;
  isSuperAdmin: boolean;
  fetchSettlements: (month?: string) => void;
}

export default function SettlementTab({
  settlements,
  settlementMonth,
  setSettlementMonth,
  settlementLoading,
  isSuperAdmin,
  fetchSettlements,
}: SettlementTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <p className="text-amber-400 text-sm font-medium">정산 안내</p>
        <p className="text-neutral-300 text-xs mt-1">정산 기간: 매월 1일 ~ 말일 | 입금 일정: 다음 달 1~5일 이내 입금</p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">정산</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={settlementMonth}
            onChange={(e) => {
              setSettlementMonth(e.target.value);
              fetchSettlements(e.target.value);
            }}
            className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>
      {settlementLoading ? (
        <div className="text-center py-12 text-neutral-400">로딩 중...</div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-12 text-neutral-600">정산 데이터가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {settlements.map((s) => (
            <div key={s.distributorId} className="p-5 bg-neutral-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-lg">{s.siteName}</span>
                  <span className="text-neutral-400 text-sm">({s.username})</span>
                  {s.isPaid ? (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">입금 완료</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">미입금</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-neutral-500 text-xs block">정산 금액</span>
                    <span className={`font-bold text-xl ${s.settlementAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.settlementAmount.toLocaleString()}원
                    </span>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={async () => {
                        if (s.isPaid) {
                          if (!confirm('입금 취소하시겠습니까?')) return;
                          try {
                            const res = await fetch('/api/admin/settlement', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                              body: JSON.stringify({ distributorId: s.distributorId, month: settlementMonth, isPaid: false }),
                            });
                            if (res.ok) fetchSettlements(settlementMonth);
                            else alert('처리에 실패했습니다.');
                          } catch { alert('오류가 발생했습니다.'); }
                        } else {
                          const amountStr = prompt(`${s.siteName}에 입금할 금액을 입력하세요.`, String(s.settlementAmount));
                          if (amountStr === null) return;
                          const paidAmount = parseInt(amountStr.replace(/,/g, ''));
                          if (isNaN(paidAmount) || paidAmount <= 0) { alert('올바른 금액을 입력해주세요.'); return; }
                          try {
                            const res = await fetch('/api/admin/settlement', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                              body: JSON.stringify({ distributorId: s.distributorId, month: settlementMonth, isPaid: true, paidAmount }),
                            });
                            if (res.ok) fetchSettlements(settlementMonth);
                            else alert('처리에 실패했습니다.');
                          } catch { alert('오류가 발생했습니다.'); }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        s.isPaid
                          ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {s.isPaid ? '입금 취소' : '입금 처리'}
                    </button>
                  )}
                </div>
              </div>
              {s.isPaid && s.paidAt && (
                <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                  <span className="text-emerald-400 text-xs">입금 완료: {new Date(s.paidAt).toLocaleDateString('ko-KR')}</span>
                  <span className="text-emerald-400 text-sm font-bold">{s.paidAmount.toLocaleString()}원 입금</span>
                </div>
              )}

              {/* 계좌 정보 */}
              <div className="mb-4 p-3 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-400 text-xs">정산 입금 계좌</span>
                <p className="text-emerald-400 font-medium mt-1">
                  {s.bankName && s.accountNumber
                    ? `${s.bankName} ${s.accountNumber} ${s.accountHolder || ''}`
                    : '미설정'}
                </p>
              </div>

              {/* 정산 상세 */}
              <div className="p-3 bg-neutral-700/30 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">총 판매 인원수</span>
                  <span className="text-white font-medium">{s.totalSlotCount}건</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">총 판매 금액 (유저 입금)</span>
                  <span className="text-white">{s.totalSalesAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-300">본사 입금액 ({s.costPrice.toLocaleString()}원 × {s.totalSlotCount}건)</span>
                  <span className="text-red-400">-{s.costToHQ.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-600">
                  <span className="text-neutral-300 font-medium">정산 금액 (총판 수익)</span>
                  <span className={`font-bold ${s.settlementAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.settlementAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-neutral-300">소속 유저</span>
                  <span className="text-neutral-400">{s.userCount}명</span>
                </div>
              </div>
            </div>
          ))}

          {/* 전체 합계 */}
          <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-400 text-sm">전체 판매 금액</span>
              <span className="text-white font-medium">
                {settlements.reduce((sum, s) => sum + s.totalSalesAmount, 0).toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-400 text-sm">전체 본사 입금액</span>
              <span className="text-red-400 font-medium">
                -{settlements.reduce((sum, s) => sum + s.costToHQ, 0).toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-amber-600/30">
              <span className="text-amber-400 font-medium">전체 정산 금액</span>
              <span className="text-amber-400 font-bold text-2xl">
                {settlements.reduce((sum, s) => sum + s.settlementAmount, 0).toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
