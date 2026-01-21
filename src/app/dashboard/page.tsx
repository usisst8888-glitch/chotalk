'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Chotalk</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            환영합니다, {user?.username}님!
          </h2>
          <p className="text-gray-400 mb-8">
            대시보드 페이지입니다. 여기에 채팅 기능이 추가될 예정입니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
              <h3 className="font-semibold text-indigo-400 mb-2">내 정보</h3>
              <p className="text-sm text-gray-300">{user?.email}</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
              <h3 className="font-semibold text-emerald-400 mb-2">채팅</h3>
              <p className="text-sm text-gray-300">준비 중...</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
              <h3 className="font-semibold text-purple-400 mb-2">설정</h3>
              <p className="text-sm text-gray-300">준비 중...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
