'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  phone: string;
  username: string;
  created_at: string;
}

interface Slot {
  id: string;
  girl_name: string;
  shop_name: string | null;  // 가게명
  target_room: string;  // 발송할 채팅방
  chat_room_type: 'group' | 'open';
  kakao_id: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

// 가게명 프리셋
const SHOP_NAMES = ['도파민', '유앤미', '달토', '퍼펙트', '엘리트'];

// 샘플 템플릿 (코드에서 정의)
interface SampleTemplate {
  id: string;
  name: string;
  template: string;
}

// 커스텀 템플릿 (DB에서 가져옴)
interface CustomTemplate {
  id: string;
  name: string;
  template: string;
  created_at: string;
}

// 선택된 템플릿 정보
interface SelectedInfo {
  type: 'sample' | 'custom';
  id: string;
  template: string;
}


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
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [newSlot, setNewSlot] = useState({ girlName: '', shopName: '도파민', customShopName: '', chatRoomType: 'group' as 'group' | 'open', targetRoom: '' });
  const [editSlot, setEditSlot] = useState({ girlName: '', shopName: '', customShopName: '', chatRoomType: 'group' as 'group' | 'open', targetRoom: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showSlotPurchaseModal, setShowSlotPurchaseModal] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [inlineNewSlot, setInlineNewSlot] = useState({ girlName: '', shopName: '도파민', customShopName: '', chatRoomType: 'group' as 'group' | 'open', targetRoom: '' });
  const [purchaseForm, setPurchaseForm] = useState({ depositorName: '', slotCount: 1 });
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [sampleTemplates, setSampleTemplates] = useState<SampleTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedInfo | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', template: '' });
  const [activeTab, setActiveTab] = useState<'slots' | 'templates'>('slots');

  useEffect(() => {
    fetchUser();
    fetchSlots();
    fetchTemplates();
  }, []);

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

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/template');
      if (res.ok) {
        const data = await res.json();
        setSampleTemplates(data.samples || []);
        setCustomTemplates(data.customTemplates || []);
        setSelectedTemplate(data.selected || null);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
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
          chatRoomType: newSlot.chatRoomType,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewSlot({ girlName: '', shopName: '도파민', customShopName: '', chatRoomType: 'group', targetRoom: '' });
        fetchSlots();
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

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSlots();
      }
    } catch {
      alert('인원 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditModal = (slot: Slot) => {
    setSelectedSlot(slot);
    const shopName = slot.shop_name && SHOP_NAMES.includes(slot.shop_name) ? slot.shop_name : (slot.shop_name ? '기타' : '도파민');
    const customShopName = slot.shop_name && !SHOP_NAMES.includes(slot.shop_name) ? slot.shop_name : '';
    setEditSlot({ girlName: slot.girl_name, shopName, customShopName, chatRoomType: slot.chat_room_type || 'group', targetRoom: slot.target_room });
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
          chatRoomType: editSlot.chatRoomType,
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

  const toggleSlotActive = async (slotId: string, currentActive: boolean) => {
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
          chatRoomType: inlineNewSlot.chatRoomType,
        }),
      });

      if (res.ok) {
        setEditingSlotIndex(null);
        setInlineNewSlot({ girlName: '', shopName: '도파민', customShopName: '', chatRoomType: 'group', targetRoom: '' });
        fetchSlots();
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
    setInlineNewSlot({ girlName: '', shopName: '도파민', customShopName: '', chatRoomType: 'group', targetRoom: '' });
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

  const handleSelectTemplate = async (templateId: string) => {
    setTemplateSubmitting(true);
    try {
      const res = await fetch(`/api/template/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ select: true }),
      });

      if (res.ok) {
        fetchTemplates();  // 새로고침하여 최신 상태 반영
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 선택 중 오류가 발생했습니다.');
      }
    } catch {
      alert('템플릿 선택 중 오류가 발생했습니다.');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.template.trim()) {
      alert('템플릿 이름과 내용을 모두 입력해주세요.');
      return;
    }

    setTemplateSubmitting(true);
    try {
      const res = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (res.ok) {
        setShowAddTemplateModal(false);
        setNewTemplate({ name: '', template: '' });
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 추가 중 오류가 발생했습니다.');
      }
    } catch {
      alert('템플릿 추가 중 오류가 발생했습니다.');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;

    setTemplateSubmitting(true);
    try {
      const res = await fetch(`/api/template/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingTemplate.name, template: editingTemplate.template }),
      });

      if (res.ok) {
        setShowEditTemplateModal(false);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 수정 중 오류가 발생했습니다.');
      }
    } catch {
      alert('템플릿 수정 중 오류가 발생했습니다.');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/template/${templateId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || '템플릿 삭제 중 오류가 발생했습니다.');
      }
    } catch {
      alert('템플릿 삭제 중 오류가 발생했습니다.');
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
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'templates'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
            >
              발송 템플릿
            </button>
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
          {/* 데스크톱: 한 줄 */}
          <div className="hidden md:flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
              <span className="text-neutral-500">
                등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
              </span>
              <button
                onClick={() => setShowSlotPurchaseModal(true)}
                className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
              >
                + 추가 구매
              </button>
            </div>
          </div>
          {/* 모바일: 두 줄 */}
          <div className="md:hidden">
            <h2 className="text-xl font-bold text-white">{user?.username}님의 등록 인원</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-neutral-500">등록된 인원: <span className="text-white font-medium">{usedSlots}명</span></span>
              <span className="text-neutral-500">
                등록 가능: <span className="text-green-400 font-medium">{slotCount}명</span>
                <button
                  onClick={() => setShowSlotPurchaseModal(true)}
                  className="ml-2 px-2 py-0.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                >
                  + 추가 구매
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* 슬롯 목록 - 데스크톱 테이블 */}
        <div className="hidden md:block bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">활성화</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">아가씨 닉네임</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">가게명</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">채팅방</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">채팅방 타입</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">초대할 ID</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">만료일</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-400">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {slots.map((slot) => {
                  const daysRemaining = getDaysRemaining(slot.expires_at);
                  const isExpiringSoon = daysRemaining <= 7;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr key={slot.id} className={`hover:bg-neutral-800/30 transition ${!slot.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSlotActive(slot.id, slot.is_active)}
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
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          slot.chat_room_type === 'open'
                            ? 'bg-purple-600/20 text-purple-400'
                            : 'bg-blue-600/20 text-blue-400'
                        }`}>
                          {slot.chat_room_type === 'open' ? '오픈채팅' : '그룹채팅'}
                        </span>
                      </td>
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
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* 빈 슬롯 행들 */}
                {emptySlots.map((index) => (
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
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`inline-chat-type-${index}`}
                                checked={inlineNewSlot.chatRoomType === 'group'}
                                onChange={() => setInlineNewSlot({ ...inlineNewSlot, chatRoomType: 'group' })}
                                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 focus:ring-blue-500"
                              />
                              <span className="text-xs text-neutral-400">그룹</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`inline-chat-type-${index}`}
                                checked={inlineNewSlot.chatRoomType === 'open'}
                                onChange={() => setInlineNewSlot({ ...inlineNewSlot, chatRoomType: 'open' })}
                                className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-700 focus:ring-purple-500"
                              />
                              <span className="text-xs text-neutral-400">오픈</span>
                            </label>
                          </div>
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
                      <td colSpan={7} className="px-4 py-3 text-center">
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
            {slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
          </div>
        </div>

        {/* 모바일 리스트 */}
        <div className="block md:hidden space-y-4">
            {slots.map((slot) => {
              const daysRemaining = getDaysRemaining(slot.expires_at);
              const isExpiringSoon = daysRemaining <= 7;
              const isExpired = daysRemaining <= 0;

              return (
                <div key={slot.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${!slot.is_active ? 'opacity-50' : ''}`}>
                  {/* 활성화 토글 + 만료 경고 배지 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSlotActive(slot.id, slot.is_active)}
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
                      <span className="text-neutral-600 w-28 flex-shrink-0">채팅방 타입</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.chat_room_type === 'open'
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'bg-blue-600/20 text-blue-400'
                      }`}>
                        {slot.chat_room_type === 'open' ? '오픈채팅' : '그룹채팅'}
                      </span>
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
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg font-medium transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 모바일 빈 슬롯 */}
            {emptySlots.map((index) => (
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
                        {SHOP_NAMES.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                        <option value="기타">기타 (직접입력)</option>
                      </select>
                      {inlineNewSlot.shopName === '기타' && (
                        <input
                          type="text"
                          value={inlineNewSlot.customShopName}
                          onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, customShopName: e.target.value })}
                          placeholder="가게명 직접 입력"
                          className="w-full mt-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      value={inlineNewSlot.targetRoom}
                      onChange={(e) => setInlineNewSlot({ ...inlineNewSlot, targetRoom: e.target.value })}
                      placeholder="채팅방 이름"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <div>
                      <label className="block text-sm text-neutral-500 mb-2">채팅방 타입</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`mobile-inline-chat-type-${index}`}
                            checked={inlineNewSlot.chatRoomType === 'group'}
                            onChange={() => setInlineNewSlot({ ...inlineNewSlot, chatRoomType: 'group' })}
                            className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 focus:ring-blue-500"
                          />
                          <span className="text-sm text-neutral-400">그룹채팅</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`mobile-inline-chat-type-${index}`}
                            checked={inlineNewSlot.chatRoomType === 'open'}
                            onChange={() => setInlineNewSlot({ ...inlineNewSlot, chatRoomType: 'open' })}
                            className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-700 focus:ring-purple-500"
                          />
                          <span className="text-sm text-neutral-400">오픈채팅</span>
                        </label>
                      </div>
                    </div>
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
            {slots.length === 0 && emptySlots.length === 0 && (
              <div className="text-center py-12 text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-2xl">
                등록 가능한 인원이 없습니다. 인원을 추가 구매해주세요.
              </div>
            )}
        </div>
        </>
        )}

        {/* 템플릿 탭 */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 왼쪽: 템플릿 목록 */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">상단 템플릿</h2>
                  <p className="text-neutral-500 text-sm mt-1">자동 발송 메시지의 상단 인사말을 선택하세요.</p>
                </div>
                <button
                  onClick={() => setShowAddTemplateModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition"
                >
                  + 내 템플릿 추가
                </button>
              </div>

              {/* 템플릿 목록 */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {/* 샘플 템플릿 섹션 */}
                <div className="mb-4">
                  <p className="text-neutral-500 text-xs mb-2 font-medium">샘플 템플릿</p>
                  {sampleTemplates.map((sample) => {
                    const isSelected = selectedTemplate?.type === 'sample' && selectedTemplate?.id === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className={`p-4 rounded-xl border transition cursor-pointer mb-2 ${
                          isSelected
                            ? 'bg-indigo-900/30 border-indigo-500'
                            : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                        }`}
                        onClick={() => !templateSubmitting && handleSelectTemplate(sample.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* 라디오 버튼 */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? 'border-indigo-500' : 'border-neutral-600'
                          }`}>
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium">{sample.name}</span>
                              <span className="px-2 py-0.5 text-xs bg-neutral-700 text-neutral-400 rounded">샘플</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded">사용중</span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-sm mt-1 whitespace-pre-line">{sample.template}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 내 커스텀 템플릿 섹션 */}
                {customTemplates.length > 0 && (
                  <div>
                    <p className="text-neutral-500 text-xs mb-2 font-medium">내 템플릿</p>
                    {customTemplates.map((custom) => {
                      const isSelected = selectedTemplate?.type === 'custom' && selectedTemplate?.id === custom.id;
                      return (
                        <div
                          key={custom.id}
                          className={`p-4 rounded-xl border transition cursor-pointer mb-2 ${
                            isSelected
                              ? 'bg-indigo-900/30 border-indigo-500'
                              : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                          }`}
                          onClick={() => !templateSubmitting && handleSelectTemplate(custom.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {/* 라디오 버튼 */}
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected ? 'border-indigo-500' : 'border-neutral-600'
                              }`}>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-medium">{custom.name}</span>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded">사용중</span>
                                  )}
                                </div>
                                <p className="text-neutral-400 text-sm mt-1 whitespace-pre-line">{custom.template}</p>
                              </div>
                            </div>
                            {/* 수정/삭제 버튼 */}
                            <div className="flex gap-2 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingTemplate(custom);
                                  setShowEditTemplateModal(true);
                                }}
                                className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg transition"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(custom.id)}
                                className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 미리보기 */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 lg:sticky lg:top-8 h-fit">
              <h3 className="text-lg font-bold text-white mb-3">발송 메시지 미리보기</h3>
              <div className="bg-neutral-800 rounded-xl p-4">
                <p className="text-neutral-400 text-sm mb-2">상단 (선택한 템플릿)</p>
                <p className="text-white mb-4 whitespace-pre-line">
                  {selectedTemplate?.template || '템플릿을 선택하세요'}
                </p>
                <hr className="border-neutral-700 my-4" />
                <p className="text-neutral-400 text-sm mb-2">중단 (자동 생성)</p>
                <p className="text-neutral-500 mb-4 italic">[아가씨 정보 + 시간 등 자동 삽입]</p>
                <hr className="border-neutral-700 my-4" />
                <p className="text-neutral-400 text-sm mb-2">하단 (자동 생성)</p>
                <p className="text-neutral-500 italic">[추가 안내 메시지 자동 삽입]</p>
              </div>
            </div>
          </div>
        )}
      </main>

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
                  onChange={(e) => setNewSlot({ ...newSlot, girlName: e.target.value })}
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
                  onChange={(e) => setNewSlot({ ...newSlot, shopName: e.target.value, customShopName: '' })}
                  className="w-full px-4 py-3 pr-10 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                >
                  {SHOP_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="기타">기타 (직접입력)</option>
                </select>
                {newSlot.shopName === '기타' && (
                  <input
                    type="text"
                    value={newSlot.customShopName}
                    onChange={(e) => setNewSlot({ ...newSlot, customShopName: e.target.value })}
                    placeholder="가게명 직접 입력"
                    className="w-full mt-2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  채팅방 이름
                </label>
                <input
                  type="text"
                  value={newSlot.targetRoom}
                  onChange={(e) => setNewSlot({ ...newSlot, targetRoom: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="채팅방 이름 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  채팅방 타입
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="add-chat-type"
                      checked={newSlot.chatRoomType === 'group'}
                      onChange={() => setNewSlot({ ...newSlot, chatRoomType: 'group' })}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 focus:ring-blue-500"
                    />
                    <span className="text-neutral-400">그룹채팅</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="add-chat-type"
                      checked={newSlot.chatRoomType === 'open'}
                      onChange={() => setNewSlot({ ...newSlot, chatRoomType: 'open' })}
                      className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-700 focus:ring-purple-500"
                    />
                    <span className="text-neutral-400">오픈채팅</span>
                  </label>
                </div>
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
                  onChange={(e) => setEditSlot({ ...editSlot, shopName: e.target.value, customShopName: '' })}
                  className="w-full px-4 py-3 pr-10 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                >
                  {SHOP_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="기타">기타 (직접입력)</option>
                </select>
                {editSlot.shopName === '기타' && (
                  <input
                    type="text"
                    value={editSlot.customShopName}
                    onChange={(e) => setEditSlot({ ...editSlot, customShopName: e.target.value })}
                    placeholder="가게명 직접 입력"
                    className="w-full mt-2 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  />
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
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  채팅방 타입
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-chat-type"
                      checked={editSlot.chatRoomType === 'group'}
                      onChange={() => setEditSlot({ ...editSlot, chatRoomType: 'group' })}
                      className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 focus:ring-blue-500"
                    />
                    <span className="text-neutral-400">그룹채팅</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="edit-chat-type"
                      checked={editSlot.chatRoomType === 'open'}
                      onChange={() => setEditSlot({ ...editSlot, chatRoomType: 'open' })}
                      className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-700 focus:ring-purple-500"
                    />
                    <span className="text-neutral-400">오픈채팅</span>
                  </label>
                </div>
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
            <div className="bg-neutral-800/50 rounded-xl p-4 mb-4">
              <p className="text-neutral-400 mb-2">
                <span className="text-neutral-600">인원:</span> {selectedSlot.girl_name}
              </p>
              <p className="text-neutral-400">
                <span className="text-neutral-600">현재 만료일:</span> {formatDate(selectedSlot.expires_at)}
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <h4 className="text-indigo-400 font-semibold mb-2">입금 안내</h4>
              <p className="text-neutral-400 text-sm mb-3">
                아래 계좌로 연장 비용을 입금해주세요.
              </p>
              <div className="bg-neutral-900 rounded-lg p-3 space-y-1">
                <p className="text-white font-mono">국민은행 123-456-789012</p>
                <p className="text-neutral-500 text-sm">예금주: 홍길동</p>
                <p className="text-indigo-400 font-semibold">30일 연장: 50,000원</p>
              </div>
              <p className="text-yellow-400 text-xs mt-3">
                * 입금 후 관리자 확인 후 연장됩니다.
              </p>
            </div>

            <button
              onClick={() => setShowExtendModal(false)}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 템플릿 추가 모달 */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">템플릿 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="예: 나만의 인사말"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  템플릿 내용
                </label>
                <textarea
                  value={newTemplate.template}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template: e.target.value })}
                  placeholder="상단에 표시될 인사말을 입력하세요"
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddTemplateModal(false);
                    setNewTemplate({ name: '', template: '' });
                  }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  onClick={handleAddTemplate}
                  disabled={templateSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
                >
                  {templateSubmitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 수정 모달 */}
      {showEditTemplateModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">템플릿 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  템플릿 이름
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  템플릿 내용
                </label>
                <textarea
                  value={editingTemplate.template}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  onClick={handleEditTemplate}
                  disabled={templateSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
                >
                  {templateSubmitting ? '수정 중...' : '수정'}
                </button>
              </div>
            </div>
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
