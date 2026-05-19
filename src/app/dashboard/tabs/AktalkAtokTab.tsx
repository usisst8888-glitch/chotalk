'use client';

import { useEffect, useState } from 'react';

interface AktalkAtokRoom {
  room_name: string;
  shop_name: string | null;
  team_name: string | null;
  sent_count: number;
  unsent_count: number;
  total: number;
  latest_received_at: string | null;
}

export default function AktalkAtokTab() {
  const [rooms, setRooms] = useState<AktalkAtokRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resettingRoom, setResettingRoom] = useState<string | null>(null);
  const [purgingRoom, setPurgingRoom] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/aktalk-atok');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || '조회 실패');
      }
    } catch {
      alert('조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleReset = async (roomName: string, unsentCount: number) => {
    if (unsentCount === 0) {
      alert('미발송 메시지가 없습니다.');
      return;
    }
    if (!confirm(`"${roomName}" 방의 미발송 ${unsentCount}건을 모두 발송완료로 변경하시겠습니까?`)) return;
    setResettingRoom(roomName);
    try {
      const res = await fetch('/api/admin/aktalk-atok', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`${data.updated ?? 0}건이 발송완료로 변경되었습니다.`);
        fetchRooms();
      } else {
        alert(data?.error || '변경 실패');
      }
    } catch {
      alert('변경 실패');
    } finally {
      setResettingRoom(null);
    }
  };

  const handlePurgeRoom = async (roomName: string, total: number) => {
    if (total === 0) {
      alert('삭제할 데이터가 없습니다.');
      return;
    }
    if (!confirm(`"${roomName}" 방의 전체 ${total.toLocaleString()}건을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    setPurgingRoom(roomName);
    try {
      const res = await fetch(`/api/admin/aktalk-atok?room_name=${encodeURIComponent(roomName)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`${data.deleted ?? 0}건이 삭제되었습니다.`);
        fetchRooms();
      } else {
        alert(data?.error || '삭제 실패');
      }
    } catch {
      alert('삭제 실패');
    } finally {
      setPurgingRoom(null);
    }
  };

  const filteredRooms = rooms.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.room_name.toLowerCase().includes(q) ||
      (r.shop_name ?? '').toLowerCase().includes(q) ||
      (r.team_name ?? '').toLowerCase().includes(q)
    );
  });

  const totalSent = rooms.reduce((s, r) => s + r.sent_count, 0);
  const totalUnsent = rooms.reduce((s, r) => s + r.unsent_count, 0);

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">아톡 발송 관리</h2>
          <p className="text-sm text-neutral-500 mt-1">
            전체 발송완료 <span className="text-emerald-400 font-semibold">{totalSent.toLocaleString()}</span>건 ·
            미발송 <span className="text-amber-400 font-semibold ml-1">{totalUnsent.toLocaleString()}</span>건
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="방이름/가게/팀 검색"
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
          <button
            onClick={fetchRooms}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition"
          >
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-neutral-500 text-center py-8">로딩 중...</p>
      ) : filteredRooms.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-400">방이름</th>
                <th className="w-[120px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">가게</th>
                <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">팀</th>
                <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">발송완료</th>
                <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">미발송</th>
                <th className="w-[140px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">최근 수신</th>
                <th className="w-[220px] px-4 py-3 text-center text-sm font-semibold text-neutral-400">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRooms.map((room) => (
                <tr key={room.room_name} className="hover:bg-neutral-800/30">
                  <td className="px-4 py-3 text-white text-sm break-all">{room.room_name}</td>
                  <td className="px-4 py-3 text-center text-neutral-300 text-sm">{room.shop_name || '-'}</td>
                  <td className="px-4 py-3 text-center text-neutral-300 text-sm">{room.team_name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                      {room.sent_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30">
                      {room.unsent_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-400 text-xs">
                    {room.latest_received_at
                      ? new Date(room.latest_received_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => handleReset(room.room_name, room.unsent_count)}
                        disabled={resettingRoom === room.room_name || room.unsent_count === 0}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition"
                      >
                        {resettingRoom === room.room_name ? '변경 중...' : '발송완료로 변경'}
                      </button>
                      <button
                        onClick={() => handlePurgeRoom(room.room_name, room.total)}
                        disabled={purgingRoom === room.room_name || room.total === 0}
                        className="px-2.5 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition"
                      >
                        {purgingRoom === room.room_name ? '삭제 중...' : '방 초기화'}
                      </button>
                    </div>
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
