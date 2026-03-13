'use client';

interface ExtensionsTabProps {
  extensionRequests: Array<{ id: string; username: string; depositor_name: string; slot_count: number; total_amount: number; created_at: string }>;
  extensionsLoading: boolean;
  handleApproveExtension: (requestId: string) => void;
}

export default function ExtensionsTab({
  extensionRequests,
  extensionsLoading,
  handleApproveExtension,
}: ExtensionsTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6">연장 요청</h2>
      {extensionsLoading ? (
        <p className="text-neutral-500 text-center py-8">로딩 중...</p>
      ) : extensionRequests.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">대기 중인 연장 요청이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">신청일</th>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">회원명</th>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">입금자명</th>
                <th className="w-[80px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">인원수</th>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">금액</th>
                <th className="w-[80px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">승인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {extensionRequests.map((req) => (
                <tr key={req.id} className="hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                    {new Date(req.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center text-white">{req.username}</td>
                  <td className="px-4 py-3 text-center text-yellow-400 font-medium">{req.depositor_name}</td>
                  <td className="px-4 py-3 text-center text-neutral-300">{req.slot_count}명</td>
                  <td className="px-4 py-3 text-center text-neutral-300">{req.total_amount.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleApproveExtension(req.id)}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition"
                    >
                      승인
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
