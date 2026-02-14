import { getSupabase } from '@/lib/supabase';
import { StatusBoardData } from './types';

// ============================================================
// 한국 시간 (KST) 헬퍼 함수
// ============================================================

export function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().slice(0, -1); // 'Z' 제거하여 2026-01-30T14:59:21.000 형식
}

// ============================================================
// 방(Room) 관리 함수
// ============================================================

// 방 조회 또는 생성 (아가씨 시작 시 호출)
export async function getOrCreateRoom(
  supabase: ReturnType<typeof getSupabase>,
  roomNumber: string,
  shopName: string | null,
  startTime: string
): Promise<{ roomId: string; roomStartTime: string; isNewRoom: boolean }> {
  // 같은 room_number + shop_name에서 활성 방 찾기
  const { data: activeRoom } = await supabase
    .from('rooms')
    .select('id, room_start_time')
    .eq('room_number', roomNumber)
    .eq('shop_name', shopName || '')
    .eq('is_active', true)
    .single();

  if (activeRoom) {
    // 기존 활성 방에 합류
    console.log('Joining existing room:', activeRoom.id, 'started at:', activeRoom.room_start_time);
    return {
      roomId: activeRoom.id,
      roomStartTime: activeRoom.room_start_time,
      isNewRoom: false,
    };
  }

  // 새 방 생성
  const { data: newRoom, error: insertError } = await supabase
    .from('rooms')
    .insert({
      room_number: roomNumber,
      shop_name: shopName || '',
      room_start_time: startTime,
      is_active: true,
    })
    .select('id, room_start_time')
    .single();

  if (insertError || !newRoom) {
    console.error('Room creation error:', insertError);
    // 에러 시에도 계속 진행할 수 있도록 임시 값 반환
    return {
      roomId: '',
      roomStartTime: startTime,
      isNewRoom: true,
    };
  }

  console.log('Created new room:', newRoom.id, 'started at:', newRoom.room_start_time);
  return {
    roomId: newRoom.id,
    roomStartTime: newRoom.room_start_time,
    isNewRoom: true,
  };
}

// 방 종료 확인 (모든 아가씨가 ㄲ되었는지)
// keepAliveRooms: 미등록 아가씨의 ㅇㅈ/ㅈㅈㅎ 신호가 있는 방 (닫지 않음)
// TODO: 방 종료 로직은 추후 별도 개발 (rooms와 status_board는 완전 별개)
export async function checkAndCloseRoom(
  _supabase: ReturnType<typeof getSupabase>,
  _roomNumber: string,
  _shopName: string | null,
  _keepAliveRooms?: Set<string>
): Promise<void> {
  // 보류: 방 종료 시점 로직 미정
  return;
}

// ============================================================
// 상황판 업데이트 (정제된 현재 상황 + 발송 상태 관리)
// ============================================================

