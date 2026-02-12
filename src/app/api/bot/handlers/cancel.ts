import { HandlerContext, HandlerResult } from './types';

// ============================================================
// 취소 처리 (ㄱㅌ) - trigger_type을 'canceled'로 변경
// ============================================================

export async function handleCancel(
  ctx: HandlerContext,
  roomNumber: string | null
): Promise<HandlerResult> {
  const { supabase, slot, logId } = ctx;

  console.log('handleCancel called for:', slot.girl_name, 'roomNumber:', roomNumber);

  // 진행 중인 레코드 찾기 (is_in_progress = true, created_at 기준)
  const { data: recentRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
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

  // trigger_type을 'canceled'로 변경하고 is_in_progress를 false로 설정
  const { error: updateError } = await supabase
    .from('status_board')
    .update({
      trigger_type: 'canceled',
      is_in_progress: false,
      updated_at: new Date().toISOString(),
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
