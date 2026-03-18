'use client';

import { useState, useEffect } from 'react';

interface Assignment {
  id: string;
  shop_name: string;
  floor: number;
  name: string;
  phone: string;
  part: number;
  updated_at: string;
}

export default function WaiterLineupTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [shops, setShops] = useState<string[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bulkText, setBulkText] = useState('');
  const [bulkShopName, setBulkShopName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ floor: number; name: string; phone: string; part: number }>({ floor: 0, name: '', phone: '', part: 1 });

  const fetchData = async (shopName?: string) => {
    setLoading(true);
    try {
      const url = shopName
        ? `/api/admin/waiter-lineup?shop_name=${encodeURIComponent(shopName)}`
        : '/api/admin/waiter-lineup';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setShops(data.shops || []);
      }
    } catch {
      console.error('Failed to fetch lineup');
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

  const startEdit = (a: Assignment) => {
    setEditingId(a.id);
    setEditData({ floor: a.floor, name: a.name, phone: a.phone, part: a.part });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch('/api/admin/waiter-lineup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchData(selectedShop || undefined);
      }
    } catch {
      console.error('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/waiter-lineup?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData(selectedShop || undefined);
      }
    } catch {
      console.error('Failed to delete');
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkShopName.trim() || !bulkText.trim()) {
      setBulkResult('가게명과 라인업 텍스트를 입력하세요.');
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/admin/waiter-lineup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName: bulkShopName.trim(), text: bulkText }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkResult(`${data.count}명 저장 완료!`);
        setBulkText('');
        fetchData(selectedShop || undefined);
      } else {
        setBulkResult(`오류: ${data.error}`);
      }
    } catch {
      setBulkResult('서버 오류');
    } finally {
      setBulkLoading(false);
    }
  };

  // part별로 그룹핑
  const part1 = assignments.filter(a => a.part === 1);
  const part2 = assignments.filter(a => a.part === 2);

  const renderTable = (items: Assignment[], partLabel: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-3">{partLabel}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-800">
                <th className="text-left py-2 px-3">층</th>
                <th className="text-left py-2 px-3">이름</th>
                <th className="text-left py-2 px-3">전화번호</th>
                <th className="text-left py-2 px-3">가게</th>
                <th className="text-right py-2 px-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                  {editingId === a.id ? (
                    <>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={editData.floor}
                          onChange={e => setEditData({ ...editData, floor: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          value={editData.name}
                          onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className="w-24 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          value={editData.phone}
                          onChange={e => setEditData({ ...editData, phone: e.target.value })}
                          className="w-32 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
                        />
                      </td>
                      <td className="py-2 px-3 text-neutral-400">{a.shop_name}</td>
                      <td className="py-2 px-3 text-right space-x-2">
                        <button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded text-xs">저장</button>
                        <button onClick={cancelEdit} className="px-2 py-1 bg-neutral-700 text-white rounded text-xs">취소</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 text-white font-bold">{a.floor}층</td>
                      <td className="py-2 px-3 text-white">{a.name}</td>
                      <td className="py-2 px-3 text-neutral-300">{a.phone}</td>
                      <td className="py-2 px-3 text-neutral-400">{a.shop_name}</td>
                      <td className="py-2 px-3 text-right space-x-2">
                        <button onClick={() => startEdit(a)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">수정</button>
                        <button onClick={() => handleDelete(a.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">삭제</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 가게 필터 */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-neutral-400 text-sm">가게 필터:</span>
          <button
            onClick={() => handleShopFilter('')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              selectedShop === '' ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            전체
          </button>
          {shops.map(shop => (
            <button
              key={shop}
              onClick={() => handleShopFilter(shop)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                selectedShop === shop ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {shop}
            </button>
          ))}
        </div>
      </div>

      {/* 현재 라인업 */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h2 className="text-xl font-bold text-white mb-4">현재 라인업</h2>
        {loading ? (
          <p className="text-neutral-400">로딩 중...</p>
        ) : assignments.length === 0 ? (
          <p className="text-neutral-400">라인업 데이터가 없습니다.</p>
        ) : (
          <>
            {renderTable(part1, '1부')}
            {renderTable(part2, '2부')}
          </>
        )}
      </div>

      {/* 일괄 입력 */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h2 className="text-xl font-bold text-white mb-4">라인업 일괄 입력</h2>
        <p className="text-neutral-400 text-sm mb-3">
          공지방 형식 그대로 붙여넣기 하면 자동 파싱됩니다. 해당 부(1부/2부)만 업데이트됩니다.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">가게명</label>
            <input
              value={bulkShopName}
              onChange={e => setBulkShopName(e.target.value)}
              placeholder="예: 도파민"
              className="w-full max-w-xs px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">라인업 텍스트</label>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={`1부 라인업\n10. 명태 01076749210\n9.  종서 01093304446\n...\n\n2부 라인업\n10층 감자 010 2307 4823\n9층   세준 010 8019 4674\n...`}
              rows={12}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono focus:ring-2 focus:ring-pink-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkSubmit}
              disabled={bulkLoading}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 disabled:opacity-50 transition"
            >
              {bulkLoading ? '처리 중...' : '일괄 적용'}
            </button>
            {bulkResult && (
              <span className={`text-sm ${bulkResult.includes('완료') ? 'text-green-400' : 'text-red-400'}`}>
                {bulkResult}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
