import { ParsedMessage, GirlSignalResult, extractManualTime } from '@/lib/message-parser';
import { HandlerContext, HandlerResult } from './types';
import { updateStatusBoard, checkAndCloseRoom } from './shared';

// ============================================================
// 세션 종료 처리 (상황판만 업데이트)
// ============================================================

export async function handleSessionEnd(
  ctx: HandlerContext,
  parsed: ParsedMessage,
  girlSignals: GirlSignalResult
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt, logId } = ctx;

  // ㅈㅈ(수정) 시 메시지에 수동 지정 시간이 있으면 추출
  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  let manualStartTime: string | null = null;
  if (girlSignals.isCorrection) {
    const girlIdx = parsed.rawMessage.lastIndexOf(slot.girl_name);
    const afterGirlSection = girlIdx >= 0 ? parsed.rawMessage.substring(girlIdx + slot.girl_name.length) : parsed.rawMessage;
    manualStartTime = extractManualTime(afterGirlSection, receivedAt);
  }

  // 기존 레코드에서 start_time 조회
  const { data: existingRecord } = await supabase
    .from('status_board')
    .select('start_time')
    .eq('slot_id', slot.id)
    .eq('room_number', parsed.roomNumber)
    .single();

  const girlStartTime = existingRecord?.start_time || receivedAt;

  // 이벤트 계산 (주석 처리 - 새로 구현 예정, _event-calc.ts 참조)
  const eventCount = 0;
  const isNewRoom = false;

  console.log('handleSessionEnd - usageDuration:', girlSignals.usageDuration, 'manualStartTime:', manualStartTime);

  // 상황판 업데이트
  await updateStatusBoard(supabase, {
    slotId: slot.id,
    userId: slot.user_id,
    shopName: slot.shop_name,
    roomNumber: parsed.roomNumber!,
    girlName: slot.girl_name,
    kakaoId: slot.kakao_id,
    targetRoom: slot.target_room,
    isInProgress: false,
    startTime: girlStartTime,
    endTime: receivedAt,
    usageDuration: girlSignals.usageDuration,
    eventCount: eventCount,
    isCorrection: girlSignals.isCorrection,
    isDesignated: girlSignals.isDesignated,
    sourceLogId: logId,
    manualStartTime: manualStartTime,
  });

  // 방 종료 체크 (모든 아가씨가 ㄲ 되었는지 + keepAliveRooms 체크)
  await checkAndCloseRoom(supabase, parsed.roomNumber!, ctx.sourceRoom, ctx.keepAliveRooms);

  return {
    type: 'end',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    endTime: receivedAt,
    usageDuration: girlSignals.usageDuration,
    eventCount: eventCount,
    isNewRoom: isNewRoom,
  };
}
