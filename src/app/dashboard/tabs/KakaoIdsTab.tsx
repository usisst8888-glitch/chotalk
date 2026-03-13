'use client';

interface KakaoIdsTabProps {
  kakaoInviteIds: Array<{ id: string; kakao_id: string; description: string | null; is_active: boolean; created_at: string; slot_count: number }>;
  kakaoIdsLoading: boolean;
  setShowAddKakaoIdModal: (show: boolean) => void;
  editingKakaoIdDescription: string | null;
  setEditingKakaoIdDescription: (id: string | null) => void;
  editDescriptionValue: string;
  setEditDescriptionValue: (value: string) => void;
  handleToggleKakaoIdActive: (id: string, currentActive: boolean) => void;
  handleDeleteKakaoId: (id: string) => void;
  handleUpdateKakaoIdDescription: (id: string, description: string) => void;
}

export default function KakaoIdsTab({
  kakaoInviteIds,
  kakaoIdsLoading,
  setShowAddKakaoIdModal,
  editingKakaoIdDescription,
  setEditingKakaoIdDescription,
  editDescriptionValue,
  setEditDescriptionValue,
  handleToggleKakaoIdActive,
  handleDeleteKakaoId,
  handleUpdateKakaoIdDescription,
}: KakaoIdsTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">초대 카카오 아이디 관리</h2>
        <button
          onClick={() => setShowAddKakaoIdModal(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition"
        >
          + 아이디 추가
        </button>
      </div>
      {kakaoIdsLoading ? (
        <div className="text-center py-12 text-neutral-400">로딩 중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">카카오 아이디</th>
                <th className="text-left px-4 py-3 text-neutral-500 font-medium">설명</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">등록 수</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">상태</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">등록일</th>
                <th className="text-center px-4 py-3 text-neutral-500 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {kakaoInviteIds.map((item) => (
                <tr key={item.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                  <td className="px-4 py-3 text-white font-medium">{item.kakao_id}</td>
                  <td className="px-4 py-3">
                    {editingKakaoIdDescription === item.id ? (
                      <input
                        type="text"
                        value={editDescriptionValue}
                        onChange={(e) => setEditDescriptionValue(e.target.value)}
                        onBlur={() => {
                          handleUpdateKakaoIdDescription(item.id, editDescriptionValue);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateKakaoIdDescription(item.id, editDescriptionValue);
                          } else if (e.key === 'Escape') {
                            setEditingKakaoIdDescription(null);
                          }
                        }}
                        autoFocus
                        className="px-2 py-1 bg-neutral-800 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                        placeholder="설명 입력"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingKakaoIdDescription(item.id);
                          setEditDescriptionValue(item.description || '');
                        }}
                        className="text-neutral-400 cursor-pointer hover:text-white transition"
                        title="클릭하여 수정"
                      >
                        {item.description || '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.slot_count > 0
                        ? 'bg-indigo-600/20 text-indigo-400'
                        : 'bg-neutral-700 text-neutral-500'
                    }`}>
                      {item.slot_count}명
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleKakaoIdActive(item.id, item.is_active)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.is_active
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {item.is_active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-500 text-sm">
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteKakaoId(item.id)}
                      className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kakaoInviteIds.length === 0 && (
            <div className="text-center py-12 text-neutral-600">
              등록된 카카오 아이디가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
