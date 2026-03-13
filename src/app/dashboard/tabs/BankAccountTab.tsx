'use client';

interface BankAccountTabProps {
  distBankName: string;
  setDistBankName: (name: string) => void;
  distAccountNumber: string;
  setDistAccountNumber: (number: string) => void;
  distAccountHolder: string;
  setDistAccountHolder: (holder: string) => void;
  distSlotPrice: number;
  setDistSlotPrice: (price: number) => void;
  bankAccountSaving: boolean;
  handleSaveBankAccount: () => void;
}

export default function BankAccountTab({
  distBankName,
  setDistBankName,
  distAccountNumber,
  setDistAccountNumber,
  distAccountHolder,
  setDistAccountHolder,
  distSlotPrice,
  setDistSlotPrice,
  bankAccountSaving,
  handleSaveBankAccount,
}: BankAccountTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6">총판 설정</h2>

      {/* 입금 계좌 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-neutral-300 mb-3">입금 계좌</h3>
        <p className="text-neutral-500 text-xs mb-3">본사에서 정산금을 입금할 계좌를 설정합니다.</p>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">은행명</label>
            <input
              type="text"
              value={distBankName}
              onChange={(e) => setDistBankName(e.target.value)}
              placeholder="예: 국민은행"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">계좌번호</label>
            <input
              type="text"
              value={distAccountNumber}
              onChange={(e) => setDistAccountNumber(e.target.value)}
              placeholder="예: 123-456-789012"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">예금주</label>
            <input
              type="text"
              value={distAccountHolder}
              onChange={(e) => setDistAccountHolder(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* 판매 금액 */}
      <div className="mb-6 pt-6 border-t border-neutral-700">
        <h3 className="text-sm font-medium text-neutral-300 mb-3">판매 금액</h3>
        <p className="text-neutral-500 text-xs mb-3">유저에게 인원 판매/연장 시 적용되는 금액입니다.</p>
        <div className="max-w-md">
          <label className="block text-xs text-neutral-400 mb-1">판매 금액 (원)</label>
          <input
            type="number"
            value={distSlotPrice}
            onChange={(e) => setDistSlotPrice(parseInt(e.target.value) || 0)}
            placeholder="100000"
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          />
          <p className="text-neutral-500 text-xs mt-1">인원 구매 및 연장에 동일하게 적용됩니다.</p>
        </div>
      </div>

      <button
        onClick={handleSaveBankAccount}
        disabled={bankAccountSaving}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition"
      >
        {bankAccountSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  );
}