export async function updateStatusBoard(
  supabase: ReturnType<typeof getSupabase>,
  data: StatusBoardData
) {
  console.log('updateStatusBoard called:', {
    slotId: data.slotId,
    roomNumber: data.roomNumber,
    girlName: data.girlName,
    isInProgress: data.isInProgress,
    isCorrection: data.isCorrection,
    isDesignated: data.isDesignated,
    usageDuration: data.usageDuration,
  });

  try {
    // ㅈㅈ(수정) 신호일 때: 방번호가 반드시 있어야 해당 방의 최근 레코드 수정
    if (data.isCorrection) {
      if (!data.roomNumber) {
        console.log('Correction mode - 방번호 없음, 무시');
        return;
      }

      const { data: existingBySlot, error: findError } = await supabase
        .from('status_board')
        .select('id, start_time, trigger_type, room_number')
        .eq('slot_id', data.slotId)
        .eq('room_number', data.roomNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Correction mode - existingBySlot:', existingBySlot, 'roomFilter:', data.roomNumber, 'error:', findError);

      if (existingBySlot) {
        // ㅈㅈ(수정) + ㄲ(종료) 조합 처리:
        // - trigger_type이 변경되면 → trigger_type만 변경 (data_changed = false)
        // - trigger_type이 동일하면 → data_changed = true (재발송 트리거)
        // 이렇게 해야 한 번만 발송됨!

        const expectedTriggerType = data.isInProgress ? 'start' : 'end';
        const triggerTypeChanging = existingBySlot.trigger_type !== expectedTriggerType;

        // 기존 레코드 수정 (방번호는 변경하지 않음!)
        const updateData: Record<string, unknown> = {
          is_in_progress: data.isInProgress,
          end_time: data.endTime,
          usage_duration: data.usageDuration,
          event_count: data.eventCount,
          trigger_type: expectedTriggerType,
          source_log_id: data.sourceLogId || null,
          is_designated: data.isDesignated,
          is_event: data.isEvent,
          updated_at: getKoreanTime(),
          data_changed: true,
        };

        // 수동 지정 시간이 있으면 start_time도 업데이트
        if (data.manualStartTime) {
          updateData.start_time = data.manualStartTime;
        }

        const { error: updateError } = await supabase
          .from('status_board')
          .update(updateData)
          .eq('id', existingBySlot.id);

        if (updateError) {
          console.error('Status board correction update error:', updateError);
        }
        return; // 수정 완료
      }
      // 수정할 레코드가 없으면 아래에서 새로 생성
    }

    // 일반 흐름: slot + room_number + is_in_progress=true 조합으로 진행 중인 레코드만 찾기
    const { data: inProgressRecord, error: findError } = await supabase
      .from('status_board')
      .select('id')
      .eq('slot_id', data.slotId)
      .eq('room_number', data.roomNumber)
      .eq('is_in_progress', true)
      .single();

    console.log('Normal mode - inProgressRecord:', inProgressRecord, 'error:', findError);

    if (inProgressRecord) {
      // 진행 중인 레코드가 있음
      if (!data.isInProgress) {
        // 종료 처리 (ㄲ) - usageDuration 유무와 관계없이 is_in_progress=false, trigger_type='end'
        const { error: updateError } = await supabase
          .from('status_board')
          .update({
            is_in_progress: false,
            start_time: data.startTime,
            end_time: data.endTime,
            usage_duration: data.usageDuration,
            event_count: data.eventCount,
            trigger_type: 'end',
            source_log_id: data.sourceLogId || null,
            is_designated: data.isDesignated,
            is_event: data.isEvent,
            updated_at: getKoreanTime(),
            data_changed: true,
          })
          .eq('id', inProgressRecord.id);

        if (updateError) {
          console.error('Status board update error:', updateError);
        }
      }
      // isInProgress가 true이면 (시작인데 이미 진행 중) → 무시
    } else {
      // 진행 중인 레코드가 없음
      if (data.usageDuration !== null) {
        // 이미 종료된 세션에 usage_duration 추가 (예: "ㄲ" 후 "3ㄲ")
        const { data: endedRecord } = await supabase
          .from('status_board')
          .select('id')
          .eq('slot_id', data.slotId)
          .eq('room_number', data.roomNumber)
          .eq('is_in_progress', false)
          .eq('trigger_type', 'end')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (endedRecord) {
          const { error: updateError } = await supabase
            .from('status_board')
            .update({
              usage_duration: data.usageDuration,
              event_count: data.eventCount,
              source_log_id: data.sourceLogId || null,
              updated_at: getKoreanTime(),
            })
            .eq('id', endedRecord.id);

          if (updateError) {
            console.error('종료된 세션 usage_duration 업데이트 오류:', updateError);
          } else {
            console.log('종료된 세션에 usage_duration 업데이트:', data.usageDuration);
          }
        } else {
          console.log('Warning: 종료 요청인데 진행 중인/종료된 세션 없음');
        }
        return;
      }
      // 종료 요청인데 세션이 없으면 무시 (start가 아닌 end가 먼저 온 경우)
      if (!data.isInProgress) {
        console.log('Warning: 종료 요청인데 진행 중인 세션 없음 (duration 없음) - INSERT 무시');
        return;
      }
      console.log('Inserting new status_board record...');
      const { error: insertError } = await supabase
        .from('status_board')
        .insert({
          slot_id: data.slotId,
          user_id: data.userId,
          shop_name: data.shopName,
          room_number: data.roomNumber,
          girl_name: data.girlName,
          kakao_id: data.kakaoId,
          target_room: data.targetRoom,
          is_in_progress: data.isInProgress,
          start_time: data.startTime,
          end_time: data.endTime,
          usage_duration: data.usageDuration,
          event_count: data.eventCount,
          trigger_type: 'start',
          source_log_id: data.sourceLogId || null,
          is_designated: data.isDesignated,
          is_event: data.isEvent,
          data_changed: true,
        });

      if (insertError) {
        console.error('Status board insert error:', insertError);
      } else {
        console.log('Status board insert success!');
      }
    }
  } catch (error) {
    console.error('Status board update error:', error);
  }
}
