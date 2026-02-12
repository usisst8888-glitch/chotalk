import { getSupabase } from '@/lib/supabase';

// 슬롯 정보 (DB에서 조회한 활성 슬롯)
export interface SlotInfo {
  id: string;
  user_id: string;
  girl_name: string;
  shop_name: string | null;
  kakao_id: string | null;
  target_room: string | null;
}

// 핸들러에 전달되는 컨텍스트
export interface HandlerContext {
  supabase: ReturnType<typeof getSupabase>;
  slot: SlotInfo;
  receivedAt: string;
  logId: string | undefined;
  keepAliveRooms?: Set<string>;
}

// 핸들러 반환 타입
export interface HandlerResult {
  type: string;
  slotId: string;
  girlName: string;
  [key: string]: unknown;
}

// updateStatusBoard 입력 데이터
export interface StatusBoardData {
  slotId: string;
  userId: string;
  shopName: string | null;
  roomNumber: string;
  girlName: string;
  kakaoId: string | null;
  targetRoom: string | null;
  isInProgress: boolean;
  startTime: string;
  endTime: string | null;
  usageDuration: number | null;
  eventCount: number | null;
  isCorrection: boolean;
  isDesignated: boolean;
  sourceLogId: string | undefined;
  manualStartTime?: string | null;
}
