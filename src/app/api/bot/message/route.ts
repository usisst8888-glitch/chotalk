import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage, parseGirlSignals } from '@/lib/message-parser';

// ============================================================
// 한국 시간 (KST) 헬퍼 함수
// ============================================================

function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().slice(0, -1); // 'Z' 제거하여 2026-01-30T14:59:21.000 형식
}

// ============================================================
// 방(Room) 관리 함수
// ============================================================

// 방 조회 또는 생성 (아가씨 시작 시 호출)
async function getOrCreateRoom(
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
async function checkAndCloseRoom(
  supabase: ReturnType<typeof getSupabase>,
  roomNumber: string,
  shopName: string | null
): Promise<void> {
  // 해당 방에서 아직 진행 중인 아가씨가 있는지 확인
  const { data: activeGirls, error } = await supabase
    .from('status_board')
    .select('id')
    .eq('room_number', roomNumber)
    .eq('shop_name', shopName || '')
    .eq('is_in_progress', true);

  if (error) {
    console.error('Check active girls error:', error);
    return;
  }

  // 진행 중인 아가씨가 없으면 방 종료
  if (!activeGirls || activeGirls.length === 0) {
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('room_number', roomNumber)
      .eq('shop_name', shopName || '')
      .eq('is_active', true);

    if (updateError) {
      console.error('Room close error:', updateError);
    } else {
      console.log('Room closed:', roomNumber, shopName);
    }
  }
}

// ============================================================
// 이벤트 계산 함수
// ============================================================

interface EventCalculation {
  eventCount: number;
  isNewRoom: boolean;
}

async function calculateEventCount(
  supabase: ReturnType<typeof getSupabase>,
  shopName: string | null,
  roomStartTime: string,
  girlStartTime: string,
  girlEndTime: string,
  usageDuration: number | null
): Promise<EventCalculation> {
  if (!shopName || usageDuration === null || usageDuration <= 0) {
    return { eventCount: 0, isNewRoom: false };
  }

  // 이벤트 시간 조회
  const { data: eventTime } = await supabase
    .from('event_times')
    .select('start_time, end_time')
    .eq('shop_name', shopName)
    .eq('is_active', true)
    .single();

  if (!eventTime) {
    console.log('No event time found for shop:', shopName);
    return { eventCount: 0, isNewRoom: false };
  }

  // 시간 파싱 (예: "15:00" → 15시 00분)
  const [eventStartHour, eventStartMin] = eventTime.start_time.split(':').map(Number);
  const [eventEndHour, eventEndMin] = eventTime.end_time.split(':').map(Number);

  // 방 시작 시간 파싱
  const roomStart = new Date(roomStartTime);
  const girlEnd = new Date(girlEndTime);

  // 이벤트 시작 시간 (오늘 날짜 기준)
  const eventStart = new Date(girlEnd);
  eventStart.setHours(eventStartHour, eventStartMin, 0, 0);

  // 이벤트 종료 시간
  const eventEnd = new Date(girlEnd);
  eventEnd.setHours(eventEndHour, eventEndMin, 0, 0);

  // 신규방 기준: 이벤트 시작 1시간 전 (14:00)
  const newRoomThreshold = new Date(eventStart);
  newRoomThreshold.setHours(newRoomThreshold.getHours() - 1);

  // 신규방 판별: 방 시작 시간이 이벤트시작-1시간(14:00) 이후인지
  const isNewRoom = roomStart >= newRoomThreshold;

  console.log('Event calculation:', {
    shopName,
    eventTime: `${eventTime.start_time}-${eventTime.end_time}`,
    roomStartTime,
    girlStartTime,
    girlEndTime,
    usageDuration,
    isNewRoom,
    newRoomThreshold: newRoomThreshold.toISOString(),
    eventEnd: eventEnd.toISOString(),
  });

  let eventCount = 0;

  if (isNewRoom) {
    // 신규방 (방 시작 >= 14:00): 종료가 21:00 이전이면 전체 이벤트
    if (girlEnd <= eventEnd) {
      eventCount = usageDuration;
    }
    // 21:00 이후 종료면 이벤트 0
  } else {
    // 기존방 (방 시작 < 15:00): 종료가 15:00~21:00 사이면 전체 이벤트
    if (girlEnd >= eventStart && girlEnd <= eventEnd) {
      eventCount = usageDuration;
    }
    // 15:00 이전 종료 또는 21:00 이후 종료면 이벤트 0
  }

  console.log('Event count calculated:', eventCount);
  return { eventCount, isNewRoom };
}

// ============================================================
// 메신저봇R에서 메시지 수신
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    // 필수 필드 검증
    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message']
      }, { status: 400 });
    }

    const supabase = getSupabase();
    const messageReceivedAt = receivedAt || getKoreanTime();

    // 활성화된 슬롯 가져오기
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, user_id, girl_name, target_room, kakao_id, is_active, expires_at, shop_name')
      .eq('is_active', true);

    if (slotsError) {
      console.error('Slots query error:', slotsError);
      return NextResponse.json({ success: false, message: '슬롯 조회 오류', error: slotsError.message });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({ success: false, message: '활성화된 슬롯 없음' });
    }

    console.log('Active slots found:', slots.length, 'names:', slots.map(s => s.girl_name));

    // 메시지 파싱
    const girlNames = slots.map(slot => slot.girl_name);
    const parsed = parseMessage(message, girlNames);

    // 매칭된 슬롯 찾기 (아가씨 이름 + 만료 확인)
    const matchedSlots = slots.filter(slot => {
      if (new Date(slot.expires_at) < new Date()) return false;
      return message.includes(slot.girl_name);
    });

    if (matchedSlots.length === 0) {
      console.log('No matched slots. Message:', message, 'Available girls:', girlNames);
      // 만료 체크 로그
      slots.forEach(slot => {
        const isExpired = new Date(slot.expires_at) < new Date();
        const isInMessage = message.includes(slot.girl_name);
        console.log(`Slot ${slot.girl_name}: expired=${isExpired}, inMessage=${isInMessage}, expires_at=${slot.expires_at}`);
      });
      return NextResponse.json({ success: false, message: '매칭된 아가씨 없음' });
    }

    // 결과 처리
    const results = [];

    for (const slot of matchedSlots) {
      // 해당 아가씨에게 해당하는 신호만 파싱
      const girlSignals = parseGirlSignals(message, slot.girl_name, girlNames);

      // 템플릿 조회 (user_id로)
      const { data: template } = await supabase
        .from('user_templates')
        .select('id')
        .eq('user_id', slot.user_id)
        .single();

      const userTemplateId = template?.id || null;

      // 1. message_logs에 원본 메시지 저장 (항상)
      const { data: log, error: logError } = await supabase
        .from('message_logs')
        .insert({
          slot_id: slot.id,
          user_id: slot.user_id,
          source_room: room,
          sender_name: sender,
          message: message,
          user_template_id: userTemplateId,
          received_at: messageReceivedAt,
        })
        .select()
        .single();

      if (logError) {
        console.error('message_logs insert error:', logError);
      } else {
        console.log('message_logs inserted:', log?.id);
      }

      // ====================================================
      // 2. status_board 테이블 처리
      // 우선순위:
      // 0. ㄱㅌ(취소) → 해당 세션 DELETE
      // 1. ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 INSERT
      // 2. ㅈㅈㅎ/재진행 → 가장 최근 종료 레코드를 시작으로 UPDATE
      // 3. ㄲ(종료) → 세션 종료 처리
      // 4. 방번호만 → 세션 시작 처리
      // ====================================================

      if (girlSignals.isCancel) {
        // ㄱㅌ(취소) → 해당 세션 삭제
        const result = await handleCancel(supabase, slot, log?.id);
        results.push({ ...result, logId: log?.id });

      } else if (girlSignals.isNewSession && parsed.roomNumber) {
        // ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 시작 (INSERT)
        const result = await handleNewSession(
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id, userTemplateId
        );
        results.push({ ...result, logId: log?.id });

      } else if (girlSignals.isResume) {
        // ㅈㅈㅎ/재진행 → 가장 최근 종료 레코드를 시작으로 되돌림 (UPDATE)
        const result = await handleResume(
          supabase, slot, messageReceivedAt, log?.id
        );
        results.push({ ...result, logId: log?.id });

      } else if (girlSignals.isEnd && parsed.roomNumber) {
        // 해당 아가씨 뒤에 ㄲ 있음 → 세션 종료 처리
        const result = await handleSessionEnd(
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id, userTemplateId
        );
        results.push({ ...result, logId: log?.id });

      } else if (parsed.roomNumber) {
        // ㄲ 없음 + 방번호 있음 → 세션 시작 처리
        const result = await handleSessionStart(
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id, userTemplateId
        );
        results.push({ ...result, logId: log?.id });

      } else {
        // 방번호 없음 → 일반 메시지
        results.push({
          type: 'message',
          logId: log?.id,
          slotId: slot.id,
          girlName: slot.girl_name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      matched: results.length,
      parsed: {
        roomNumber: parsed.roomNumber,
        isEnd: parsed.isEnd,
        isCorrection: parsed.isCorrection,
        usageDuration: parsed.usageDuration,
      },
      results,
    });

  } catch (error) {
    console.error('Bot message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// ============================================================
// 현시간재진행 처리 (ㅎㅅㄱㅈㅈㅎ) - 새 세션 INSERT
// ============================================================

async function handleNewSession(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isDesignated: boolean },
  receivedAt: string,
  logId: string | undefined,
  userTemplateId: string | null
) {
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
      user_template_id: userTemplateId,
      is_designated: girlSignals.isDesignated,
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

async function handleResume(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  receivedAt: string,
  logId: string | undefined
) {
  console.log('handleResume called for:', slot.girl_name);

  // 가장 최근에 종료된 레코드 찾기 (is_in_progress = false)
  const { data: endedRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !endedRecord) {
    console.log('handleResume - no ended record found:', findError);
    return {
      type: 'resume_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '되돌릴 종료 레코드 없음',
    };
  }

  // 종료 → 시작으로 되돌림 (is_in_progress = true, end_time = null, usage_duration = null)
  const { error: updateError } = await supabase
    .from('status_board')
    .update({
      is_in_progress: true,
      end_time: null,
      usage_duration: null,
      trigger_type: 'start',
      source_log_id: logId || null,
      updated_at: getKoreanTime(),
    })
    .eq('id', endedRecord.id);

  if (updateError) {
    console.error('handleResume update error:', updateError);
  }

  return {
    type: 'resume',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: endedRecord.room_number,
  };
}

// ============================================================
// 취소 처리 (ㄱㅌ) - 해당 세션 DELETE
// ============================================================

async function handleCancel(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string },
  logId: string | undefined
) {
  console.log('handleCancel called for:', slot.girl_name);

  // 가장 최근 레코드 찾아서 삭제
  const { data: recentRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (findError || !recentRecord) {
    console.log('handleCancel - no record found:', findError);
    return {
      type: 'cancel_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '삭제할 레코드 없음',
    };
  }

  // 레코드 삭제
  const { error: deleteError } = await supabase
    .from('status_board')
    .delete()
    .eq('id', recentRecord.id);

  if (deleteError) {
    console.error('handleCancel delete error:', deleteError);
    return {
      type: 'cancel_failed',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: '삭제 실패',
    };
  }

  console.log('handleCancel success - deleted record:', recentRecord.id, 'room:', recentRecord.room_number);

  return {
    type: 'cancel',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: recentRecord.room_number,
    deletedRecordId: recentRecord.id,
  };
}

// ============================================================
// 세션 시작 처리 (sessions 테이블에 저장)
// ============================================================

async function handleSessionStart(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isEnd: boolean; isCorrection: boolean; isDesignated: boolean; usageDuration: number | null },
  receivedAt: string,
  logId: string | undefined,
  userTemplateId: string | null
) {
  console.log('handleSessionStart called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber, 'isDesignated:', girlSignals.isDesignated);

  // 방 조회 또는 생성
  const roomInfo = await getOrCreateRoom(supabase, parsed.roomNumber!, slot.shop_name, receivedAt);

  // 상황판에 저장
  await updateStatusBoard(supabase, {
    slotId: slot.id,
    userId: slot.user_id,
    shopName: slot.shop_name,
    roomNumber: parsed.roomNumber!,
    girlName: slot.girl_name,
    kakaoId: slot.kakao_id,
    targetRoom: slot.target_room,
    isInProgress: true,
    startTime: receivedAt,
    endTime: null,
    usageDuration: null,
    eventCount: null,
    isCorrection: girlSignals.isCorrection,
    isDesignated: girlSignals.isDesignated,
    sourceLogId: logId,
    userTemplateId: userTemplateId,
  });

  return {
    type: 'start',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: receivedAt,
    isNewRoom: roomInfo.isNewRoom,
  };
}

// ============================================================
// 세션 종료 처리 (상황판만 업데이트)
// ============================================================

async function handleSessionEnd(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isEnd: boolean; isCorrection: boolean; isDesignated: boolean; usageDuration: number | null },
  receivedAt: string,
  logId: string | undefined,
  userTemplateId: string | null
) {
  // 기존 레코드에서 start_time 조회
  const { data: existingRecord } = await supabase
    .from('status_board')
    .select('start_time')
    .eq('slot_id', slot.id)
    .eq('room_number', parsed.roomNumber)
    .single();

  const girlStartTime = existingRecord?.start_time || receivedAt;

  // rooms 테이블에서 room_start_time 조회
  const { data: room } = await supabase
    .from('rooms')
    .select('room_start_time')
    .eq('room_number', parsed.roomNumber)
    .eq('shop_name', slot.shop_name || '')
    .eq('is_active', true)
    .single();

  const roomStartTime = room?.room_start_time || girlStartTime;

  // 이벤트 계산
  const { eventCount, isNewRoom } = await calculateEventCount(
    supabase,
    slot.shop_name,
    roomStartTime,
    girlStartTime,
    receivedAt,
    girlSignals.usageDuration
  );

  console.log('handleSessionEnd - eventCount:', eventCount, 'isNewRoom:', isNewRoom);

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
    userTemplateId: userTemplateId,
  });

  // 방 종료 체크 (모든 아가씨가 ㄲ 되었는지)
  await checkAndCloseRoom(supabase, parsed.roomNumber!, slot.shop_name);

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

// ============================================================
// 상황판 업데이트 (정제된 현재 상황 + 발송 상태 관리)
// ============================================================

async function updateStatusBoard(
  supabase: ReturnType<typeof getSupabase>,
  data: {
    slotId: string;
    userId: string;
    shopName: string | null;
    roomNumber: string;
    girlName: string;
    kakaoId: string | null;
    targetRoom: string | null;
    isInProgress: boolean;
    startTime: string;
    endTime: string | null;
    usageDuration: number | null;
    eventCount: number | null;
    isCorrection: boolean;
    isDesignated: boolean;
    sourceLogId: string | undefined;
    userTemplateId: string | null;
  }
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
    // ㅈㅈ(수정) 신호일 때: slot_id(아가씨)로만 찾아서 기존 레코드 수정
    if (data.isCorrection) {
      const { data: existingBySlot, error: findError } = await supabase
        .from('status_board')
        .select('id')
        .eq('slot_id', data.slotId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Correction mode - existingBySlot:', existingBySlot, 'error:', findError);

      if (existingBySlot) {
        // 기존 레코드 수정 (방번호 등 업데이트, start_time은 유지!)
        const { error: updateError } = await supabase
          .from('status_board')
          .update({
            room_number: data.roomNumber,
            is_in_progress: data.isInProgress,
            // start_time은 수정하지 않음 - 처음 등록 시간 유지
            end_time: data.endTime,
            usage_duration: data.usageDuration,
            event_count: data.eventCount,
            trigger_type: data.isInProgress ? 'start' : 'end',
            source_log_id: data.sourceLogId || null,
            user_template_id: data.userTemplateId,
            is_designated: data.isDesignated,
            updated_at: getKoreanTime(),
          })
          .eq('id', existingBySlot.id);

        if (updateError) {
          console.error('Status board correction update error:', updateError);
        }
        return; // 수정 완료
      }
      // 수정할 레코드가 없으면 아래에서 새로 생성
    }

    // 일반 흐름: slot + room_number 조합으로 기존 레코드 찾기
    const { data: existing, error: findError } = await supabase
      .from('status_board')
      .select('id')
      .eq('slot_id', data.slotId)
      .eq('room_number', data.roomNumber)
      .single();

    console.log('Normal mode - existing:', existing, 'error:', findError);

    if (existing) {
      // 기존 레코드가 있고 usageDuration이 있을 때만 업데이트
      if (data.usageDuration !== null) {
        const { error: updateError } = await supabase
          .from('status_board')
          .update({
            is_in_progress: data.isInProgress,
            start_time: data.startTime,
            end_time: data.endTime,
            usage_duration: data.usageDuration,
            event_count: data.eventCount,
            trigger_type: 'end',
            source_log_id: data.sourceLogId || null,
            user_template_id: data.userTemplateId,
            is_designated: data.isDesignated,
            updated_at: getKoreanTime(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Status board update error:', updateError);
        }
      }
      // usageDuration이 없으면 업데이트 안 함
    } else {
      // 새 레코드 생성 (첫 진입)
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
          user_template_id: data.userTemplateId,
          is_designated: data.isDesignated,
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
