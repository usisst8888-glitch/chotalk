import { ParsedMessage, GirlSignalResult, extractManualTime } from '@/lib/message-parser';
import { HandlerContext, HandlerResult } from './types';
import { getKoreanTime } from './shared';
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

  if (manualTime) {
    const { data: record } = await supabase
      .from('status_board')
      .select('id')
      .eq('slot_id', slot.id)
      .eq('room_number', roomNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (record) {
      await supabase
        .from('status_board')
        .update({
          start_time: manualTime,
          data_changed: true,
          updated_at: getKoreanTime(),
        })
        .eq('id', record.id);

      console.log('ㅈㅈ 시작시간 수정:', slot.girl_name, '방:', roomNumber, '→', manualTime);
      return { type: 'correction_time', slotId: slot.id, girlName: slot.girl_name, roomNumber, newStartTime: manualTime };
    } else {
      console.log('ㅈㅈ 시작시간 수정 - 레코드 없음:', roomNumber);
      return { type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: '수정할 레코드 없음' };
    }
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

  // 세션 있음 → 정정 (시간패턴 있으면 start_time 수정)
  const corrGirlIdx = lineMsg.lastIndexOf(slot.girl_name);
  const corrAfterGirl = corrGirlIdx >= 0 ? lineMsg.substring(corrGirlIdx + slot.girl_name.length) : lineMsg;
  const manualTime = extractManualTime(corrAfterGirl, receivedAt, { allowTwoDigit: true });

  if (manualTime) {
    await supabase
      .from('status_board')
      .update({
        start_time: manualTime,
        data_changed: true,
        updated_at: getKoreanTime(),
      })
      .eq('id', activeSession.id);

    console.log('ㅈㅈ 정정 - start_time 수정:', slot.girl_name, '방:', activeSession.room_number, '→', manualTime);
    return { type: 'correction_time', slotId: slot.id, girlName: slot.girl_name, roomNumber: activeSession.room_number, newStartTime: manualTime };
  } else {
    console.log('ㅈㅈ 정정 - 시간패턴 없음, 무시:', slot.girl_name);
    return { type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: 'ㅈㅈ 정정 시간패턴 없음' };
  }
}
