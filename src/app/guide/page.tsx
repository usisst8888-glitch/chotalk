'use client';

import { useRouter } from 'next/navigation';

export default function GuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="초톡" className="h-12" />
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">사용방법</span>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
          >
            뒤로가기
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 1. 슬롯 추가 */}
        <section className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</span>
            <h2 className="text-xl font-bold text-white">슬롯 추가하기</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <p>1. 대시보드에서 <span className="text-indigo-400 font-semibold">+ 추가</span> 버튼을 클릭합니다.</p>
            <p>2. <span className="text-yellow-400">아가씨 닉네임</span>을 정확하게 입력합니다.</p>
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mt-3">
              <p className="text-yellow-400 text-sm">
                초이스톡 단톡방에 있는 정확한 아가씨 닉네임을 입력해주셔야 자동 발송이 가능합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 2. 슬롯 관리 */}
        <section className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">2</span>
            <h2 className="text-xl font-bold text-white">슬롯 관리하기</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-sm font-medium">수정</span>
              <p>아가씨 닉네임이나 채팅방 이름을 변경할 수 있습니다.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm font-medium">연장</span>
              <p>슬롯 기간을 연장합니다. 계좌번호 안내가 표시됩니다.</p>
            </div>
          </div>
        </section>

        {/* 3. 초대할 ID */}
        <section className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">3</span>
            <h2 className="text-xl font-bold text-white">초대할 ID 사용하기</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <p>각 슬롯에 표시된 <span className="text-indigo-400 font-semibold">초대할 ID</span>를 복사하여 카카오톡 채팅방에 초대하세요.</p>
            <p><span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-sm">복사</span> 버튼을 누르면 클립보드에 복사됩니다.</p>
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mt-3">
              <p className="text-red-400 font-semibold text-sm mb-2">중요 포인트</p>
              <p className="text-red-300 text-sm">봇을 초대후 아가씨 닉네임 입력 1회 꼭 해주셔야 합니다.</p>
            </div>
          </div>
        </section>

        {/* 4. 만료일 안내 */}
        <section className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">4</span>
            <h2 className="text-xl font-bold text-white">만료일 확인하기</h2>
          </div>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs">7일 남음</span>
              <p>만료 7일 전부터 노란색으로 표시됩니다. 미리 연장해주세요.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded-full text-xs">만료됨</span>
              <p>만료된 슬롯은 빨간색으로 표시됩니다. 연장이 필요합니다.</p>
            </div>
          </div>
        </section>

        {/* 5. 문의 */}
        <section className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">?</span>
            <h2 className="text-xl font-bold text-white">문의하기</h2>
          </div>
          <div className="text-gray-300">
            <p>사용 중 문제가 발생하거나 궁금한 점이 있으시면 관리자에게 문의해주세요.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
