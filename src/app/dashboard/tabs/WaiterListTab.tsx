'use client';

import { useState, useEffect } from 'react';

interface WaiterAssignment {
  id: string;
  shop_name: string;
  room_number: string;
  waiter_name: string;
  updated_at: string;
}

export default function WaiterListTab() {
  const [assignments, setAssignments] = useState<WaiterAssignment[]>([]);
  const [shops, setShops] = useState<string[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingShop, setClearingShop] = useState(false);

  const fetchData = async (shopName?: string) => {
    setLoading(true);
    try {
      const url = shopName
        ? `/api/admin/waiter-list?shop_name=${encodeURIComponent(shopName)}`
        : '/api/admin/waiter-list';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setShops(data.shops || []);
      }
    } catch {
      console.error('Failed to fetch waiter list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShopFilter = (shop: string) => {
    setSelectedShop(shop);
    fetchData(shop || undefined);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/waiter-list?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id));
      }
    } catch {
      alert('삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearShop = async () => {
    if (!selectedShop) return;
    if (!confirm(`"${selectedShop}" 가게의 웨이터 배정을 전부 삭제하시겠습니까?`)) return;
    setClearingShop(true);
    try {
      const res = await fetch(`/api/admin/waiter-list?shop_name=${encodeURIComponent(selectedShop)}`, { method: 'DELETE' });
      if (res.ok) {
        setAssignments([]);
      }
    } catch {
      alert('삭제 실패');
    } finally {
      setClearingShop(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">웨이터 배정 목록</h2>
        <span className="text-sm text-neutral-400">총 {assignments.length}건</span>
      </div>

      {/* 가게 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShopFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            selectedShop === ''
              ? 'bg-orange-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          전체
        </button>
        {shops.map(shop => (
          <button
            key={shop}
            onClick={() => handleShopFilter(shop)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedShop === shop
                ? 'bg-orange-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {shop}
          </button>
        ))}
        {selectedShop && (
          <button
            onClick={handleClearShop}
            disabled={clearingShop}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-900 text-red-300 hover:bg-red-800 transition disabled:opacity-50 ml-auto"
          >
            {clearingShop ? '삭제 중...' : `"${selectedShop}" 전체 삭제`}
          </button>
        )}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center text-neutral-400 py-12">로딩 중...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center text-neutral-500 py-12">웨이터 배정 데이터가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 text-left">
                <th className="px-4 py-3 font-medium">가게</th>
                <th className="px-4 py-3 font-medium">방번호</th>
                <th className="px-4 py-3 font-medium">웨이터</th>
                <th className="px-4 py-3 font-medium">업데이트</th>
                <th className="px-4 py-3 font-medium text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-t border-neutral-800 ${i % 2 === 0 ? 'bg-neutral-950' : 'bg-neutral-900/50'}`}
                >
                  <td className="px-4 py-3 text-neutral-300">{a.shop_name}</td>
                  <td className="px-4 py-3 font-mono text-orange-400 font-bold">{a.room_number}</td>
                  <td className="px-4 py-3 text-white font-medium">{a.waiter_name}</td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{formatTime(a.updated_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="text-red-500 hover:text-red-400 disabled:opacity-50 transition text-xs"
                    >
                      {deletingId === a.id ? '...' : '삭제'}
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
