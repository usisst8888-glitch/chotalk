import { HandlerContext, HandlerResult } from './types';
import { getKoreanTime } from './shared';

// ============================================================
// 취소 처리 (ㄱㅌ) - trigger_type을 'canceled'로 변경
// ============================================================

export async function handleCancel(
  ctx: HandlerContext,
  roomNumber: string | null
): Promise<HandlerResult> {
  const { supabase, slot, logId } = ctx;

  console.log('handleCancel called for:', slot.girl_name, 'roomNumber:', roomNumber);

  // 가장 최근 레코드 찾기 (진행 중 또는 종료 상태 모두 취소 가능)
  const { data: recentRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number, trigger_type, data_changed')
    .eq('slot_id', slot.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !recentRecord) {
    console.log('handleCancel - no record found:', findError);
    return {
      type: 'cancel_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '취소할 레코드 없음',
    };
  }

  // 이미 취소된 레코드는 무시
  if (recentRecord.trigger_type === 'canceled') {
    console.log('handleCancel - already canceled:', recentRecord.id);
    return {
      type: 'ignored',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '이미 취소된 레코드',
    };
  }

  // 방번호가 일치하는지 확인 (메시지에 방번호가 있으면 반드시 일치해야 함)
  if (roomNumber && recentRecord.room_number !== roomNumber) {
    console.log('handleCancel - room number mismatch:', recentRecord.room_number, '!=', roomNumber);
    return {
      type: 'ignored',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: `방번호 불일치 (진행중: ${recentRecord.room_number}, 메시지: ${roomNumber})`,
    };
  }

  // data_changed가 아직 true면 → 시작 메시지가 발송 전 취소 → 아무것도 안 보냄
  // data_changed가 false면 → 시작 메시지가 이미 발송됨 → 취소 메시지 발송
  const startAlreadySent = !recentRecord.data_changed;
  console.log('handleCancel - startAlreadySent:', startAlreadySent, 'data_changed:', recentRecord.data_changed);

  // trigger_type을 'canceled'로 변경하고 is_in_progress를 false로 설정
  const { error: updateError } = await supabase
    .from('status_board')
    .update({
      trigger_type: 'canceled',
      is_in_progress: false,
      updated_at: getKoreanTime(),
      data_changed: startAlreadySent, // 시작 발송 후 취소면 true(취소 발송), 발송 전 취소면 false(아무것도 안 보냄)
    })
    .eq('id', recentRecord.id);

  if (updateError) {
    console.error('handleCancel update error:', updateError);
    return {
      type: 'cancel_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '취소 처리 실패',
    };
  }

  console.log('handleCancel success - canceled record:', recentRecord.id, 'room:', recentRecord.room_number);

  return {
    type: 'cancel',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: recentRecord.room_number,
    canceledRecordId: recentRecord.id,
  };
}
