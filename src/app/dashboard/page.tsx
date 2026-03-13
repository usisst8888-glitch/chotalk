'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import BrandedLogo from '@/components/BrandedLogo';
import { User, Distributor, Settlement, Slot, SHOP_NAMES } from './types';
import {
  SlotsTab, UsersTab, KakaoIdsTab, EventTimesTab,
  RoomsTab, DistributorsTab,
  SettlementTab, BankAccountTab, ErrandTalkTab, ChoiceTalkTab, PackageTab,
  ServiceManageTab,
} from './tabs';

export default function DashboardPage() {
  const router = useRouter();
  const { distributor } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotCount, setSlotCount] = useState(0);
  const [usedSlots, setUsedSlots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusRecords, setStatusRecords] = useState<Array<{
    id: string; room_number: string; girl_name: string; start_time: string;
    usage_duration: number | null; is_designated: boolean; event_count: number | null;
    trigger_type: string; is_in_progress: boolean; data_changed: boolean; created_at: string;
  }>>([]);
  const [selectedStatusRecord, setSelectedStatusRecord] = useState<{
    id: string; room_number: string; girl_name: string; start_time: string;
    usage_duration: number | null; is_designated: boolean; event_count: number | null;
    trigger_type: string; is_in_progress: boolean; data_changed: boolean; created_at: string;
  } | null>(null);
  const [statusForm, setStatusForm] = useState({
    room_number: '', start_time: '', usage_duration: '',
    is_designated: false, event_count: '', is_cancel: false,
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
  const [showAdminExtendModal, setShowAdminExtendModal] = useState(false);
  const [adminExtendDays, setAdminExtendDays] = useState(30);
  const [adminExtendMode, setAdminExtendMode] = useState<'add' | 'set'>('add');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'users' | 'kakaoIds' | 'eventTimes' | 'extensions' | 'purchases' | 'rooms' | 'distributors' | 'bankAccount' | 'settlement' | 'errandTalk' | 'choiceTalk' | 'package' | 'serviceManage'>('slots');
  // 관리자용 회원관리
  const [allUsers, setAllUsers] = useState<Array<{ id: string; username: string; nickname: string | null; phone: string; role: string; slot_count: number; parent_id: string | null; domain: string | null; created_at: string }>>([]);
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
  const [filterUserIds, setFilterUserIds] = useState<string[]>([]);
  const [editingKakaoIdDescription, setEditingKakaoIdDescription] = useState<string | null>(null);
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  // 관리자용 가게 관리 (이벤트 시간 + 주소)
  const [eventTimes, setEventTimes] = useState<Array<{ id: string; shop_name: string; start_time: string; end_time: string; is_active: boolean; address: string | null }>>([]);
  const [eventTimesLoading, setEventTimesLoading] = useState(false);
  const [editingEventTime, setEditingEventTime] = useState<string | null>(null);
  // 관리자용 방상태 관리
  const [rooms, setRooms] = useState<Array<{ id: string; room_number: string; shop_name: string; room_start_time: string; room_end_time: string | null; is_active: boolean; created_at: string }>>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomShopFilter, setRoomShopFilter] = useState<string>('all');
  // 유저용 슬롯 검색 및 정렬
  const [slotSearch, setSlotSearch] = useState('');
  const [slotSort, setSlotSort] = useState<'session' | 'expires'>('session');
  // 관리자용 일괄 선택
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  const [showBatchExtendModal, setShowBatchExtendModal] = useState(false);
  const [batchExtendDays, setBatchExtendDays] = useState(30);
  const [batchExtendMode, setBatchExtendMode] = useState<'add' | 'set'>('add');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [roomSort, setRoomSort] = useState<'start_desc' | 'start_asc' | 'end_desc' | 'end_asc'>('start_desc');
  // 관리자용 인원 추가 모달
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [adminNewSlot, setAdminNewSlot] = useState({ userId: '', girlName: '', shopName: '', customShopName: '' });
  // 상황판 새 세션 추가 폼
  const [showAddSessionForm, setShowAddSessionForm] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({ room_number: '', start_hour: '', start_minute: '', start_ampm: 'PM' as 'AM' | 'PM', is_designated: false });
  // 상황판 초기화 확인 팝업
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // 상황판 개별 삭제 확인 팝업
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // 총판 관리 (superadmin)
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [distributorsLoading, setDistributorsLoading] = useState(false);
  const [showAddDistributorModal, setShowAddDistributorModal] = useState(false);
  const [newDistributor, setNewDistributor] = useState({ userId: '', domain: '', siteName: '', primaryColor: '#4f46e5', secondaryColor: '#7c3aed', bankName: '', accountNumber: '', accountHolder: '', slotPrice: 100000, extensionPrice: 50000 });
  const [newDistributorLogo, setNewDistributorLogo] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState<string | null>(null);
  const [editDistForm, setEditDistForm] = useState({ domain: '', siteName: '', bankName: '', accountNumber: '', accountHolder: '', slotPrice: 100000, costPrice: 20000, primaryColor: '#4f46e5', secondaryColor: '#7c3aed' });
  // 계좌/판매금액 설정 (admin/총판)
  const [distBankName, setDistBankName] = useState('');
  const [distAccountNumber, setDistAccountNumber] = useState('');
  const [distAccountHolder, setDistAccountHolder] = useState('');
  const [distSlotPrice, setDistSlotPrice] = useState(100000);
  const [bankAccountSaving, setBankAccountSaving] = useState(false);
  // 정산 (superadmin)
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementMonth, setSettlementMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [settlementLoading, setSettlementLoading] = useState(false);

  // 역할 헬퍼
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const isAnyAdmin = isSuperAdmin || isAdmin;

  // 유저용 슬롯 필터링 + 정렬
  const filteredSlots = slots
    .filter(s => !slotSearch || s.girl_name.includes(slotSearch) || s.shop_name?.includes(slotSearch))
    .sort((a, b) => {
      if (slotSort === 'expires') {
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      // session: 최신 생성순 (기본)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  useEffect(() => {
    fetchUser();
    fetchSlots();
    fetchShops();
  }, []);

  // 관리자용: 전체 슬롯 로드 + 카카오 아이디 목록 로드
  useEffect(() => {
    if (isAnyAdmin) {
      fetchAllSlots();
      fetchAllUsers();
    }
    if (isSuperAdmin) {
      fetchKakaoInviteIds();
    }
    if (isAdmin) {
      fetch('/api/admin/bank-account').then(res => res.ok ? res.json() : null).then(data => {
        if (data) {
          setDistBankName(data.bankName || '');
          setDistAccountNumber(data.accountNumber || '');
          setDistAccountHolder(data.accountHolder || '');
          setDistSlotPrice(data.slotPrice || 100000);
        }
      });
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

  // 관리자용: 방상태 조회
  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await fetch('/api/admin/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setRoomsLoading(false);
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

  // 관리자용: 슬롯 삭제
  const handleAdminDeleteSlot = async (slotId: string) => {
    if (!confirm('정말 이 인원을 삭제하시겠습니까?\n연관된 모든 데이터(상황판, 메시지 로그 등)가 함께 삭제됩니다.')) return;
    try {
      const res = await fetch(`/api/admin/slots/${slotId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('인원이 삭제되었습니다.');
        fetchAllSlots();
      } else {
        const data = await res.json();
        alert(data.error || '삭제 실패');
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
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

  // 총판 목록 조회 (superadmin)
  const fetchDistributors = async () => {
    setDistributorsLoading(true);
    try {
      const res = await fetch('/api/admin/distributor');
      if (res.ok) {
        const data = await res.json();
        setDistributors(data.distributors);
      }
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
    } finally {
      setDistributorsLoading(false);
    }
  };

  // 정산 데이터 조회 (superadmin)
  const fetchSettlements = async (month?: string) => {
    setSettlementLoading(true);
    try {
      const m = month || settlementMonth;
      const res = await fetch(`/api/admin/settlement?month=${m}`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.settlements);
      }
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setSettlementLoading(false);
    }
  };

  // 계좌 저장 (admin/총판)
  const handleSaveBankAccount = async () => {
    setBankAccountSaving(true);
    try {
      const res = await fetch('/api/admin/bank-account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: distBankName,
          accountNumber: distAccountNumber,
          accountHolder: distAccountHolder,
          slotPrice: distSlotPrice,
        }),
      });
      if (res.ok) {
        alert('저장되었습니다.');
      } else {
        const data = await res.json();
        alert(data.error || '저장에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setBankAccountSaving(false);
    }
  };

  // 총판 추가 (superadmin)
  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogoUploading(true);
    try {
      // 로고 파일이 있으면 먼저 업로드
      let logoUrl: string | undefined;
      if (newDistributorLogo) {
        const formData = new FormData();
        formData.append('file', newDistributorLogo);
        const uploadRes = await fetch('/api/admin/distributor/logo', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.url;
        } else {
          const uploadData = await uploadRes.json();
          alert(uploadData.error || '로고 업로드에 실패했습니다.');
          setLogoUploading(false);
          return;
        }
      }

      const res = await fetch('/api/admin/distributor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDistributor, logoUrl }),
      });
      if (res.ok) {
        setShowAddDistributorModal(false);
        setNewDistributor({ userId: '', domain: '', siteName: '', primaryColor: '#4f46e5', secondaryColor: '#7c3aed', bankName: '', accountNumber: '', accountHolder: '', slotPrice: 100000, extensionPrice: 50000 });
        setNewDistributorLogo(null);
        fetchDistributors();
      } else {
        const data = await res.json();
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setLogoUploading(false);
    }
  };

  // 총판 삭제 (superadmin)
  const handleDeleteDistributor = async (id: string) => {
    if (!confirm('정말 이 총판을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/distributor?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDistributors();
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // 총판 수정 (superadmin)
  const handleUpdateDistributor = async (id: string, data: Record<string, string | boolean | number>) => {
    try {
      const res = await fetch('/api/admin/distributor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (res.ok) {
        setEditingDistributor(null);
        fetchDistributors();
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


  // 관리자용 인원 추가
  const handleAdminAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const shopNameValue = adminNewSlot.shopName === '기타' ? adminNewSlot.customShopName : adminNewSlot.shopName;
      const res = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminNewSlot.userId,
          girlName: adminNewSlot.girlName,
          shopName: shopNameValue || null,
        }),
      });
      if (res.ok) {
        setShowAdminAddModal(false);
        setAdminNewSlot({ userId: '', girlName: '', shopName: '', customShopName: '' });
        fetchAllSlots();
      } else {
        const data = await res.json();
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch {
      alert('인원 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 상황판 새 세션 추가
  const handleAddSession = async () => {
    if (!selectedSlot || submitting) return;
    setSubmitting(true);
    try {
      const now = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
      const datePrefix = now.toISOString().slice(0, 11);
      let startTime: string | undefined;
      if (addSessionForm.start_hour && addSessionForm.start_minute) {
        let h = parseInt(addSessionForm.start_hour, 10);
        if (addSessionForm.start_ampm === 'PM' && h < 12) h += 12;
        if (addSessionForm.start_ampm === 'AM' && h === 12) h = 0;
        const hh = String(h).padStart(2, '0');
        const mm = addSessionForm.start_minute.padStart(2, '0');
        startTime = datePrefix + hh + ':' + mm + ':00';
      }
      const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number: addSessionForm.room_number || null,
          start_time: startTime,
          is_designated: addSessionForm.is_designated,
        }),
      });
      if (res.ok) {
        setShowAddSessionForm(false);
        setAddSessionForm({ room_number: '', start_hour: '', start_minute: '', start_ampm: 'PM', is_designated: false });
        // 목록 새로고침
        const updated = await fetch(`/api/status-board/${selectedSlot.id}`);
        if (updated.ok) {
          const data = await updated.json();
          setStatusRecords(data.records);
        }
        alert('방이 추가되었습니다.');
      } else {
        const data = await res.json();
        alert(data.error || '추가에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 상황판 레코드 삭제
  const handleDeleteSession = async () => {
    if (!selectedSlot || !deleteTargetId) return;
    try {
      const res = await fetch(`/api/status-board/${selectedSlot.id}?recordId=${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
        const remaining = statusRecords.filter(r => r.id !== deleteTargetId);
        setStatusRecords(remaining);
        setSelectedStatusRecord(null);
        if (remaining.length === 0) {
          setShowStatusModal(false);
          setSelectedSlot(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // 상황판 전체 초기화
  const handleResetAllSessions = async () => {
    if (!selectedSlot) return;
    try {
      const res = await fetch(`/api/status-board/${selectedSlot.id}?deleteAll=true`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setShowStatusModal(false);
        setStatusRecords([]);
        setSelectedStatusRecord(null);
        setSelectedSlot(null);
        setShowAddSessionForm(false);
        alert('초기화되었습니다.');
      } else {
        const data = await res.json();
        alert(data.error || '초기화에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const openStatusModal = async (slot: Slot) => {
    setSelectedSlot(slot);
    try {
      const res = await fetch(`/api/status-board/${slot.id}`);
      if (res.status === 404) {
        // 방이 없어도 모달 열기 (새 방 추가 가능하도록)
        setStatusRecords([]);
        setSelectedStatusRecord(null);
        setShowStatusModal(true);
        return;
      }
      if (!res.ok) {
        alert('상황판 조회 중 오류가 발생했습니다.');
        return;
      }
      const data = await res.json();
      setStatusRecords(data.records);
      setSelectedStatusRecord(null);
      setShowStatusModal(true);
    } catch {
      alert('상황판 조회 중 오류가 발생했습니다.');
    }
  };

  const selectStatusRecord = (record: typeof statusRecords[number]) => {
    setSelectedStatusRecord(record);
    setStatusForm({
      room_number: record.room_number || '',
      start_time: record.start_time ? record.start_time.slice(11, 16) : '',
      usage_duration: record.usage_duration !== null ? String(record.usage_duration) : '',
      is_designated: record.is_designated || false,
      event_count: record.event_count !== null ? String(record.event_count) : '',
      is_cancel: false,
    });
  };

  const handleBulkResend = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkResend: true }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusRecords([]);
        setSelectedSlot(null);
        alert('전체 재발송 예정입니다.');
      } else {
        const data = await res.json();
        alert(data.error || '재발송 처리에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceEnd = async () => {
    if (!selectedSlot || !selectedStatusRecord) return;
    setSubmitting(true);
    try {
      // 취소 처리
      if (statusForm.is_cancel) {
        const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recordId: selectedStatusRecord.id, cancel: true }),
        });
        if (res.ok) {
          setShowStatusModal(false);
          setStatusRecords([]);
          setSelectedStatusRecord(null);
          setSelectedSlot(null);
          alert('취소 처리 완료!');
        } else {
          const data = await res.json();
          alert(data.error || '취소 처리에 실패했습니다.');
        }
        setSubmitting(false);
        return;
      }

      const hasUsageDuration = !!statusForm.usage_duration;
      const payload: Record<string, unknown> = {
        recordId: selectedStatusRecord.id,
        room_number: statusForm.room_number,
        start_time: selectedStatusRecord.start_time ? selectedStatusRecord.start_time.slice(0, 11) + statusForm.start_time + ':00' : null,
        is_designated: statusForm.is_designated,
      };
      // 이용시간이 있으면 종료 처리 (forceEnd), 없으면 일반 수정
      if (hasUsageDuration) {
        payload.forceEnd = true;
        payload.usage_duration = parseFloat(statusForm.usage_duration);
      }
      const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusRecords([]);
        setSelectedStatusRecord(null);
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

  const handleStatusResend = async () => {
    if (!selectedSlot || !selectedStatusRecord) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/status-board/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedStatusRecord.id,
          room_number: statusForm.room_number,
          start_time: selectedStatusRecord.start_time ? selectedStatusRecord.start_time.slice(0, 11) + statusForm.start_time + ':00' : null,
          usage_duration: statusForm.usage_duration ? parseFloat(statusForm.usage_duration) : null,
          is_designated: statusForm.is_designated,
          event_count: statusForm.event_count ? parseFloat(statusForm.event_count) : null,
        }),
      });
      if (res.ok) {
        setShowStatusModal(false);
        setStatusRecords([]);
        setSelectedStatusRecord(null);
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
    if (user?.role === 'superadmin') {
      setAdminExtendDays(30);
      setShowAdminExtendModal(true);
    } else {
      setShowExtendModal(true);
    }
  };

  const handleAdminExtend = async () => {
    if (!selectedSlot || adminExtendDays <= 0) return;
    setSubmitting(true);
    try {
      const payload = adminExtendMode === 'add'
        ? { extendDays: adminExtendDays }
        : { setRemainingDays: adminExtendDays };
      const res = await fetch(`/api/admin/slots/${selectedSlot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const msg = adminExtendMode === 'add'
          ? `${selectedSlot.girl_name} 만료일이 ${adminExtendDays}일 연장되었습니다.`
          : `${selectedSlot.girl_name} 만료일이 오늘부터 ${adminExtendDays}일로 설정되었습니다.`;
        alert(msg);
        setShowAdminExtendModal(false);
        fetchSlots();
        if (user?.role === 'superadmin' || user?.role === 'admin') fetchAllSlots();
      } else {
        const data = await res.json();
        alert(data.error || '연장 실패');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSlotSelection = (id: string) => {
    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllSlots = () => {
    const filteredSlots = filterUserIds.length > 0
      ? allSlots.filter(s => filterUserIds.includes(s.user_id))
      : allSlots;
    const allFilteredSelected = filteredSlots.length > 0 && filteredSlots.every(s => selectedSlotIds.has(s.id));
    if (allFilteredSelected) {
      setSelectedSlotIds(prev => {
        const next = new Set(prev);
        filteredSlots.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedSlotIds(prev => {
        const next = new Set(prev);
        filteredSlots.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const handleBatchExtend = async () => {
    if (selectedSlotIds.size === 0 || batchExtendDays === 0) return;
    setSubmitting(true);
    try {
      const payload = batchExtendMode === 'add'
        ? { extendDays: batchExtendDays }
        : { setRemainingDays: batchExtendDays };
      const results = await Promise.all(
        Array.from(selectedSlotIds).map(id =>
          fetch(`/api/admin/slots/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      );
      const successCount = results.filter(r => r.ok).length;
      const msg = batchExtendMode === 'add'
        ? batchExtendDays > 0
          ? `${successCount}개 인원 만료일이 ${batchExtendDays}일 연장되었습니다.`
          : `${successCount}개 인원 만료일이 ${Math.abs(batchExtendDays)}일 차감되었습니다.`
        : `${successCount}개 인원 만료일이 오늘부터 ${batchExtendDays}일로 설정되었습니다.`;
      alert(msg);
      setShowBatchExtendModal(false);
      setSelectedSlotIds(new Set());
      fetchSlots();
      if (user?.role === 'superadmin' || user?.role === 'admin') fetchAllSlots();
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
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

    const isAdminUser = user?.role === 'superadmin' || user?.role === 'admin';
    const apiUrl = isAdminUser ? `/api/admin/slots/${slotId}` : `/api/slots/${slotId}`;

    try {
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        if (isAdminUser) fetchAllSlots();
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
    if (!inlineNewSlot.girlName) {
      alert('아가씨 닉네임을 입력해주세요.');
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

  const handleExtensionRequest = async (slotIds: string[]) => {
    if (!extendForm.depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/slot-extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositorName: extendForm.depositorName,
          slotIds,
        }),
      });

      if (res.ok) {
        alert('연장 신청이 접수되었습니다. 입금 확인 후 연장됩니다.');
        setShowExtendModal(false);
        setShowExtendAllModal(false);
        setExtendForm({ depositorName: '' });
      } else {
        const data = await res.json();
        alert(data.error || '연장 신청 중 오류가 발생했습니다.');
      }
    } catch {
      alert('연장 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
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
          <div className="flex items-center gap-3">
            {(distributor?.logo_url || !distributor) ? (
              <BrandedLogo className="h-12" />
            ) : (
              <span className="text-white font-bold text-lg">{distributor.site_name}</span>
            )}
          </div>
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://open.kakao.com/o/sWYX3Yci"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-neutral-800 rounded-lg transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.72-.2.74-.73 2.68-.84 3.09-.13.52.19.51.4.37.17-.11 2.62-1.78 3.68-2.51.72.11 1.46.16 2.2.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
              고객센터
            </a>
            <a
              href="/download/startalkbot.apk"
              className="px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-neutral-800 rounded-lg transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              앱 다운로드
            </a>
            <button
              onClick={() => router.push('/guide')}
              className="px-3 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              사용방법
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              로그아웃
            </button>
          </div>
          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        {/* 모바일 메뉴 드롭다운 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-800 px-4 py-3 space-y-1">
            <a
              href="https://open.kakao.com/o/sWYX3Yci"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-yellow-400 hover:bg-neutral-800 rounded-lg transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.72-.2.74-.73 2.68-.84 3.09-.13.52.19.51.4.37.17-.11 2.62-1.78 3.68-2.51.72.11 1.46.16 2.2.16 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
              고객센터
            </a>
            <a
              href="/download/startalkbot.apk"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-green-400 hover:bg-neutral-800 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              앱 다운로드
            </a>
            <button
              onClick={() => { router.push('/guide'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              사용방법
            </button>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        )}
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
              스타트톡
            </button>
            <button
              onClick={() => setActiveTab('errandTalk')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'errandTalk'
                  ? 'bg-teal-600 text-white'
                  : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
            >
              심부름톡
            </button>
            <button
              onClick={() => setActiveTab('choiceTalk')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'choiceTalk'
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
            >
              초이스톡
            </button>
            <button
              onClick={() => setActiveTab('package')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'package'
                  ? 'bg-rose-600 text-white'
                  : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
            >
              패키지
            </button>
            {/* superadmin 전용 탭들 */}
            {isSuperAdmin && (
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
                <button
                  onClick={() => {
                    setActiveTab('rooms');
                    fetchRooms();
                    if (eventTimes.length === 0) fetchEventTimes();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'rooms'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  방상태
                </button>
                <button
                  onClick={() => {
                    setActiveTab('distributors');
                    fetchDistributors();
                    if (allUsers.length === 0) fetchAllUsers();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'distributors'
                      ? 'bg-pink-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  총판 관리
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settlement');
                    fetchSettlements();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'settlement'
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  정산
                </button>
              </>
            )}
            {/* admin(총판) 전용 탭 */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('bankAccount')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'bankAccount'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  총판 설정
                </button>
                <button
                  onClick={() => {
                    setActiveTab('settlement');
                    fetchSettlements();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'settlement'
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  정산
                </button>
                <button
                  onClick={() => setActiveTab('serviceManage')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'serviceManage'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-neutral-900 text-neutral-500 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  서비스 관리
                </button>
              </>
            )}
          </div>
        </div>

        {activeTab === 'slots' && (
          <SlotsTab
            user={user}
            isAnyAdmin={isAnyAdmin}
            isSuperAdmin={isSuperAdmin}
            slots={slots}
            filteredSlots={filteredSlots}
            allSlots={allSlots}
            slotCount={slotCount}
            usedSlots={usedSlots}
            emptySlots={emptySlots}
            shops={shops}
            allUsers={allUsers}
            filterUserIds={filterUserIds}
            setFilterUserIds={setFilterUserIds}
            selectedSlotIds={selectedSlotIds}
            setSelectedSlotIds={setSelectedSlotIds}
            setShowBatchExtendModal={setShowBatchExtendModal}
            setShowExtendAllModal={setShowExtendAllModal}
            setShowSlotPurchaseModal={setShowSlotPurchaseModal}
            setShowAdminAddModal={setShowAdminAddModal}
            slotSearch={slotSearch}
            setSlotSearch={setSlotSearch}
            slotSort={slotSort}
            setSlotSort={setSlotSort}
            editingSlotIndex={editingSlotIndex}
            setEditingSlotIndex={setEditingSlotIndex}
            inlineNewSlot={inlineNewSlot}
            setInlineNewSlot={setInlineNewSlot}
            submitting={submitting}
            editingSlotKakaoId={editingSlotKakaoId}
            setEditingSlotKakaoId={setEditingSlotKakaoId}
            kakaoInviteIds={kakaoInviteIds}
            toggleSlotActive={toggleSlotActive}
            toggleSlotSelection={toggleSlotSelection}
            toggleAllSlots={toggleAllSlots}
            openEditModal={openEditModal}
            openExtendModal={openExtendModal}
            openStatusModal={openStatusModal}
            handleAdminDeleteSlot={handleAdminDeleteSlot}
            handleChangeSlotKakaoId={handleChangeSlotKakaoId}
            handleInlineAddSlot={handleInlineAddSlot}
            cancelInlineEdit={cancelInlineEdit}
            copyToClipboard={copyToClipboard}
            formatDate={formatDate}
            getDaysRemaining={getDaysRemaining}
            fetchAllUsers={fetchAllUsers}
          />
        )}

        {activeTab === 'users' && isSuperAdmin && (
          <UsersTab
            allUsers={allUsers}
            usersLoading={usersLoading}
            fetchAllUsers={fetchAllUsers}
          />
        )}

        {activeTab === 'kakaoIds' && isSuperAdmin && (
          <KakaoIdsTab
            kakaoInviteIds={kakaoInviteIds}
            kakaoIdsLoading={kakaoIdsLoading}
            setShowAddKakaoIdModal={setShowAddKakaoIdModal}
            editingKakaoIdDescription={editingKakaoIdDescription}
            setEditingKakaoIdDescription={setEditingKakaoIdDescription}
            editDescriptionValue={editDescriptionValue}
            setEditDescriptionValue={setEditDescriptionValue}
            handleToggleKakaoIdActive={handleToggleKakaoIdActive}
            handleDeleteKakaoId={handleDeleteKakaoId}
            handleUpdateKakaoIdDescription={handleUpdateKakaoIdDescription}
          />
        )}

        {activeTab === 'eventTimes' && isSuperAdmin && (
          <EventTimesTab
            eventTimes={eventTimes}
            eventTimesLoading={eventTimesLoading}
            editingEventTime={editingEventTime}
            setEditingEventTime={setEditingEventTime}
            handleUpdateEventTime={handleUpdateEventTime}
          />
        )}


        {activeTab === 'rooms' && isSuperAdmin && (
          <RoomsTab
            rooms={rooms}
            roomsLoading={roomsLoading}
            roomShopFilter={roomShopFilter}
            setRoomShopFilter={setRoomShopFilter}
            roomStatusFilter={roomStatusFilter}
            setRoomStatusFilter={setRoomStatusFilter}
            roomSort={roomSort}
            setRoomSort={setRoomSort}
            eventTimes={eventTimes}
            fetchRooms={fetchRooms}
          />
        )}

        {activeTab === 'distributors' && isSuperAdmin && (
          <DistributorsTab
            distributors={distributors}
            distributorsLoading={distributorsLoading}
            allUsers={allUsers}
            setShowAddDistributorModal={setShowAddDistributorModal}
            editingDistributor={editingDistributor}
            setEditingDistributor={setEditingDistributor}
            editDistForm={editDistForm}
            setEditDistForm={setEditDistForm}
            handleUpdateDistributor={handleUpdateDistributor}
            handleDeleteDistributor={handleDeleteDistributor}
          />
        )}

        {activeTab === 'settlement' && (isSuperAdmin || isAdmin) && (
          <SettlementTab
            settlements={settlements}
            settlementMonth={settlementMonth}
            setSettlementMonth={setSettlementMonth}
            settlementLoading={settlementLoading}
            isSuperAdmin={isSuperAdmin}
            fetchSettlements={fetchSettlements}
          />
        )}

        {activeTab === 'bankAccount' && isAdmin && (
          <BankAccountTab
            distBankName={distBankName}
            setDistBankName={setDistBankName}
            distAccountNumber={distAccountNumber}
            setDistAccountNumber={setDistAccountNumber}
            distAccountHolder={distAccountHolder}
            setDistAccountHolder={setDistAccountHolder}
            distSlotPrice={distSlotPrice}
            setDistSlotPrice={setDistSlotPrice}
            bankAccountSaving={bankAccountSaving}
            handleSaveBankAccount={handleSaveBankAccount}
          />
        )}

        {activeTab === 'errandTalk' && (
          <ErrandTalkTab />
        )}

        {activeTab === 'choiceTalk' && (
          <ChoiceTalkTab />
        )}

        {activeTab === 'package' && (
          <PackageTab />
        )}

        {activeTab === 'serviceManage' && isSuperAdmin && (
          <ServiceManageTab />
        )}
      </main>

      {/* 총판 추가 모달 */}
      {showAddDistributorModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">총판 추가</h3>
            <form onSubmit={handleAddDistributor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">담당자</label>
                <select
                  value={newDistributor.userId}
                  onChange={(e) => setNewDistributor({ ...newDistributor, userId: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                >
                  <option value="">선택하세요</option>
                  {allUsers.filter(u => u.role !== 'superadmin').map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role === 'admin' ? '총판' : '일반회원'})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">도메인</label>
                <input
                  type="text"
                  value={newDistributor.domain}
                  onChange={(e) => setNewDistributor({ ...newDistributor, domain: e.target.value })}
                  required
                  placeholder="example.com"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">사이트명</label>
                <input
                  type="text"
                  value={newDistributor.siteName}
                  onChange={(e) => setNewDistributor({ ...newDistributor, siteName: e.target.value })}
                  required
                  placeholder="사이트 이름"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">로고 이미지</label>
                <div className="flex items-center gap-3">
                  {newDistributorLogo ? (
                    <img
                      src={URL.createObjectURL(newDistributorLogo)}
                      alt="미리보기"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 text-xs">
                      없음
                    </div>
                  )}
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 rounded-lg text-sm cursor-pointer transition">
                    파일 선택
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewDistributorLogo(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {newDistributorLogo && (
                    <button
                      type="button"
                      onClick={() => setNewDistributorLogo(null)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      제거
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">메인 색상</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newDistributor.primaryColor}
                      onChange={(e) => setNewDistributor({ ...newDistributor, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={newDistributor.primaryColor}
                      onChange={(e) => setNewDistributor({ ...newDistributor, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">보조 색상</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newDistributor.secondaryColor}
                      onChange={(e) => setNewDistributor({ ...newDistributor, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={newDistributor.secondaryColor}
                      onChange={(e) => setNewDistributor({ ...newDistributor, secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-700 pt-4 mt-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">입금 계좌 (본사 → 총판)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newDistributor.bankName || ''}
                    onChange={(e) => setNewDistributor({ ...newDistributor, bankName: e.target.value })}
                    placeholder="은행명"
                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input
                    type="text"
                    value={newDistributor.accountNumber || ''}
                    onChange={(e) => setNewDistributor({ ...newDistributor, accountNumber: e.target.value })}
                    placeholder="계좌번호"
                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input
                    type="text"
                    value={newDistributor.accountHolder || ''}
                    onChange={(e) => setNewDistributor({ ...newDistributor, accountHolder: e.target.value })}
                    placeholder="예금주"
                    className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">판매 금액 (원)</label>
                <input
                  type="number"
                  value={newDistributor.slotPrice || 100000}
                  onChange={(e) => setNewDistributor({ ...newDistributor, slotPrice: parseInt(e.target.value) || 0, extensionPrice: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <p className="text-neutral-500 text-xs mt-1">인원 구매/연장에 동일 적용</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDistributorModal(false);
                    setNewDistributor({ userId: '', domain: '', siteName: '', primaryColor: '#4f46e5', secondaryColor: '#7c3aed', bankName: '', accountNumber: '', accountHolder: '', slotPrice: 100000, extensionPrice: 50000 });
                    setNewDistributorLogo(null);
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={logoUploading}
                  className="flex-1 px-4 py-3 bg-pink-600 hover:bg-pink-500 disabled:bg-neutral-700 text-white rounded-xl transition"
                >
                  {logoUploading ? '업로드 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                초톡 단톡방에 있는 정확한 아가씨 닉네임을 입력해주셔야 자동 발송이 가능합니다.
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
                  onChange={(e) => setNewSlot({ ...newSlot, shopName: e.target.value, customShopName: '', customClosingTime: '' })}
                  className="w-full px-4 py-3 pr-10 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.shop_name}>{shop.shop_name}</option>
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
                초톡 단톡방에 있는 정확한 아가씨 닉네임을 입력해주셔야 자동 발송이 가능합니다.
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
                    <option key={shop.id} value={shop.shop_name}>{shop.shop_name}</option>
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

            <div className="flex gap-3">
              <button
                onClick={() => handleExtensionRequest([selectedSlot.id])}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
              >
                {submitting ? '처리 중...' : '연장 신청'}
              </button>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendForm({ depositorName: '' });
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 직접 연장 모달 (superadmin 전용) */}
      {showAdminExtendModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">만료일 연장 (관리자)</h3>

            {/* 대상 정보 */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-300 text-sm mb-2">
                대상: <span className="text-white font-bold">{selectedSlot.girl_name}</span>
              </p>
              <p className="text-neutral-500 text-xs">
                현재 만료일: {formatDate(selectedSlot.expires_at)}
                {(() => {
                  const days = getDaysRemaining(selectedSlot.expires_at);
                  if (days <= 0) return <span className="text-red-400 ml-2">(만료됨)</span>;
                  if (days <= 7) return <span className="text-yellow-400 ml-2">({days}일 남음)</span>;
                  return <span className="text-neutral-400 ml-2">({days}일 남음)</span>;
                })()}
              </p>
            </div>

            {/* 모드 전환 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAdminExtendMode('add')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                  adminExtendMode === 'add' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                기존 만료일 + 추가
              </button>
              <button
                onClick={() => setAdminExtendMode('set')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                  adminExtendMode === 'set' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                오늘부터 기간 설정
              </button>
            </div>

            {/* 연장 일수 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                {adminExtendMode === 'add' ? '연장 일수' : '남은 기간 (오늘부터)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adminExtendDays}
                  onChange={(e) => setAdminExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-center text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
                <span className="flex items-center text-neutral-400 font-medium">일</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[3, 7, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAdminExtendDays(d)}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                      adminExtendDays === d
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {d}일
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAdminExtend}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-xl transition"
              >
                {submitting ? '처리 중...' : adminExtendMode === 'add' ? `${adminExtendDays}일 연장` : `오늘부터 ${adminExtendDays}일 설정`}
              </button>
              <button
                onClick={() => setShowAdminExtendModal(false)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 연장 모달 */}
      {showBatchExtendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">일괄 만료일 변경</h3>

            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 mb-4">
              <p className="text-indigo-300 text-sm">
                선택된 인원: <span className="text-white font-bold">{selectedSlotIds.size}개</span>
              </p>
            </div>

            {/* 모드 전환 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setBatchExtendMode('add')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                  batchExtendMode === 'add' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                기존 만료일 + 추가
              </button>
              <button
                onClick={() => setBatchExtendMode('set')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                  batchExtendMode === 'set' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                오늘부터 기간 설정
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                {batchExtendMode === 'add' ? '연장/차감 일수 (마이너스 = 차감)' : '남은 기간 (오늘부터)'}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={batchExtendDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (batchExtendMode === 'set') {
                      setBatchExtendDays(Math.max(1, val || 1));
                    } else {
                      setBatchExtendDays(isNaN(val) ? 0 : val);
                    }
                  }}
                  min={batchExtendMode === 'set' ? 1 : undefined}
                  className={`flex-1 px-4 py-3 bg-neutral-800 border rounded-xl text-center text-lg font-bold focus:ring-2 focus:border-transparent outline-none transition ${
                    batchExtendDays < 0
                      ? 'border-red-500/50 text-red-400 focus:ring-red-500'
                      : 'border-neutral-700 text-white focus:ring-emerald-500'
                  }`}
                />
                <span className="flex items-center text-neutral-400 font-medium">일</span>
              </div>
              {batchExtendMode === 'add' && (
                <div className="flex gap-2 mt-2">
                  {[-30, -15, -7, -3].map((d) => (
                    <button
                      key={d}
                      onClick={() => setBatchExtendDays(d)}
                      className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                        batchExtendDays === d
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-red-400'
                      }`}
                    >
                      {d}일
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {[3, 7, 15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setBatchExtendDays(d)}
                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition ${
                      batchExtendDays === d
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    +{d}일
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBatchExtend}
                disabled={submitting}
                className={`flex-1 py-3 text-white font-semibold rounded-xl transition ${
                  batchExtendDays < 0
                    ? 'bg-red-600 hover:bg-red-500 disabled:bg-red-800'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800'
                }`}
              >
                {submitting ? '처리 중...' : batchExtendMode === 'add'
                  ? batchExtendDays >= 0
                    ? `${selectedSlotIds.size}개 ${batchExtendDays}일 연장`
                    : `${selectedSlotIds.size}개 ${Math.abs(batchExtendDays)}일 차감`
                  : `${selectedSlotIds.size}개 오늘부터 ${batchExtendDays}일 설정`}
              </button>
              <button
                onClick={() => setShowBatchExtendModal(false)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상황판 수정 모달 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedStatusRecord ? '상황판 수정' : '상황판 기록'}
            </h3>

            {!selectedStatusRecord ? (
              <>
                {/* 레코드 리스트 */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {statusRecords.length === 0 && (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                      진행 중인 방이 없습니다.<br/>아래에서 새 방을 추가하세요.
                    </div>
                  )}
                  {statusRecords.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => selectStatusRecord(record)}
                      className="w-full text-left p-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{record.room_number || '-'}호</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          record.trigger_type === 'canceled'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : record.is_in_progress
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {record.trigger_type === 'canceled' ? '취소' : record.is_in_progress ? '진행 중' : '종료'}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-400 space-x-3">
                        <span>시작: {record.start_time ? record.start_time.slice(11, 16) : '-'}</span>
                        {record.usage_duration !== null && <span>이용: {record.usage_duration}시간</span>}
                        {record.is_designated && <span className="text-indigo-400">지명</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* 새 세션 추가 폼 */}
                {showAddSessionForm ? (
                  <div className="border border-green-500/30 bg-green-900/20 rounded-xl p-4 mb-3 space-y-3">
                    <p className="text-green-400 text-sm font-medium">새 방 추가</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-neutral-400 mb-1">방번호</label>
                        <input
                          type="text"
                          value={addSessionForm.room_number}
                          onChange={(e) => setAddSessionForm({ ...addSessionForm, room_number: e.target.value })}
                          placeholder="예: 204"
                          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-neutral-400 mb-1">시작시간</label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={addSessionForm.start_ampm}
                            onChange={(e) => setAddSessionForm({ ...addSessionForm, start_ampm: e.target.value as 'AM' | 'PM' })}
                            className="px-2 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          >
                            <option value="AM">오전</option>
                            <option value="PM">오후</option>
                          </select>
                          <select
                            value={addSessionForm.start_hour}
                            onChange={(e) => setAddSessionForm({ ...addSessionForm, start_hour: e.target.value })}
                            className="px-2 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          >
                            <option value="">시</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                              <option key={h} value={String(h)}>{h}시</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={addSessionForm.start_minute}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                              setAddSessionForm({ ...addSessionForm, start_minute: v });
                            }}
                            placeholder="분"
                            maxLength={2}
                            className="w-14 px-2 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm text-center focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-400">지명</label>
                      <button
                        type="button"
                        onClick={() => setAddSessionForm({ ...addSessionForm, is_designated: !addSessionForm.is_designated })}
                        className={`px-3 py-1 text-xs rounded-lg font-medium transition ${addSessionForm.is_designated ? 'bg-indigo-600 text-white' : 'bg-neutral-700 text-neutral-400'}`}
                      >
                        {addSessionForm.is_designated ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowAddSessionForm(false); setAddSessionForm({ room_number: '', start_hour: '', start_minute: '', start_ampm: 'PM', is_designated: false }); }}
                        className="flex-1 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-400 text-sm font-medium rounded-lg transition"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleAddSession}
                        disabled={submitting}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white text-sm font-medium rounded-lg transition"
                      >
                        {submitting ? '추가 중...' : '추가'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddSessionForm(true)}
                    className="w-full py-2 mb-3 border border-dashed border-neutral-600 hover:border-green-500 text-neutral-500 hover:text-green-400 text-sm rounded-xl transition"
                  >
                    + 새 방 추가
                  </button>
                )}

                {/* 버튼 */}
                <div className="flex gap-3">
                  {statusRecords.length > 0 && (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-3 bg-red-900/50 hover:bg-red-800 text-red-400 font-semibold rounded-xl transition"
                    >
                      초기화
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setStatusRecords([]);
                      setSelectedSlot(null);
                      setShowAddSessionForm(false);
                    }}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                  >
                    닫기
                  </button>
                  {statusRecords.length > 0 && (
                    <button
                      onClick={handleBulkResend}
                      disabled={submitting || statusRecords[0]?.data_changed}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-semibold rounded-xl transition"
                    >
                      {submitting ? '처리 중...' : statusRecords[0]?.data_changed ? '발송 대기중' : '재발송'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* 선택된 레코드 수정 폼 */}
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    아가씨: <span className="text-white font-bold">{selectedStatusRecord.girl_name}</span>
                  </p>
                  <p className="text-blue-300 text-sm mt-1">
                    상태: <span className={`font-bold ${selectedStatusRecord.is_in_progress ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedStatusRecord.trigger_type === 'canceled' ? '취소' : selectedStatusRecord.is_in_progress ? '진행 중' : '종료'}
                    </span>
                  </p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
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

                  {/* 취소 (진행 중일 때만) */}
                  {selectedStatusRecord.is_in_progress && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-neutral-400">취소 (ㄱㅌ)</label>
                      <button
                        type="button"
                        onClick={() => setStatusForm({ ...statusForm, is_cancel: !statusForm.is_cancel, usage_duration: '' })}
                        className={`px-4 py-1.5 text-sm rounded-lg font-medium transition ${
                          statusForm.is_cancel
                            ? 'bg-red-600 text-white'
                            : 'bg-neutral-700 text-neutral-400'
                        }`}
                      >
                        {statusForm.is_cancel ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  )}

                  {/* 이용시간 (취소가 아닐 때만) */}
                  {!statusForm.is_cancel && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">
                        이용시간{selectedStatusRecord.is_in_progress && ' (입력 시 종료 처리)'}
                      </label>
                      <input
                        type="text"
                        value={statusForm.usage_duration}
                        onChange={(e) => setStatusForm({ ...statusForm, usage_duration: e.target.value })}
                        placeholder="1.5"
                        className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  )}

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
                    onClick={() => { setDeleteTargetId(selectedStatusRecord.id); setShowDeleteConfirm(true); }}
                    disabled={submitting}
                    className="px-4 py-3 bg-red-900/50 hover:bg-red-800 disabled:bg-neutral-700 text-red-400 font-semibold rounded-xl transition"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setSelectedStatusRecord(null)}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                  >
                    목록으로
                  </button>
                  {selectedStatusRecord.is_in_progress ? (
                    <button
                      onClick={handleForceEnd}
                      disabled={submitting}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition"
                    >
                      {submitting ? '처리 중...' : '수정 및 재발송'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStatusResend}
                      disabled={submitting}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition"
                    >
                      {submitting ? '처리 중...' : '수정 및 재발송'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 개별 방 삭제 확인 팝업 */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl p-6">
              <div className="bg-neutral-900 rounded-2xl border border-red-500/40 p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-white mb-2">방 삭제</h3>
                <p className="text-neutral-400 text-sm mb-1">이 방 기록을 삭제하시겠습니까?</p>
                <p className="text-red-400 text-sm font-medium mb-6">이 작업은 되돌릴 수 없습니다!</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); }}
                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteSession}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상황판 초기화 확인 팝업 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-neutral-900 rounded-2xl border border-red-500/40 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">⚠️ 상황판 초기화</h3>
            <p className="text-neutral-400 text-sm mb-1">
              <span className="text-white font-semibold">{selectedSlot?.girl_name}</span>의 모든 상황판 기록이 삭제됩니다.
            </p>
            <p className="text-red-400 text-sm font-medium mb-6">이 작업은 되돌릴 수 없습니다!</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                취소
              </button>
              <button
                onClick={handleResetAllSessions}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 인원 추가 모달 */}
      {showAdminAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">인원 추가 (관리자)</h3>
            <form onSubmit={handleAdminAddSlot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">회원 선택</label>
                <select
                  value={adminNewSlot.userId}
                  onChange={(e) => setAdminNewSlot({ ...adminNewSlot, userId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">회원을 선택하세요</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">아가씨 닉네임</label>
                <input
                  type="text"
                  value={adminNewSlot.girlName}
                  onChange={(e) => setAdminNewSlot({ ...adminNewSlot, girlName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">가게명</label>
                <select
                  value={adminNewSlot.shopName}
                  onChange={(e) => setAdminNewSlot({ ...adminNewSlot, shopName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="">선택 안함</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.shop_name}>{s.shop_name}</option>
                  ))}
                  <option value="기타">기타 (직접 입력)</option>
                </select>
              </div>
              {adminNewSlot.shopName === '기타' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">가게명 직접 입력</label>
                  <input
                    type="text"
                    value={adminNewSlot.customShopName}
                    onChange={(e) => setAdminNewSlot({ ...adminNewSlot, customShopName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdminAddModal(false); setAdminNewSlot({ userId: '', girlName: '', shopName: '', customShopName: '' }); }}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-semibold rounded-xl transition"
                >
                  {submitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
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

            <div className="flex gap-3">
              <button
                onClick={() => handleExtensionRequest(slots.map(s => s.id))}
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl transition"
              >
                {submitting ? '처리 중...' : '연장 신청'}
              </button>
              <button
                onClick={() => {
                  setShowExtendAllModal(false);
                  setExtendForm({ depositorName: '' });
                }}
                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-semibold rounded-xl transition"
              >
                닫기
              </button>
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
