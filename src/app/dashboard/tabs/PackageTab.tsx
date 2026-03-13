'use client';

import { useState } from 'react';

export default function PackageTab() {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({ depositorName: '' });
  const [submitting, setSubmitting] = useState(false);

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

    if (!applyForm.depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: API 연동
      alert('패키지 신청이 완료되었습니다. 입금 확인 후 활성화됩니다.');
      setShowApplyModal(false);
      setApplyForm({ depositorName: '' });
    } catch {
      alert('서비스 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">패키지</h2>
            <p className="text-neutral-400 text-sm mt-1">스타트톡 + 심부름톡 + 초이스톡을 한 번에 이용할 수 있는 패키지입니다.</p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition"
          >
            패키지 신청
          </button>
        </div>

        {/* 패키지 구성 안내 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 text-center">
            <p className="text-indigo-400 font-bold text-lg mb-1">스타트톡</p>
            <p className="text-neutral-400 text-sm">아가씨 등록 10개</p>
          </div>
          <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-4 text-center">
            <p className="text-teal-400 font-bold text-lg mb-1">심부름톡</p>
            <p className="text-neutral-400 text-sm">아톡→웨톡 전달</p>
          </div>
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-4 text-center">
            <p className="text-violet-400 font-bold text-lg mb-1">초이스톡</p>
            <p className="text-neutral-400 text-sm">초톡→아톡 전달</p>
          </div>
        </div>

        <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-4 text-center">
          <p className="text-neutral-400 text-sm">개별 구매 시 총 <span className="text-neutral-500 line-through">350,000원</span></p>
          <p className="text-rose-400 font-bold text-2xl mt-1">패키지 특가 300,000원<span className="text-sm font-normal text-neutral-400"> /월</span></p>
        </div>
      </div>

      {/* 패키지 신청 모달 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">패키지 신청</h3>
            <form onSubmit={handleApply} className="space-y-4">
              {/* 패키지 구성 */}
              <div className="bg-neutral-800 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-400">스타트톡</span>
                  <span className="text-neutral-500 text-sm">포함</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-teal-400">심부름톡</span>
                  <span className="text-neutral-500 text-sm">포함</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-violet-400">초이스톡</span>
                  <span className="text-neutral-500 text-sm">포함</span>
                </div>
                <div className="border-t border-neutral-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">패키지 합계</span>
                    <span className="text-rose-400 font-bold text-lg">300,000원/월</span>
                  </div>
                </div>
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
                        className="px-2 py-1 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded transition"
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
                      <span className="text-neutral-500 text-sm">패키지 (월)</span>
                      <span className="text-yellow-400 font-bold">300,000원</span>
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
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ 입금자명이 정확해야 입금 확인이 가능합니다!
                </p>
                <p className="text-red-300 text-xs mt-1">
                  입금 후 관리자 확인 후 전체 서비스가 활성화됩니다.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplyForm({ depositorName: '' });
                  }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? '신청 중...' : '패키지 신청하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
