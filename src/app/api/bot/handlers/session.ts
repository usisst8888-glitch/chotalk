import { ParsedMessage } from '@/lib/message-parser';
import { HandlerContext, HandlerResult } from './types';
import { getKoreanTime, getOrCreateRoom } from './shared';

// ============================================================
// 현시간재진행 처리 (ㅎㅅㄱㅈㅈㅎ) - 새 세션 INSERT
// ============================================================

export async function handleNewSession(
  ctx: HandlerContext,
  parsed: ParsedMessage,
  girlSignals: { isDesignated: boolean }
): Promise<HandlerResult> {
  const { supabase, slot, receivedAt, logId } = ctx;

  console.log('handleNewSession called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber, 'isDesignated:', girlSignals.isDesignated);

  // 방 조회 또는 생성
  const roomInfo = await getOrCreateRoom(supabase, parsed.roomNumber!, slot.shop_name, receivedAt);

  // 새 세션 INSERT (기존 레코드 무시, 무조건 새로 생성)
  const { error: insertError } = await supabase
    .from('status_board')
    .insert({
      slot_id: slot.id,
      user_id: slot.user_id,
      shop_name: slot.shop_name,
      room_number: parsed.roomNumber,
      girl_name: slot.girl_name,
      kakao_id: slot.kakao_id,
      target_room: slot.target_room,
      is_in_progress: true,
      start_time: receivedAt,
      end_time: null,
      usage_duration: null,
      event_count: null,
      trigger_type: 'start',
      source_log_id: logId || null,
      is_designated: girlSignals.isDesignated,
      data_changed: true,
    });

  if (insertError) {
    console.error('handleNewSession insert error:', insertError);
  }

  return {
    type: 'new_session',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: receivedAt,
    isNewRoom: roomInfo.isNewRoom,
  };
}

// ============================================================
// 재진행 처리 (ㅈㅈㅎ) - 가장 최근 종료 레코드를 시작으로 UPDATE
// ============================================================

export async function handleResume(
  ctx: HandlerContext
): Promise<HandlerResult> {
  const { supabase, slot, logId } = ctx;

  console.log('handleResume called for:', slot.girl_name);

  // 가장 최근 레코드 1개만 가져오기 (trigger_type 상관없이, created_at 기준)
  const { data: recentRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number, trigger_type, is_in_progress')
    .eq('slot_id', slot.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !recentRecord) {
    console.log('handleResume - no record found:', findError);
    return {
      type: 'resume_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '레코드 없음',
    };
  }

  // 가장 최근 레코드가 종료/취소 상태가 아니면 재진행 불가
  if ((recentRecord.trigger_type !== 'end' && recentRecord.trigger_type !== 'canceled') || recentRecord.is_in_progress) {
    console.log('handleResume - most recent record is not ended:', recentRecord.trigger_type, recentRecord.is_in_progress);
    return {
      type: 'resume_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: `최근 레코드가 종료 상태가 아님 (${recentRecord.trigger_type})`,
    };
  }

  // 종료 → 시작으로 되돌림 (is_in_progress = true, end_time = null, usage_duration = null)
  const { error: updateError } = await supabase
    .from('status_board')
    .update({
      is_in_progress: true,
      end_time: null,
      usage_duration: null,
      trigger_type: 'hourly',
      source_log_id: logId || null,
      updated_at: getKoreanTime(),
      data_changed: true,  // ㅈㅈㅎ(재진행) 시 재발송 트리거
      end_sent_at: null,   // 발송 상태 초기화 (재발송 가능하게)
    })
    .eq('id', recentRecord.id);

  if (updateError) {
    console.error('handleResume update error:', updateError);
  }

  return {
    type: 'resume',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: recentRecord.room_number,
  };
}
