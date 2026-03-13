'use client';

interface EventTimesTabProps {
  eventTimes: Array<{ id: string; shop_name: string; start_time: string; end_time: string; is_active: boolean; address: string | null }>;
  eventTimesLoading: boolean;
  editingEventTime: string | null;
  setEditingEventTime: (id: string | null) => void;
  handleUpdateEventTime: (id: string, startTime: string, endTime: string, address?: string) => void;
}

export default function EventTimesTab({
  eventTimes,
  eventTimesLoading,
  editingEventTime,
  setEditingEventTime,
  handleUpdateEventTime,
}: EventTimesTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h2 className="text-xl font-bold text-white mb-6">가게 관리</h2>
      {eventTimesLoading ? (
        <div className="text-center py-12 text-neutral-400">로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {eventTimes.map((item) => (
            <div key={item.id} className="p-4 bg-neutral-800 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-lg">{item.shop_name}</span>
                {editingEventTime !== item.id && (
                  <button
                    onClick={() => setEditingEventTime(item.id)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition"
                  >
                    수정
                  </button>
                )}
              </div>
              {editingEventTime === item.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-neutral-400 text-sm w-20">이벤트 시간</label>
                    <input
                      type="text"
                      id={`start-${item.id}`}
                      defaultValue={item.start_time.slice(0, 5)}
                      placeholder="15:00"
                      className="w-20 px-2 py-1 bg-neutral-700 border border-purple-500 rounded text-white text-center focus:outline-none text-sm"
                    />
                    <span className="text-neutral-400">~</span>
                    <input
                      type="text"
                      id={`end-${item.id}`}
                      defaultValue={item.end_time.slice(0, 5)}
                      placeholder="21:00"
                      className="w-20 px-2 py-1 bg-neutral-700 border border-purple-500 rounded text-white text-center focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-neutral-400 text-sm w-20">주소</label>
                    <input
                      type="text"
                      id={`address-${item.id}`}
                      defaultValue={item.address || ''}
                      placeholder="가게 주소 입력"
                      className="flex-1 px-3 py-1 bg-neutral-700 border border-purple-500 rounded text-white focus:outline-none text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingEventTime(null)}
                      className="px-3 py-1 bg-neutral-600 hover:bg-neutral-500 rounded text-white text-sm transition"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        const startInput = document.getElementById(`start-${item.id}`) as HTMLInputElement;
                        const endInput = document.getElementById(`end-${item.id}`) as HTMLInputElement;
                        const addressInput = document.getElementById(`address-${item.id}`) as HTMLInputElement;
                        const startVal = startInput?.value;
                        const endVal = endInput?.value;
                        const addressVal = addressInput?.value;
                        if (/^\d{1,2}:\d{2}$/.test(startVal) && /^\d{1,2}:\d{2}$/.test(endVal)) {
                          handleUpdateEventTime(item.id, startVal, endVal, addressVal);
                        } else {
                          alert('시간 형식이 올바르지 않습니다. (예: 15:00)');
                        }
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-sm w-20">이벤트 시간</span>
                    <span className="text-purple-400 font-medium">
                      {item.start_time.slice(0, 5)} ~ {item.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-sm w-20">주소</span>
                    <span className="text-neutral-300">
                      {item.address || '(미등록)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {eventTimes.length === 0 && (
            <div className="text-center py-12 text-neutral-600">
              등록된 가게가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
