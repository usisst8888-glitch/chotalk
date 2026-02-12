import { ParsedMessage, extractManualTime } from '@/lib/message-parser';
import { GirlSignalResult } from '@/lib/message-parser';
import { HandlerContext, HandlerResult } from './types';
import { updateStatusBoard } from './shared';

// ============================================================
// 세션 시작 처리 (status_board에 저장)
// ============================================================

export async function handleSessionStart(
  ctx: HandlerContext,
  parsed: ParsedMessage,
  girlSignals: GirlSignalResult
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt, logId } = ctx;

  // 이미 진행 중인 세션이 있는지 확인 (다른 방에서 진행 중이면 무시)
  // 단, ㅈㅈ(수정) 신호일 때는 무시하지 않고 수정 처리
  const { data: existingSession } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .single();

  if (existingSession && !girlSignals.isCorrection) {
    console.log('handleSessionStart - 이미 진행 중인 세션 있음:', slot.girl_name, '현재 방:', existingSession.room_number, '→ 무시');
    return {
      type: 'ignored',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: `이미 ${existingSession.room_number}번 방에서 진행 중`,
    };
  }

  // 메시지에 수동 지정 시간이 있으면 사용, 없으면 receivedAt 사용
  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  const girlIdx = parsed.rawMessage.lastIndexOf(slot.girl_name);
  const afterGirlSection = girlIdx >= 0 ? parsed.rawMessage.substring(girlIdx + slot.girl_name.length) : parsed.rawMessage;
  const manualTime = extractManualTime(afterGirlSection, receivedAt);
  const startTime = manualTime || receivedAt;

  console.log('handleSessionStart called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber, 'isDesignated:', girlSignals.isDesignated, 'manualTime:', manualTime);

  // 상황판에 저장 (rooms 테이블 생성은 /api/bot/room에서 독립 처리)
  await updateStatusBoard(supabase, {
    slotId: slot.id,
    userId: slot.user_id,
    shopName: slot.shop_name,
    roomNumber: parsed.roomNumber!,
    girlName: slot.girl_name,
    kakaoId: slot.kakao_id,
    targetRoom: slot.target_room,
    isInProgress: true,
    startTime: startTime,
    endTime: null,
    usageDuration: null,
    eventCount: null,
    isCorrection: girlSignals.isCorrection,
    isDesignated: girlSignals.isDesignated,
    sourceLogId: logId,
    manualStartTime: girlSignals.isCorrection ? manualTime : null,
  });

  return {
    type: 'start',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: startTime,
  };
}
