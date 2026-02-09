'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface Slot {
  id: string;
  girl_name: string;
  shop_name: string | null;  // 가게명
  target_room: string;  // 발송할 채팅방
  kakao_id: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

// 가게명 프리셋
const SHOP_NAMES = ['도파민', '유앤미', '달토', '퍼펙트', '엘리트'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotCount, setSlotCount] = useState(0);
  const [usedSlots, setUsedSlots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusRecord, setStatusRecord] = useState<{
    id: string; room_number: string; girl_name: string; start_time: string;
    usage_duration: number | null; is_designated: boolean; event_count: number | null;
    trigger_type: string; is_in_progress: boolean;
  } | null>(null);
  const [statusForm, setStatusForm] = useState({
    room_number: '', start_time: '', usage_duration: '',
    is_designated: false, event_count: '',
  });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [newSlot, setNewSlot] = useState({ girlName: '', shopName: '', customShopName: '', customClosingTime: '', targetRoom: '' });
  const [editSlot, setEditSlot] = useState({ girlName: '', shopName: '', customShopName: '', customClosingTime: '', targetRoom: '' });
  const [shops, setShops] = useState<Array<{ id: string; shop_name: string; start_time: string; end_time: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSlotPurchaseModal, setShowSlotPurchaseModal] = useState(false);
  const [showExtendAllModal, setShowExtendAllModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [inlineNewSlot, setInlineNewSlot] = useState({ girlName: '', shopName: '', customShopName: '', customClosingTime: '', targetRoom: '' });
  const [purchaseForm, setPurchaseForm] = useState({ depositorName: '', slotCount: 1 });
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [extendForm, setExtendForm] = useState({ depositorName: '' });
  const [activeTab, setActiveTab] = useState<'slots' | 'users' | 'kakaoIds' | 'eventTimes'>('slots');
  // 관리자용 회원관리
  const [allUsers, setAllUsers] = useState<Array<{ id: string; username: string; role: string; slot_count: number; created_at: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  // 관리자용 전체 인원관리
  const [allSlots, setAllSlots] = useState<Array<Slot & { username: string }>>([]);
  const [allSlotsLoading, setAllSlotsLoading] = useState(false);
  // 관리자용 카카오 초대 아이디 관리
  const [kakaoInviteIds, setKakaoInviteIds] = useState<Array<{ id: string; kakao_id: string; description: string | null; is_active: boolean; created_at: string; slot_count: number }>>([]);
  const [kakaoIdsLoading, setKakaoIdsLoading] = useState(false);
  const [showAddKakaoIdModal, setShowAddKakaoIdModal] = useState(false);
  const [newKakaoId, setNewKakaoId] = useState({ kakaoId: '', description: '' });
  const [editingSlotKakaoId, setEditingSlotKakaoId] = useState<string | null>(null);
  const [editingKakaoIdDescription, setEditingKakaoIdDescription] = useState<string | null>(null);
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  // 관리자용 가게 관리 (이벤트 시간 + 주소)
  const [eventTimes, setEventTimes] = useState<Array<{ id: string; shop_name: string; start_time: string; end_time: string; is_active: boolean; address: string | null }>>([]);
  const [eventTimesLoading, setEventTimesLoading] = useState(false);
  const [editingEventTime, setEditingEventTime] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchSlots();
    fetchShops();
  }, []);

  // 관리자용: 전체 슬롯 로드 + 카카오 아이디 목록 로드
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllSlots();
      fetchKakaoInviteIds();
    }
  }, [user]);

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

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/slots');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
        setSlotCount(data.slotCount);
        setUsedSlots(data.usedSlots);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAllSlots = async () => {
    setAllSlotsLoading(true);
    try {
      const res = await fetch('/api/admin/slots');
      if (res.ok) {
        const data = await res.json();
        setAllSlots(data.slots);
      }
    } catch (error) {
      console.error('Failed to fetch all slots:', error);
    } finally {
      setAllSlotsLoading(false);
    }
  };

  const fetchKakaoInviteIds = async () => {
    setKakaoIdsLoading(true);
    try {
      const res = await fetch('/api/admin/kakao-ids');
      if (res.ok) {
        const data = await res.json();
        setKakaoInviteIds(data.kakaoIds);
      }
    } catch (error) {
      console.error('Failed to fetch kakao invite ids:', error);
    } finally {
      setKakaoIdsLoading(false);
    }
  };

  const handleAddKakaoId = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/kakao-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kakaoId: newKakaoId.kakaoId,
          description: newKakaoId.description || null,
        }),
      });
      if (res.ok) {
        setShowAddKakaoIdModal(false);
        setNewKakaoId({ kakaoId: '', description: '' });
        fetchKakaoInviteIds();
      } else {
        const data = await res.json();
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDeleteKakaoId = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/kakao-ids?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchKakaoInviteIds();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleToggleKakaoIdActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/kakao-ids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        fetchKakaoInviteIds();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // 관리자용: 카카오 아이디 설명 수정
  const handleUpdateKakaoIdDescription = async (id: string, description: string) => {
    try {
      const res = await fetch('/api/admin/kakao-ids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, description: description || null }),
      });
      if (res.ok) {
        setEditingKakaoIdDescription(null);
        fetchKakaoInviteIds();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // 관리자용: 가게 목록 조회
  const fetchEventTimes = async () => {
    setEventTimesLoading(true);
    try {
      const res = await fetch('/api/admin/closing-times');
      if (res.ok) {
        const data = await res.json();
        setEventTimes(data.eventTimes);
      }
    } catch (error) {
      console.error('Failed to fetch event times:', error);
    } finally {
      setEventTimesLoading(false);
    }
  };

  // 관리자용: 가게 정보 수정 (이벤트 시간 + 주소)
  const handleUpdateEventTime = async (id: string, startTime: string, endTime: string, address?: string) => {
    try {
      const res = await fetch('/api/admin/closing-times', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, startTime, endTime, address }),
      });
      if (res.ok) {
        setEditingEventTime(null);
        fetchEventTimes();
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // 관리자용: 슬롯의 카카오 ID 변경
  const handleChangeSlotKakaoId = async (slotId: string, newKakaoId: string) => {
    try {
      const res = await fetch(`/api/admin/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kakaoId: newKakaoId }),
      });
      if (res.ok) {
        setEditingSlotKakaoId(null);
        fetchAllSlots();
        fetchKakaoInviteIds(); // 등록 수 업데이트
      } else {
        alert('수정에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        // 첫 번째 가게를 기본값으로 설정
        if (data.shops?.length > 0 && !newSlot.shopName) {
          setNewSlot(prev => ({ ...prev, shopName: data.shops[0].shop_name }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const shopNameValue = newSlot.shopName === '기타' ? newSlot.customShopName : newSlot.shopName;
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          girlName: newSlot.girlName,
          shopName: shopNameValue || null,
          targetRoom: newSlot.targetRoom,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewSlot({ girlName: '', shopName: shops[0]?.shop_name || '', customShopName: '', customClosingTime: '', targetRoom: '' });
        fetchSlots();
        fetchShops(); // 새 가게가 추가됐을 수 있으므로 목록 새로고침
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('인원 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };


  const openStatusModal = async (slot: Slot) => {
    setSelectedSlot(slot);
    try {
      const res = await fetch(`/api/status-board/${slot.id}`);
      if (!res.ok) {
        alert('현재 진행중인 방이 없습니다.');
        return;
      }
      const data = await res.json();
      setStatusRecord(data);
      setStatusForm({
        room_number: data.room_number || '',
        start_time: data.start_time ? data.start_time.slice(11, 16) : '',
        usage_duration: data.usage_duration !== null ? String(data.usage_duration) : '',
        is_designated: data.is_designated || false,
        event_count: data.event_count !== null ? String(data.event_count) : '',
      });
      setShowStatusModal(true);
    } catch {
      alert('상황판 조회 중 오류가 발생했습니다.');
    }
  };

  const handleStatusResend = async () => {
    if (!selectedSlot || !statusRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number: statusForm.room_number,
          start_time: statusRecord.start_time ? statusRecord.start_time.slice(0, 11) + statusForm.start_time + ':00' : null,
          usage_duration: statusForm.usage_duration ? parseFloat(statusForm.usage_duration) : null,
          is_designated: statusForm.is_designated,
          event_count: statusForm.event_count ? parseFloat(statusForm.event_count) : null,
        }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusRecord(null);
        setSelectedSlot(null);
        alert('수정 완료! 재발송 예정입니다.');
      } else {
        const data = await res.json();
        alert(data.error || '수정에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (slot: Slot) => {
    setSelectedSlot(slot);
    const shopNames = shops.map(s => s.shop_name);
    const shopName = slot.shop_name && shopNames.includes(slot.shop_name) ? slot.shop_name : (slot.shop_name ? '기타' : (shops[0]?.shop_name || ''));
    const customShopName = slot.shop_name && !shopNames.includes(slot.shop_name) ? slot.shop_name : '';
    setEditSlot({ girlName: slot.girl_name, shopName, customShopName, customClosingTime: '', targetRoom: slot.target_room });
    setShowEditModal(true);
  };

  const openExtendModal = (slot: Slot) => {
    setSelectedSlot(slot);
    setShowExtendModal(true);
  };

  const handleEditSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !selectedSlot) return;
    setSubmitting(true);

    try {
      const shopNameValue = editSlot.shopName === '기타' ? editSlot.customShopName : editSlot.shopName;
      const res = await fetch(`/api/slots/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          girlName: editSlot.girlName,
          shopName: shopNameValue || null,
          targetRoom: editSlot.targetRoom,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setSelectedSlot(null);
        fetchSlots();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('인원 수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다!');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  const toggleSlotActive = async (slotId: string, currentActive: boolean, expiresAt: string) => {
    // 만료된 슬롯은 활성화 불가
    const isExpired = getDaysRemaining(expiresAt) <= 0;
    if (!currentActive && isExpired) {
      alert('결제를 완료 해주셔야 활성화가 가능합니다.');
      return;
    }

    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        fetchSlots();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleInlineAddSlot = async (index: number) => {
    if (!inlineNewSlot.girlName || !inlineNewSlot.targetRoom) {
      alert('아가씨 닉네임과 채팅방 이름을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const shopNameValue = inlineNewSlot.shopName === '기타' ? inlineNewSlot.customShopName : inlineNewSlot.shopName;
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          girlName: inlineNewSlot.girlName,
          shopName: shopNameValue || null,
          targetRoom: inlineNewSlot.targetRoom,
        }),
      });

      if (res.ok) {
        setEditingSlotIndex(null);
        setInlineNewSlot({ girlName: '', shopName: shops[0]?.shop_name || '', customShopName: '', customClosingTime: '', targetRoom: '' });
        fetchSlots();
        fetchShops();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert('인원 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelInlineEdit = () => {
    setEditingSlotIndex(null);
    setInlineNewSlot({ girlName: '', shopName: shops[0]?.shop_name || '', customShopName: '', customClosingTime: '', targetRoom: '' });
  };

  const handleSlotPurchase = async () => {
    if (!purchaseForm.depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }
    if (purchaseForm.slotCount < 1 || purchaseForm.slotCount > 300) {
      alert('인원은 1~300명 사이로 선택해주세요.');
      return;
    }

    setPurchaseSubmitting(true);
    try {
      const res = await fetch('/api/slot-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositorName: purchaseForm.depositorName,
          slotCount: purchaseForm.slotCount,
        }),
      });

      if (res.ok) {
        alert('구매 요청이 접수되었습니다. 입금 확인 후 인원이 추가됩니다.');
        setShowSlotPurchaseModal(false);
        setPurchaseForm({ depositorName: '', slotCount: 1 });
      } else {
        const data = await res.json();
        alert(data.error || '구매 요청 중 오류가 발생했습니다.');
      }
    } catch {
      alert('구매 요청 중 오류가 발생했습니다.');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  // 빈 슬롯 배열 생성 (사용가능한 슬롯 수만큼)
  const emptySlots = Array.from({ length: slotCount - usedSlots }, (_, i) => i);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="Chotalk" className="h-12" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/guide')}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              사용방법
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 탭 메뉴 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'slots'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
            >
              인원 관리
            </button>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('users');
                    fetchAllUsers();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'users'
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  회원 관리
                </button>
                <button
                  onClick={() => {
                    setActiveTab('kakaoIds');
                    fetchKakaoInviteIds();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'kakaoIds'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  초대 아이디
                </button>
                <button
                  onClick={() => {
                    setActiveTab('eventTimes');
                    fetchEventTimes();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'eventTimes'
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  가게 관리
                </button>
              </>
            )}
          </div>
          <a
            href="https://open.kakao.com/o/sWYX3Yci"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg font-medium transition bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.72-.2.74-.73 2.68-.84 3.09-.13.52.19.51.4.37.17-.11 2.62-1.78 3.68-2.51.72.11 1.46.16 2.2.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            고객센터
          </a>
        </div>

        {activeTab === 'slots' && (
        <>
        {/* 슬롯 현황 */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          {user?.role === 'admin' ? (
            // 관리자: 전체 인원 표시
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">전체 인원 관리</h2>
              <span className="text-neutral-500">
                총 <span className="text-orange-400 font-medium">{allSlots.length}명</span> 등록됨
              </span>
            </div>
          ) : (
            <>
              {/* 일반 유저: 데스크톱 한 줄 */}
              <div className="hidden md:flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
                  <span className="text-neutral-500">
                    등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowExtendAllModal(true)}
                      disabled={slots.length === 0}
                      className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition"
                    >
                      전체 연장
                    </button>
                    <button
                      onClick={() => setShowSlotPurchaseModal(true)}
                      className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                    >
                      + 추가 구매
                    </button>
                  </div>
                </div>
              </div>
              {/* 일반 유저: 모바일 두 줄 */}
              <div className="md:hidden">
                <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
                  <span className="text-neutral-500">
                    등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowExtendAllModal(true)}
                    disabled={slots.length === 0}
                    className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition"
                  >
                    전체 연장
                  </button>
                  <button
                    onClick={() => setShowSlotPurchaseModal(true)}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                  >
                    + 추가 구매
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 슬롯 목록 - 데스크톱 테이블 */}
        <div className="hidden md:block bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">활성화</th>
                  {user?.role === 'admin' && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">회원</th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">아가씨 닉네임</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">가게명</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">채팅방</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">초대할 ID</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">만료일</th>
                  {user?.role !== 'admin' && (
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">관리</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {/* 관리자: 전체 슬롯 표시 */}
                {user?.role === 'admin' && allSlots.map((slot) => {
                  const daysRemaining = getDaysRemaining(slot.expires_at);
                  const isExpiringSoon = daysRemaining <= 7;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={slot.id} className={`hover:bg-neutral-800/30 transition ${!slot.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <div className={`w-12 h-6 rounded-full mx-auto ${
                          slot.is_active ? 'bg-green-500' : 'bg-neutral-700'
                        }`}>
                          <span
                            className={`block w-4 h-4 bg-white rounded-full relative top-1 transition-transform ${
                              slot.is_active ? 'ml-auto mr-1' : 'ml-1'
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-orange-400 font-medium">{slot.username}</td>
                      <td className="px-4 py-3 text-center text-white font-medium">{slot.girl_name}</td>
                      <td className="px-4 py-3 text-center text-neutral-400">{slot.shop_name || '-'}</td>
                      <td className="px-4 py-3 text-center text-neutral-500">{slot.target_room}</td>
                      <td className="px-4 py-3 text-center">
                        {editingSlotKakaoId === slot.id ? (
                          <select
                            defaultValue={slot.kakao_id}
                            onChange={(e) => handleChangeSlotKakaoId(slot.id, e.target.value)}
                            onBlur={() => setEditingSlotKakaoId(null)}
                            autoFocus
                            className="px-2 py-1 bg-neutral-800 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                          >
                            <option value={slot.kakao_id}>{slot.kakao_id}</option>
                            {kakaoInviteIds
                              .filter((k) => k.is_active && k.kakao_id !== slot.kakao_id)
                              .map((k) => (
                                <option key={k.id} value={k.kakao_id}>
                                  {k.kakao_id} {k.description ? `(${k.description})` : ''}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span
                            onClick={() => setEditingSlotKakaoId(slot.id)}
                            className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                            title="클릭하여 수정"
                          >
                            {slot.kakao_id}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-500'}`}>
                        {formatDate(slot.expires_at)}
                        {isExpired ? ' (만료됨)' : isExpiringSoon ? ` (${daysRemaining}일)` : ''}
                      </td>
                    </tr>
                  );
                })}
                {/* 일반 유저: 자신의 슬롯만 표시 */}
                {user?.role !== 'admin' && slots.map((slot) => {
                  const daysRemaining = getDaysRemaining(slot.expires_at);
                  const isExpiringSoon = daysRemaining <= 7;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={slot.id} className={`hover:bg-neutral-800/30 transition ${!slot.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSlotActive(slot.id, slot.is_active, slot.expires_at)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            slot.is_active ? 'bg-green-500' : 'bg-neutral-700'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              slot.is_active ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-white font-medium">{slot.girl_name}</td>
                      <td className="px-4 py-3 text-center text-neutral-400">{slot.shop_name || '-'}</td>
                      <td className="px-4 py-3 text-center text-neutral-500">{slot.target_room}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            onClick={() => copyToClipboard(slot.kakao_id)}
                            className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                            title="클릭하여 복사"
                          >
                            {slot.kakao_id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(slot.kakao_id)}
                            className="p-1 hover:bg-neutral-700 rounded transition"
                            title="복사"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400 hover:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-center ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-500'}`}>
                        {formatDate(slot.expires_at)}
                        {isExpired ? ' (만료됨)' : isExpiringSoon ? ` (${daysRemaining}일)` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(slot)}
                            className="px-3 py-1.5 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openExtendModal(slot)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${
                              isExpired || isExpiringSoon
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                            }`}
                          >
                            연장
                          </button>
                          <button
                            onClick={() => openStatusModal(slot)}
                            className="px-3 py-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                          >
                            상황판
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* 빈 슬롯 행들 (일반 유저만) */}
                {user?.role !== 'admin' && emptySlots.map((index) => (
                  <tr key={`empty-${index}`} className="hover:bg-neutral-800/30 transition bg-neutral-900/50">
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <div className="w-12 h-6 rounded-full bg-neutral-800 opacity-30" />
                      </div>
                    </td>
                    {editingSlotIndex === index ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineNewSlot.girlName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, girlName: e.target.value })}
                            placeholder="아가씨 닉네임"
                            className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={inlineNewSlot.shopName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, shopName: e.target.value, customShopName: '' })}
                            className="w-full px-2 py-1 pr-8 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center]"
                          >
                            {SHOP_NAMES.map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="기타">기타</option>
                          </select>
                          {inlineNewSlot.shopName === '기타' && (
                            <input
                              type="text"
                              value={inlineNewSlot.customShopName}
                              onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, customShopName: e.target.value })}
                              placeholder="직접 입력"
                              className="w-full mt-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={inlineNewSlot.targetRoom}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, targetRoom: e.target.value })}
                            placeholder="채팅방 이름"
                            className="w-full px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-center">-</td>
                        <td className="px-4 py-3 text-neutral-600 text-center">-</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleInlineAddSlot(index)}
                              disabled={submitting}
                              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-lg font-medium transition"
                            >
                              {submitting ? '저장중...' : '저장'}
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="px-3 py-1.5 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-400 rounded-lg font-medium transition"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={6} className="px-4 py-3 text-center">
                        <button
                          onClick={() => setEditingSlotIndex(index)}
                          className="text-neutral-600 hover:text-indigo-400 transition"
                        >
                          + 인원 추가하기
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {user?.role === 'admin' && allSlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                등록된 인원이 없습니다.
              </div>
            )}
            {user?.role !== 'admin' && slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
          </div>
        </div>

        {/* 모바일 리스트 */}
        <div className="block md:hidden space-y-4">
            {/* 관리자: 전체 슬롯 */}
            {user?.role === 'admin' && allSlots.map((slot) => {
              const daysRemaining = getDaysRemaining(slot.expires_at);
              const isExpiringSoon = daysRemaining <= 7;
              const isExpired = daysRemaining <= 0;

              return (
                <div key={slot.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${!slot.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-6 rounded-full ${slot.is_active ? 'bg-green-500' : 'bg-neutral-700'}`}>
                        <span className={`block w-4 h-4 bg-white rounded-full relative top-1 ${slot.is_active ? 'ml-auto mr-1' : 'ml-1'}`} />
                      </div>
                      <span className="text-sm text-neutral-500">{slot.is_active ? '활성화' : '비활성화'}</span>
                    </div>
                    {(isExpired || isExpiringSoon) && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                        {isExpired ? '만료됨' : `${daysRemaining}일 남음`}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">회원</span>
                      <span className="text-orange-400 font-semibold">{slot.username}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">아가씨 닉네임</span>
                      <span className="text-white font-semibold">{slot.girl_name}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">가게명</span>
                      <span className="text-neutral-400">{slot.shop_name || '-'}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">채팅방</span>
                      <span className="text-neutral-400">{slot.target_room}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2 items-center">
                      <span className="text-neutral-600 w-28 flex-shrink-0">초대할 ID</span>
                      {editingSlotKakaoId === slot.id ? (
                        <select
                          defaultValue={slot.kakao_id}
                          onChange={(e) => handleChangeSlotKakaoId(slot.id, e.target.value)}
                          onBlur={() => setEditingSlotKakaoId(null)}
                          autoFocus
                          className="px-2 py-1 bg-neutral-800 border border-yellow-500 rounded text-white text-sm focus:outline-none"
                        >
                          <option value={slot.kakao_id}>{slot.kakao_id}</option>
                          {kakaoInviteIds
                            .filter((k) => k.is_active && k.kakao_id !== slot.kakao_id)
                            .map((k) => (
                              <option key={k.id} value={k.kakao_id}>
                                {k.kakao_id} {k.description ? `(${k.description})` : ''}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setEditingSlotKakaoId(slot.id)}
                          className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                          title="클릭하여 수정"
                        >
                          {slot.kakao_id}
                        </span>
                      )}
                    </div>
                    <div className="flex">
                      <span className="text-neutral-600 w-28 flex-shrink-0">만료일</span>
                      <span className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-400'}>
                        {formatDate(slot.expires_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* 일반 유저: 자신의 슬롯만 */}
            {user?.role !== 'admin' && slots.map((slot) => {
              const daysRemaining = getDaysRemaining(slot.expires_at);
              const isExpiringSoon = daysRemaining <= 7;
              const isExpired = daysRemaining <= 0;

              return (
                <div key={slot.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${!slot.is_active ? 'opacity-50' : ''}`}>
                  {/* 활성화 토글 + 만료 경고 배지 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSlotActive(slot.id, slot.is_active, slot.expires_at)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          slot.is_active ? 'bg-green-500' : 'bg-neutral-700'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            slot.is_active ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-neutral-500">{slot.is_active ? '활성화' : '비활성화'}</span>
                    </div>
                    {(isExpired || isExpiringSoon) && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isExpired ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                      }`}>
                        {isExpired ? '만료됨' : `${daysRemaining}일 남음`}
                      </span>
                    )}
                  </div>

                  {/* 정보 테이블 형식 */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">아가씨 닉네임</span>
                      <span className="text-white font-semibold">{slot.girl_name}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">가게명</span>
                      <span className="text-neutral-400">{slot.shop_name || '-'}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2">
                      <span className="text-neutral-600 w-28 flex-shrink-0">채팅방</span>
                      <span className="text-neutral-400">{slot.target_room}</span>
                    </div>
                    <div className="flex border-b border-neutral-800 pb-2 items-center">
                      <span className="text-neutral-600 w-28 flex-shrink-0">초대할 ID</span>
                      <span
                        onClick={() => copyToClipboard(slot.kakao_id)}
                        className="px-2.5 py-1 bg-amber-900/30 rounded text-amber-300 font-medium cursor-pointer hover:bg-amber-900/50 transition"
                        title="클릭하여 복사"
                      >
                        {slot.kakao_id}
                      </span>
                      <button
                        onClick={() => copyToClipboard(slot.kakao_id)}
                        className="ml-2 px-2 py-1 text-xs bg-neutral-700 hover:bg-neutral-600 text-amber-400 rounded transition"
                      >
                        복사
                      </button>
                    </div>
                    <div className="flex">
                      <span className="text-neutral-600 w-28 flex-shrink-0">만료일</span>
                      <span className={isExpired ? 'text-red-400' : isExpiringSoon ? 'text-yellow-400' : 'text-neutral-400'}>
                        {formatDate(slot.expires_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(slot)}
                      className="flex-1 py-2 text-sm bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg font-medium transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => openExtendModal(slot)}
                      className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                        isExpired || isExpiringSoon
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-400'
                      }`}
                    >
                      연장
                    </button>
                    <button
                      onClick={() => openStatusModal(slot)}
                      className="flex-1 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg font-medium transition"
                    >
                      상황판
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 모바일 빈 슬롯 (일반 유저만) */}
            {user?.role !== 'admin' && emptySlots.map((index) => (
              <div key={`empty-mobile-${index}`} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                {editingSlotIndex === index ? (
                  <div className="space-y-3">
                    <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-3">
                      <p className="text-yellow-400 text-xs">
                        초톡,도촉 단톡방에 있는 정확한 이름과 채팅방 이름을 입력해주세요.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={inlineNewSlot.girlName}
                      onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, girlName: e.target.value })}
                      placeholder="아가씨 닉네임"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <div>
                      <label className="block text-sm text-neutral-500 mb-2">가게명</label>
                      <select
                        value={inlineNewSlot.shopName}
                        onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, shopName: e.target.value, customShopName: '' })}
                        className="w-full px-3 py-2 pr-10 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                      >
                        {shops.map((shop) => (
                          <option key={shop.id} value={shop.shop_name}>{shop.shop_name} ({shop.start_time.slice(0, 5)}~{shop.end_time.slice(0, 5)})</option>
                        ))}
                        <option value="기타">기타 (직접입력)</option>
                      </select>
                      {inlineNewSlot.shopName === '기타' && (
                        <>
                          <input
                            type="text"
                            value={inlineNewSlot.customShopName}
                            onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, customShopName: e.target.value })}
                            placeholder="가게명 직접 입력"
                            className="w-full mt-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          />
                        </>
                      )}
                    </div>
                    <input
                      type="text"
                      value={inlineNewSlot.targetRoom}
                      onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, targetRoom: e.target.value })}
                      placeholder="채팅방 이름"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInlineAddSlot(index)}
                        disabled={submitting}
                        className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-lg font-medium transition"
                      >
                        {submitting ? '저장중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelInlineEdit}
                        className="flex-1 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-400 rounded-lg font-medium transition"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSlotIndex(index)}
                    className="w-full py-6 text-neutral-600 hover:text-indigo-400 transition text-center"
                  >
                    + 인원 추가하기
                  </button>
                )}
              </div>
            ))}
            {user?.role === 'admin' && allSlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-2xl">
                등록된 인원이 없습니다.
              </div>
            )}
            {user?.role !== 'admin' && slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-2xl">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
        </div>
        </>
        )}

        {/* 회원관리 탭 (관리자 전용) */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">회원 관리</h2>
            {usersLoading ? (
              <div className="text-center py-12 text-neutral-400">로딩 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left px-4 py-3 text-neutral-500 font-medium">아이디</th>
                      <th className="text-center px-4 py-3 text-neutral-500 font-medium">등급</th>
                      <th className="text-center px-4 py-3 text-neutral-500 font-medium">등록 가능 인원</th>
                      <th className="text-center px-4 py-3 text-neutral-500 font-medium">가입일</th>
                      <th className="text-center px-4 py-3 text-neutral-500 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                        <td className="px-4 py-3 text-white">{u.username}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            u.role === 'admin'
                              ? 'bg-red-600/20 text-red-400'
                              : 'bg-neutral-700 text-neutral-400'
                          }`}>
                            {u.role === 'admin' ? '관리자' : '일반회원'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-neutral-400">{u.slot_count}명</td>
                        <td className="px-4 py-3 text-center text-neutral-500 text-sm">
                          {new Date(u.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={async () => {
                              const newCount = prompt('새로운 등록 가능 인원 수를 입력하세요:', String(u.slot_count));
                              if (newCount && !isNaN(Number(newCount))) {
                                const res = await fetch('/api/admin/users', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId: u.id, slotCount: Number(newCount) }),
                                });
                                if (res.ok) {
                                  fetchAllUsers();
                                } else {
                                  alert('수정에 실패했습니다.');
                                }
                              }
                            }}
                            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                          >
                            인원수정
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allUsers.length === 0 && (
                  <div className="text-center py-12 text-neutral-600">
                    회원이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 카카오 초대 아이디 관리 탭 (관리자 전용) */}
        {activeTab === 'kakaoIds' && user?.role === 'admin' && (
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
        )}

        {/* 가게 관리 탭 (관리자 전용) */}
        {activeTab === 'eventTimes' && user?.role === 'admin' && (
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
        )}
      </main>

      {/* 카카오 아이디 추가 모달 */}
      {showAddKakaoIdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">초대 카카오 아이디 추가</h3>
            <form onSubmit={handleAddKakaoId} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  카카오 아이디
                </label>
                <input
                  type="text"
                  value={newKakaoId.kakaoId}
                  onChange={(e) => setNewKakaoId({ ...newKakaoId, kakaoId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                  placeholder="카카오톡 아이디 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  설명 (선택사항)
                </label>
                <input
                  type="text"
                  value={newKakaoId.description}
                  onChange={(e) => setNewKakaoId({ ...newKakaoId, description: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
                  placeholder="메모 또는 설명"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddKakaoIdModal(false);
                    setNewKakaoId({ kakaoId: '', description: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 슬롯 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">인원 추가</h3>
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <p className="text-yellow-400 text-sm">
                초톡,도촉 단톡방에 있는 정확한 이름과 채팅방 이름을 입력을 해주셔야 자동 발송이 가능합니다.
              </p>
            </div>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  아가씨 닉네임
                </label>
                <input
                  type="text"
                  value={newSlot.girlName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewSlot({ ...newSlot, girlName: name, targetRoom: name ? `${name} 방` : '' });
                  }}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  가게명
                </label>
                <select
                  value={newSlot.shopName}
                  onChange={(e) => setNewSlot({ ...newSlot, shopName: e.target.value, customShopName: '', customClosingTime: '' })}
                  className="w-full px-4 py-3 pr-10 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.shop_name}>{shop.shop_name} ({shop.start_time.slice(0, 5)}~{shop.end_time.slice(0, 5)})</option>
                  ))}
                  <option value="기타">기타 (직접입력)</option>
                </select>
                {newSlot.shopName === '기타' && (
                  <>
                    <input
                      type="text"
                      value={newSlot.customShopName}
                      onChange={(e) => setNewSlot({ ...newSlot, customShopName: e.target.value })}
                      placeholder="가게명 직접 입력"
                      className="w-full mt-2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  채팅방 이름 <span className="text-neutral-600 text-xs">(자동 생성)</span>
                </label>
                <input
                  type="text"
                  value={newSlot.targetRoom}
                  onChange={(e) => setNewSlot({ ...newSlot, targetRoom: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="아가씨 이름 입력 시 자동 생성"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 슬롯 수정 모달 */}
      {showEditModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">인원 수정</h3>
            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 mb-4">
              <p className="text-yellow-400 text-sm">
                초톡,도촉 단톡방에 있는 정확한 이름과 채팅방 이름을 입력을 해주셔야 자동 발송이 가능합니다.
              </p>
            </div>
            <form onSubmit={handleEditSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  아가씨 닉네임
                </label>
                <input
                  type="text"
                  value={editSlot.girlName}
                  onChange={(e) => setEditSlot({ ...editSlot, girlName: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  가게명
                </label>
                <select
                  value={editSlot.shopName}
                  onChange={(e) => setEditSlot({ ...editSlot, shopName: e.target.value, customShopName: '', customClosingTime: '' })}
                  className="w-full px-4 py-3 pr-10 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.shop_name}>{shop.shop_name} ({shop.start_time.slice(0, 5)}~{shop.end_time.slice(0, 5)})</option>
                  ))}
                  <option value="기타">기타 (직접입력)</option>
                </select>
                {editSlot.shopName === '기타' && (
                  <>
                    <input
                      type="text"
                      value={editSlot.customShopName}
                      onChange={(e) => setEditSlot({ ...editSlot, customShopName: e.target.value })}
                      placeholder="가게명 직접 입력"
                      className="w-full mt-2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  채팅방 이름
                </label>
                <input
                  type="text"
                  value={editSlot.targetRoom}
                  onChange={(e) => setEditSlot({ ...editSlot, targetRoom: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="채팅방 이름 입력"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedSlot(null); }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? '수정 중...' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 연장 모달 (계좌번호 안내) */}
      {showExtendModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">기간 연장</h3>

            {/* 연장 대상 정보 */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-300 text-sm mb-2">
                연장 대상: <span className="text-white font-bold">{selectedSlot.girl_name}</span>
              </p>
              <p className="text-neutral-500 text-xs">
                현재 만료일: {formatDate(selectedSlot.expires_at)}
              </p>
            </div>

            {/* 입금 안내 */}
            <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-4 mb-4">
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
                      className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
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
                    <span className="text-neutral-500 text-sm">30일 연장</span>
                    <span className="text-yellow-400 font-bold">50,000원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 경고 문구 */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium">
                ⚠️ 입금자명이 정확해야 입금 확인이 가능합니다!
              </p>
              <p className="text-red-300 text-xs mt-1">
                입금 후 관리자 확인 후 연장됩니다.
              </p>
            </div>

            {/* 입금자명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                입금자명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={extendForm.depositorName}
                onChange={(e) => setExtendForm({ ...extendForm, depositorName: e.target.value })}
                placeholder="실제 입금하실 이름을 입력해주세요"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              onClick={() => {
                setShowExtendModal(false);
                setExtendForm({ depositorName: '' });
              }}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 상황판 수정 모달 */}
      {showStatusModal && statusRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">상황판 수정</h3>

            {/* 현재 상태 정보 */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-4">
              <p className="text-blue-300 text-sm">
                아가씨: <span className="text-white font-bold">{statusRecord.girl_name}</span>
              </p>
              <p className="text-blue-300 text-sm mt-1">
                상태: <span className={`font-bold ${statusRecord.is_in_progress ? 'text-green-400' : 'text-red-400'}`}>
                  {statusRecord.trigger_type === 'canceled' ? '취소' : statusRecord.is_in_progress ? '진행 중' : '종료'}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {/* 방번호 */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">방번호</label>
                <input
                  type="text"
                  value={statusForm.room_number}
                  onChange={(e) => setStatusForm({ ...statusForm, room_number: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* 시작시간 */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">시작시간 (HH:MM)</label>
                <input
                  type="text"
                  value={statusForm.start_time}
                  onChange={(e) => setStatusForm({ ...statusForm, start_time: e.target.value })}
                  placeholder="16:03"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* 이용시간 */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">이용시간</label>
                <input
                  type="text"
                  value={statusForm.usage_duration}
                  onChange={(e) => setStatusForm({ ...statusForm, usage_duration: e.target.value })}
                  placeholder="1.5"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* 이벤트 갯수 */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">이벤트 갯수</label>
                <input
                  type="text"
                  value={statusForm.event_count}
                  onChange={(e) => setStatusForm({ ...statusForm, event_count: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* 지명 */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-neutral-400">지명</label>
                <button
                  type="button"
                  onClick={() => setStatusForm({ ...statusForm, is_designated: !statusForm.is_designated })}
                  className={`px-4 py-1.5 text-sm rounded-lg font-medium transition ${
                    statusForm.is_designated
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-700 text-neutral-400'
                  }`}
                >
                  {statusForm.is_designated ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusRecord(null);
                  setSelectedSlot(null);
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                취소
              </button>
              <button
                onClick={handleStatusResend}
                disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition"
              >
                {submitting ? '처리 중...' : '재발송'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 연장 모달 */}
      {showExtendAllModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">전체 기간 연장</h3>

            {/* 연장 대상 정보 */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-300 text-sm mb-2">
                연장 대상: <span className="text-white font-bold">전체 인원 ({slots.length}명)</span>
              </p>
              <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex justify-between text-sm">
                    <span className="text-white">{slot.girl_name}</span>
                    <span className={`${getDaysRemaining(slot.expires_at) <= 0 ? 'text-red-400' : getDaysRemaining(slot.expires_at) <= 7 ? 'text-yellow-400' : 'text-neutral-500'}`}>
                      {formatDate(slot.expires_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 입금 안내 */}
            <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-4 mb-4">
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
                      className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
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
                    <span className="text-neutral-500 text-sm">30일 연장 (1인당)</span>
                    <span className="text-neutral-400">50,000원</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-yellow-400 font-medium">총 금액</span>
                    <span className="text-yellow-400 font-bold text-lg">{(slots.length * 50000).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 경고 문구 */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium">
                ⚠️ 입금자명이 정확해야 입금 확인이 가능합니다!
              </p>
              <p className="text-red-300 text-xs mt-1">
                입금 후 관리자 확인 후 전체 연장됩니다.
              </p>
            </div>

            {/* 입금자명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                입금자명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={extendForm.depositorName}
                onChange={(e) => setExtendForm({ ...extendForm, depositorName: e.target.value })}
                placeholder="실제 입금하실 이름을 입력해주세요"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              onClick={() => {
                setShowExtendAllModal(false);
                setExtendForm({ depositorName: '' });
              }}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 슬롯 추가 구매 모달 */}
      {showSlotPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">인원 추가 구매</h3>

            {/* 현재 보유 슬롯 정보 */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-300 text-sm mb-2">
                현재 등록 가능 인원: <span className="text-white font-bold">{slotCount}명</span>
              </p>
              <p className="text-neutral-500 text-xs">
                인원을 추가로 구매하시면 더 많은 아가씨를 등록할 수 있습니다.
              </p>
            </div>

            {/* 입금 안내 */}
            <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-4 mb-4">
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
                      className="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 text-sm">예금주</span>
                  <span className="text-white font-medium">어시스트솔루션</span>
                </div>
              </div>
            </div>

            {/* 경고 문구 */}
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-sm font-medium">
                ⚠️ 입금자명이 정확해야 입금 확인이 가능합니다!
              </p>
              <p className="text-red-300 text-xs mt-1">
                입금자명이 일치하지 않으면 입금 확인이 지연될 수 있습니다.
              </p>
            </div>

            {/* 입력 폼 */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  입금자명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={purchaseForm.depositorName}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, depositorName: e.target.value })}
                  placeholder="실제 입금하실 이름을 입력해주세요"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  구매할 인원 <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPurchaseForm({ ...purchaseForm, slotCount: Math.max(1, purchaseForm.slotCount - 1) })}
                      className="w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white text-xl font-bold rounded-lg border border-neutral-700 transition"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-white min-w-[3rem] text-center">
                      {purchaseForm.slotCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPurchaseForm({ ...purchaseForm, slotCount: Math.min(300, purchaseForm.slotCount + 1) })}
                      className="w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white text-xl font-bold rounded-lg border border-neutral-700 transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">
                      {(purchaseForm.slotCount * 50000).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSlotPurchaseModal(false);
                  setPurchaseForm({ depositorName: '', slotCount: 1 });
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                취소
              </button>
              <button
                onClick={handleSlotPurchase}
                disabled={purchaseSubmitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
              >
                {purchaseSubmitting ? '요청 중...' : '구매 요청'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
