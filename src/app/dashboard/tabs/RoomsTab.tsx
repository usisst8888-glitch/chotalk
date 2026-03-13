'use client';

interface RoomsTabProps {
  rooms: Array<{ id: string; room_number: string; shop_name: string; room_start_time: string; room_end_time: string | null; is_active: boolean; created_at: string }>;
  roomsLoading: boolean;
  roomShopFilter: string;
  setRoomShopFilter: (filter: string) => void;
  roomStatusFilter: 'all' | 'active' | 'ended';
  setRoomStatusFilter: (filter: 'all' | 'active' | 'ended') => void;
  roomSort: 'start_desc' | 'start_asc' | 'end_desc' | 'end_asc';
  setRoomSort: (sort: 'start_desc' | 'start_asc' | 'end_desc' | 'end_asc') => void;
  eventTimes: Array<{ id: string; shop_name: string; start_time: string; end_time: string; is_active: boolean; address: string | null }>;
  fetchRooms: () => void;
}

export default function RoomsTab({
  rooms,
  roomsLoading,
  roomShopFilter,
  setRoomShopFilter,
  roomStatusFilter,
  setRoomStatusFilter,
  roomSort,
  setRoomSort,
  eventTimes,
  fetchRooms,
}: RoomsTabProps) {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-white">방상태</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roomShopFilter}
            onChange={(e) => setRoomShopFilter(e.target.value)}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            <option value="all">전체 가게</option>
            {eventTimes.map((et) => (
              <option key={et.id} value={et.shop_name}>{et.shop_name}</option>
            ))}
          </select>
          <select
            value={roomStatusFilter}
            onChange={(e) => setRoomStatusFilter(e.target.value as 'all' | 'active' | 'ended')}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="ended">종료</option>
          </select>
          <select
            value={roomSort}
            onChange={(e) => setRoomSort(e.target.value as 'start_desc' | 'start_asc' | 'end_desc' | 'end_asc')}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            <option value="start_desc">시작시간 최신순</option>
            <option value="start_asc">시작시간 오래된순</option>
            <option value="end_desc">종료시간 최신순</option>
            <option value="end_asc">종료시간 오래된순</option>
          </select>
          <button
            onClick={fetchRooms}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition"
          >
            새로고침
          </button>
        </div>
      </div>
      {roomsLoading ? (
        <p className="text-neutral-500 text-center py-8">로딩 중...</p>
      ) : rooms.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">등록된 방이 없습니다.</p>
      ) : (() => {
        const filteredRooms = rooms
          .filter(r => roomShopFilter === 'all' || r.shop_name === roomShopFilter)
          .filter(r => roomStatusFilter === 'all' || (roomStatusFilter === 'active' ? r.is_active : !r.is_active))
          .sort((a, b) => {
            const getTime = (t: string | null) => t ? new Date(t).getTime() : 0;
            switch (roomSort) {
              case 'start_desc': return getTime(b.room_start_time) - getTime(a.room_start_time);
              case 'start_asc': return getTime(a.room_start_time) - getTime(b.room_start_time);
              case 'end_desc': return getTime(b.room_end_time) - getTime(a.room_end_time);
              case 'end_asc': return getTime(a.room_end_time) - getTime(b.room_end_time);
              default: return 0;
            }
          });
        return filteredRooms.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">조건에 맞는 방이 없습니다.</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="w-[80px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">방번호</th>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">가게명</th>
                <th className="w-[80px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">상태</th>
                <th className="w-[160px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">시작시간</th>
                <th className="w-[160px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">종료시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-center text-white font-medium">{room.room_number}</td>
                  <td className="px-4 py-3 text-center text-neutral-300">{room.shop_name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      room.is_active
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-neutral-700/30 text-neutral-500 border border-neutral-700/30'
                    }`}>
                      {room.is_active ? '활성' : '종료'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                    {room.room_start_time ? new Date(room.room_start_time).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400 text-sm">
                    {room.room_end_time ? new Date(room.room_end_time).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        );
      })()}
    </div>
  );
}
