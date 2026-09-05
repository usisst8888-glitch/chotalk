import { HandlerContext, HandlerResult } from '../types';
import { getKoreanTime } from '../shared';

// ============================================================
// 취소 처리 (ㄱㅌ) - trigger_type을 'canceled'로 변경
// ============================================================

export async function handleCancel(
  ctx: HandlerContext,
  roomNumber: string | null
): Promise<HandlerResult> {
  const { supabase, slot, logId } = ctx;

  console.log('handleCancel called for:', slot.girl_name, 'roomNumber:', roomNumber);

  // 가장 최근 레코드 찾기
  // 방번호가 있으면 해당 방의 최근 레코드를 직접 찾음 (다른 방 레코드와 충돌 방지)
  let query = supabase
    .from('status_board')
    .select('id, room_number, trigger_type')
    .eq('slot_id', slot.id);

  if (roomNumber) {
    query = query.eq('room_number', roomNumber);
  }

  const { data: recentRecord, error: findError } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !recentRecord) {
    console.log('handleCancel - no record found:', findError, 'room:', roomNumber);
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

  // trigger_type을 'canceled'로 변경하고 is_in_progress를 false로 설정
  const { error: updateError } = await supabase
    .from('status_board')
    .update({
      trigger_type: 'canceled',
      is_in_progress: false,
      updated_at: getKoreanTime(),
      data_changed: true,
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
