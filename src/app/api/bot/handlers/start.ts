import { ParsedMessage, extractManualTime } from '@/lib/message-parser';
import { GirlSignalResult } from '@/lib/message-parser';
import { HandlerContext, HandlerResult } from './types';
import { updateStatusBoard } from './shared';
import { checkIsEvent } from './event';

// ============================================================
// 세션 시작 처리 (status_board에 저장)
// ============================================================

export async function handleSessionStart(
  ctx: HandlerContext,
  parsed: ParsedMessage,
  girlSignals: GirlSignalResult
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt, logId } = ctx;

  // 같은 방번호에서 이미 진행 중인 세션이 있는지 확인
  // 단, ㅈㅈ(수정) 신호일 때는 무시하지 않고 수정 처리
  // 방번호가 다르면 새 방 시작 허용
  if (parsed.roomNumber && !girlSignals.isCorrection) {
    const { data: existingSession } = await supabase
      .from('status_board')
      .select('id, room_number')
      .eq('slot_id', slot.id)
      .eq('room_number', parsed.roomNumber)
      .eq('is_in_progress', true)
      .single();

    if (existingSession) {
      console.log('handleSessionStart - 같은 방에서 이미 진행 중:', slot.girl_name, '방:', parsed.roomNumber, '→ 무시');
      return {
        type: 'ignored',
        slotId: slot.id,
        girlName: slot.girl_name,
        reason: `${parsed.roomNumber}번 방에서 이미 진행 중`,
      };
    }
  }

  // 메시지에 수동 지정 시간이 있으면 사용, 없으면 receivedAt 사용
  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  const girlIdx = parsed.rawMessage.lastIndexOf(slot.girl_name);
  const afterGirlSection = girlIdx >= 0 ? parsed.rawMessage.substring(girlIdx + slot.girl_name.length) : parsed.rawMessage;
  const manualTime = extractManualTime(afterGirlSection, receivedAt);
  const startTime = manualTime || receivedAt;

  console.log('handleSessionStart called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber, 'isDesignated:', girlSignals.isDesignated, 'manualTime:', manualTime);

  // 이벤트 적용 여부 확인
  const isEvent = await checkIsEvent(supabase, slot.id, slot.shop_name, startTime);

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
    isEvent,
  });

  return {
    type: 'start',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: startTime,
  };
}
