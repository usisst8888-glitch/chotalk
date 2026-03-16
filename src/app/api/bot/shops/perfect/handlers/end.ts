import { ParsedMessage, GirlSignalResult, extractManualTime } from '../parser';
import { HandlerContext, HandlerResult } from '../types';
import { updateStatusBoard, checkAndCloseRoom } from '../shared';
import { checkIsEvent } from '../event';

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
  // ㅈㅈ+ㄲ(정정+종료)일 때는 가장 최근 종료된 세션의 방번호를 수정
  // 예: 404 제니 3ㄲ → 503 제니 ㅅㅅ → ㅈㅈ402 제니 3ㄲ → 404(종료)를 402로 변경
  let existingRecord: { start_time: string; id?: string; room_number?: string } | null = null;
  if (girlSignals.isCorrection) {
    // 1. 먼저 해당 방번호에 진행중 세션이 있는지 확인
    const { data: activeAtRoom } = await supabase
      .from('status_board')
      .select('id, start_time, room_number')
      .eq('slot_id', slot.id)
      .eq('room_number', parsed.roomNumber)
      .eq('is_in_progress', true)
      .single();

    if (activeAtRoom) {
      // 진행중 세션이 해당 방번호에 있으면 → 일반 종료로 처리 (방번호 변경 아님)
      console.log('ㅈㅈ+ㄲ 진행중 세션 종료 (일반 종료 플로우):', slot.girl_name, '방:', parsed.roomNumber);
      existingRecord = activeAtRoom;
      girlSignals.isCorrection = false; // 일반 종료 플로우로 전환
    } else {
      // 2. 진행중 세션이 없으면 → 최근 종료 세션 찾기 (방번호 변경 가능)
      const { data } = await supabase
        .from('status_board')
        .select('id, start_time, room_number')
        .eq('slot_id', slot.id)
        .eq('is_in_progress', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      existingRecord = data;

      // 방번호가 다르면 업데이트
      if (existingRecord && parsed.roomNumber && existingRecord.room_number !== parsed.roomNumber) {
        console.log('ㅈㅈ+ㄲ 방번호 변경:', slot.girl_name, existingRecord.room_number, '→', parsed.roomNumber);
        await supabase
          .from('status_board')
          .update({ room_number: parsed.roomNumber, updated_at: new Date().toISOString(), data_changed: true })
          .eq('id', existingRecord.id);
      }
    }
  } else {
    const { data } = await supabase
      .from('status_board')
      .select('start_time')
      .eq('slot_id', slot.id)
      .eq('room_number', parsed.roomNumber)
      .single();
    existingRecord = data;
  }

  const girlStartTime = existingRecord?.start_time || receivedAt;

  // 이벤트 적용 여부 확인
  const isEvent = await checkIsEvent(supabase, slot.id, slot.shop_name, girlStartTime);
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
    isEvent,
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
