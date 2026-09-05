import { ParsedMessage, GirlSignalResult, extractManualTime } from '../parser';
import { HandlerContext, HandlerResult } from '../types';
import { getKoreanTime } from '../shared';
import { handleSessionStart } from './start';

// ============================================================
// ㅈㅈ + 방번호 (ㄲ 없음): 시간패턴이 있으면 시작시간만 수정
// ============================================================

export async function handleCorrectionWithTime(
  ctx: HandlerContext,
  lineMsg: string,
  roomNumber: string
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt } = ctx;

  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  // allowTwoDigit: ㄲ이 없어서 usageDuration 혼동 없으므로 2자리(03→03:00)도 허용
  const corrGirlIdx = lineMsg.lastIndexOf(slot.girl_name);
  const corrAfterGirl = corrGirlIdx >= 0 ? lineMsg.substring(corrGirlIdx + slot.girl_name.length) : lineMsg;
  const manualTime = extractManualTime(corrAfterGirl, receivedAt, { allowTwoDigit: true });

  // 가장 최근 진행중 세션 찾기 (방번호 무관 - ㅈㅈ로 방번호가 바뀔 수 있으므로)
  const { data: record } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!record) {
    // 진행중 세션 없으면 종료된 세션에서 방번호 변경 시도
    // 예: "ㅈㅈ 502 제니 문주 2ㄲ" → 제니는 ㄲ 없이 correction만 → 종료된 세션의 방번호 변경
    const { data: endedRecord } = await supabase
      .from('status_board')
      .select('id, room_number')
      .eq('slot_id', slot.id)
      .eq('is_in_progress', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (endedRecord && roomNumber !== endedRecord.room_number) {
      await supabase
        .from('status_board')
        .update({ room_number: roomNumber, data_changed: true, updated_at: getKoreanTime() })
        .eq('id', endedRecord.id);
      console.log('ㅈㅈ 종료세션 방번호 변경:', slot.girl_name, endedRecord.room_number, '→', roomNumber);
      return { type: 'correction_room', slotId: slot.id, girlName: slot.girl_name, roomNumber };
    }

    console.log('ㅈㅈ 시작시간 수정 - 수정할 세션 없음:', slot.girl_name);
    return { type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: '수정할 레코드 없음' };
  }

  const updateFields: Record<string, unknown> = {
    data_changed: true,
    updated_at: getKoreanTime(),
  };

  if (manualTime) {
    updateFields.start_time = manualTime;
  }

  // 방번호 변경
  if (roomNumber !== record.room_number) {
    updateFields.room_number = roomNumber;
    console.log('ㅈㅈ 방번호 변경:', slot.girl_name, record.room_number, '→', roomNumber);
  }

  if (manualTime || roomNumber !== record.room_number) {
    await supabase
      .from('status_board')
      .update(updateFields)
      .eq('id', record.id);

    console.log('ㅈㅈ 수정 완료:', slot.girl_name, '방:', roomNumber, manualTime ? `시간→${manualTime}` : '');
    return { type: 'correction_time', slotId: slot.id, girlName: slot.girl_name, roomNumber, newStartTime: manualTime };
  } else {
    console.log('ㅈㅈ 시간패턴 없음 - 무시:', lineMsg);
    return { type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: 'ㅈㅈ 시간패턴 없음' };
  }
}

// ============================================================
// ㅈㅈ catch-all: 무조건 정정. 세션 없으면 신규 생성.
// ★ 일반 시작보다 먼저 체크해야 ㅈㅈ 컨텍스트가 우선됨
// ============================================================

export async function handleCorrectionCatchAll(
  ctx: HandlerContext,
  lineMsg: string,
  parsed: ParsedMessage,
  lineSignals: GirlSignalResult
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt } = ctx;

  const { data: activeSession } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .single();

  if (!activeSession) {
    // 세션 없음 → 신규 생성
    console.log('ㅈㅈ 정정 - 세션 없음, 신규 생성:', slot.girl_name, '방:', parsed.roomNumber);
    return handleSessionStart(ctx, parsed, lineSignals);
  }

  // 세션 있음 → 정정
  const corrGirlIdx = lineMsg.lastIndexOf(slot.girl_name);
  const corrAfterGirl = corrGirlIdx >= 0 ? lineMsg.substring(corrGirlIdx + slot.girl_name.length) : lineMsg;
  const manualTime = extractManualTime(corrAfterGirl, receivedAt, { allowTwoDigit: true });

  // 방번호 변경 체크: 새 방번호가 기존과 다르면 업데이트
  const updateFields: Record<string, unknown> = {
    data_changed: true,
    updated_at: getKoreanTime(),
  };

  let roomChanged = false;
  if (parsed.roomNumber && parsed.roomNumber !== activeSession.room_number) {
    updateFields.room_number = parsed.roomNumber;
    roomChanged = true;
    console.log('ㅈㅈ 정정 - 방번호 변경:', slot.girl_name, activeSession.room_number, '→', parsed.roomNumber);
  }

  if (manualTime) {
    updateFields.start_time = manualTime;
  }

  if (manualTime || roomChanged) {
    await supabase
      .from('status_board')
      .update(updateFields)
      .eq('id', activeSession.id);

    const resultRoom = parsed.roomNumber || activeSession.room_number;
    console.log('ㅈㅈ 정정 완료:', slot.girl_name, '방:', resultRoom, manualTime ? `시간→${manualTime}` : '');
    return { type: roomChanged ? 'correction_room' : 'correction_time', slotId: slot.id, girlName: slot.girl_name, roomNumber: resultRoom, newStartTime: manualTime };
  } else {
    console.log('ㅈㅈ 정정 - 변경 없음, 무시:', slot.girl_name);
    return { type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: 'ㅈㅈ 정정 변경사항 없음' };
  }
}
