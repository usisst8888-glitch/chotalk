import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage, parseGirlSignals, extractManualTime } from '@/lib/message-parser';

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

// 이벤트 날짜 계산 (thresholdHour 기준으로 날짜 구분)
// thresholdHour 이전 → 전날의 이벤트 날짜
// thresholdHour 이후 → 오늘의 이벤트 날짜
function getEventDate(time: Date, thresholdHour: number): Date {
  const eventDate = new Date(time);
  if (eventDate.getHours() < thresholdHour) {
    // thresholdHour 이전이면 전날로 취급
    eventDate.setDate(eventDate.getDate() - 1);
  }
  eventDate.setHours(thresholdHour, 0, 0, 0);
  return eventDate;
}

// 아가씨가 이벤트 상태인지 확인
// - 같은 이벤트 날짜에 이벤트 조건을 만족하는 시작이 있는지 확인
// - 신규방: threshold~이벤트종료 사이 시작
// - 기존방 (도파민만): 이벤트시작시간을 넘김 (종료 시간이 이벤트시작 이후)
async function checkGirlEventStatus(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string,
  currentTime: string,
  eventStartHour: number,
  eventEndHour: number,
  newRoomOffset: number // 도파민: -1, 나머지: 0
): Promise<boolean> {
  const currentDate = new Date(currentTime);
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const hasExistingRoomLogic = newRoomOffset !== 0;
  const eventDate = getEventDate(currentDate, newRoomThresholdHour);

  // 이벤트 날짜 범위: thresholdHour 기준
  const eventDateStart = new Date(eventDate);
  const eventDateEnd = new Date(eventDate);
  eventDateEnd.setDate(eventDateEnd.getDate() + 1);

  console.log('Checking girl event status:', {
    slotId,
    currentTime,
    eventDateStart: eventDateStart.toISOString(),
    eventDateEnd: eventDateEnd.toISOString(),
  });

  // 이 아가씨의 해당 이벤트 날짜 기록 조회 (end_time도 포함)
  const { data: records, error } = await supabase
    .from('status_board')
    .select('start_time, end_time, room_number, shop_name')
    .eq('slot_id', slotId)
    .eq('shop_name', shopName)
    .gte('start_time', eventDateStart.toISOString().slice(0, -1))
    .lt('start_time', eventDateEnd.toISOString().slice(0, -1));

  if (error || !records || records.length === 0) {
    console.log('No records found for event status check');
    return false;
  }

  // 각 기록에서 이벤트 조건을 만족하는지 확인
  for (const record of records) {
    const startTime = new Date(record.start_time);
    const startHour = startTime.getHours();
    const startMin = startTime.getMinutes();
    const startInMinutes = startHour * 60 + startMin;

    // 해당 시작 시간의 방 정보 조회
    const { data: room } = await supabase
      .from('rooms')
      .select('room_start_time')
      .eq('room_number', record.room_number)
      .eq('shop_name', shopName)
      .lte('room_start_time', record.start_time)
      .order('room_start_time', { ascending: false })
      .limit(1)
      .single();

    if (!room) continue;

    const roomStartTime = new Date(room.room_start_time);
    const roomStartHour = roomStartTime.getHours();

    // 신규방 판별
    const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                      (roomStartTime.getDate() !== startTime.getDate() && roomStartHour < newRoomThresholdHour);

    const eventStartInMinutes = eventStartHour * 60;
    const eventEndInMinutes = eventEndHour * 60;

    if (isNewRoom) {
      // 신규방: threshold~이벤트종료 사이 시작하면 이벤트 ON
      const newRoomEventStart = newRoomThresholdHour * 60;
      if (startInMinutes >= newRoomEventStart && startInMinutes < eventEndInMinutes) {
        console.log('Event status ON - New room condition met:', record.start_time);
        return true;
      }
    } else if (hasExistingRoomLogic) {
      // 기존방 (도파민만): 이벤트시작시간을 넘겼는지 확인
      if (record.end_time) {
        const endTime = new Date(record.end_time);
        const endHour = endTime.getHours();
        const endMin = endTime.getMinutes();
        const endInMinutes = endHour * 60 + endMin;

        if (endInMinutes > eventStartInMinutes) {
          console.log('Event status ON - Existing room crossed event start:', record.start_time, '->', record.end_time);
          return true;
        }
      }
    }
    // 기존방 로직 없는 shop: 신규방 아니면 이벤트 상태 아님
  }

  return false;
}

async function calculateEventCount(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string | null,
  roomStartTime: string,
  girlStartTime: string,
  girlEndTime: string,
  usageDuration: number | null
): Promise<EventCalculation> {
  if (!shopName || usageDuration === null || usageDuration <= 0) {
    return { eventCount: 0, isNewRoom: false };
  }

  // 이벤트 시간 조회 (new_room_offset 포함)
  const { data: eventTime } = await supabase
    .from('event_times')
    .select('start_time, end_time, new_room_offset')
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
  const newRoomOffset = eventTime.new_room_offset || 0; // 도파민: -1, 나머지: 0

  // 방 시작 시간 파싱
  const roomStart = new Date(roomStartTime);
  const girlStart = new Date(girlStartTime);

  // 신규방 기준: 이벤트 시작 + offset (도파민: 15-1=14시, 나머지: 15+0=15시)
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const roomStartHour = roomStart.getHours();

  // 신규방 판별
  const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                    (roomStart.getDate() !== girlStart.getDate() && roomStartHour < newRoomThresholdHour);

  // 기존방 로직 적용 여부 (도파민만 기존방 로직 있음)
  const hasExistingRoomLogic = newRoomOffset !== 0;

  console.log('Event calculation:', {
    shopName,
    eventTime: `${eventTime.start_time}-${eventTime.end_time}`,
    roomStartTime,
    girlStartTime,
    girlEndTime,
    usageDuration,
    isNewRoom,
    roomStartHour,
    newRoomThresholdHour,
  });

  // 시간 계산을 위한 변수들
  const girlEnd = new Date(girlEndTime);
  const girlStartHour = girlStart.getHours();
  const girlStartMin = girlStart.getMinutes();
  const girlStartInMinutes = girlStartHour * 60 + girlStartMin;

  const girlEndHour = girlEnd.getHours();
  const girlEndMin = girlEnd.getMinutes();
  const girlEndInMinutes = girlEndHour * 60 + girlEndMin;

  const eventStartInMinutes = eventStartHour * 60;
  const eventEndInMinutes = eventEndHour * 60;
  const newRoomEventStart = newRoomThresholdHour * 60;

  let eventCount = 0;

  // 먼저 이전에 이벤트 상태가 됐는지 확인
  const hasEventStatus = await checkGirlEventStatus(
    supabase,
    slotId,
    shopName,
    girlEndTime,
    eventStartHour,
    eventEndHour,
    newRoomOffset
  );

  if (hasEventStatus) {
    // 이미 이벤트 상태 → 이번 세션 전체 이벤트!
    eventCount = usageDuration;
    console.log('Girl already has event status - eventCount:', eventCount);
  } else if (isNewRoom) {
    // 신규방: threshold~이벤트종료 사이 시작하면 전체 이벤트
    if (girlStartInMinutes >= newRoomEventStart && girlStartInMinutes < eventEndInMinutes) {
      eventCount = usageDuration;
      console.log('New room - start within event window - eventCount:', eventCount);
    }
  } else if (hasExistingRoomLogic) {
    // 기존방 로직 (도파민만): 이벤트시작시간을 넘기는 시간만 이벤트
    if (girlEndInMinutes > eventStartInMinutes) {
      // 이벤트시작 넘김
      if (girlStartInMinutes >= eventStartInMinutes) {
        // 시작도 이벤트시작 이후 → 전체 이벤트
        eventCount = usageDuration;
        console.log('Existing room (dopamine) - start after event start - eventCount:', eventCount);
      } else {
        // 시작은 이벤트시작 이전, 끝은 이벤트시작 이후 → 이벤트시작~끝 시간만 이벤트
        const eventMinutes = girlEndInMinutes - eventStartInMinutes;
        eventCount = eventMinutes / 60; // 시간 단위로 변환
        console.log('Existing room (dopamine) - crossed event start - eventCount:', eventCount, 'minutes:', eventMinutes);
      }
    } else {
      // 이벤트시작 안 넘김 → 이벤트 0
      eventCount = 0;
      console.log('Existing room (dopamine) - did not cross event start - eventCount: 0');
    }
  } else {
    // 기존방 로직 없음 (다른 shop들): 신규방 아니면 이벤트 0
    eventCount = 0;
    console.log('Existing room (no logic) - eventCount: 0');
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

      // 1. message_logs에 원본 메시지 저장 (항상)
      const { data: log, error: logError } = await supabase
        .from('message_logs')
        .insert({
          slot_id: slot.id,
          user_id: slot.user_id,
          source_room: room,
          sender_name: sender,
          message: message,
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
      // 0. ㄱㅌ(취소) → trigger_type을 'canceled'로 변경
      // 1. ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 INSERT
      // 2. ㅈㅈㅎ/재진행 → 가장 최근 종료 레코드를 시작으로 UPDATE
      // 3. ㄲ(종료) → 세션 종료 처리
      // 4. 방번호만 → 세션 시작 처리
      // ====================================================

      if (girlSignals.isCancel) {
        // ㄱㅌ(취소) → trigger_type을 'canceled'로 변경 (방번호 일치해야 함)
        const result = await handleCancel(supabase, slot, parsed.roomNumber, log?.id);
        results.push({ ...result, logId: log?.id });

      } else if (girlSignals.isNewSession && parsed.roomNumber) {
        // ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 시작 (INSERT)
        const result = await handleNewSession(
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id
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
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id
        );
        results.push({ ...result, logId: log?.id });

      } else if (parsed.roomNumber && !girlSignals.isExtension) {
        // ㄲ 없음 + 방번호 있음 + ㅇㅈ(연장) 아님 → 세션 시작 처리
        const result = await handleSessionStart(
          supabase, slot, parsed, girlSignals, messageReceivedAt, log?.id
        );
        results.push({ ...result, logId: log?.id });

      } else {
        // 방번호 없음 또는 ㅇㅈ(연장) → 일반 메시지
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
  logId: string | undefined
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
// 취소 처리 (ㄱㅌ) - trigger_type을 'canceled'로 변경
// ============================================================

async function handleCancel(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string },
  roomNumber: string | null,
  logId: string | undefined
) {
  console.log('handleCancel called for:', slot.girl_name, 'roomNumber:', roomNumber);

  // 진행 중인 레코드 찾기 (is_in_progress = true)
  const { data: recentRecord, error: findError } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .order('updated_at', { ascending: false })
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

// ============================================================
// 세션 시작 처리 (sessions 테이블에 저장)
// ============================================================

async function handleSessionStart(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isEnd: boolean; isCorrection: boolean; isDesignated: boolean; usageDuration: number | null },
  receivedAt: string,
  logId: string | undefined
) {
  // 이미 진행 중인 세션이 있는지 확인 (다른 방에서 진행 중이면 무시)
  const { data: existingSession } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .single();

  if (existingSession) {
    console.log('handleSessionStart - 이미 진행 중인 세션 있음:', slot.girl_name, '현재 방:', existingSession.room_number, '→ 무시');
    return {
      type: 'ignored',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: `이미 ${existingSession.room_number}번 방에서 진행 중`,
    };
  }

  // 메시지에 수동 지정 시간이 있으면 사용, 없으면 receivedAt 사용
  const manualTime = extractManualTime(parsed.rawMessage, receivedAt);
  const startTime = manualTime || receivedAt;

  console.log('handleSessionStart called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber, 'isDesignated:', girlSignals.isDesignated, 'manualTime:', manualTime);

  // 방 조회 또는 생성
  const roomInfo = await getOrCreateRoom(supabase, parsed.roomNumber!, slot.shop_name, startTime);

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
    startTime: startTime,
    endTime: null,
    usageDuration: null,
    eventCount: null,
    isCorrection: girlSignals.isCorrection,
    isDesignated: girlSignals.isDesignated,
    sourceLogId: logId,
  });

  return {
    type: 'start',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: startTime,
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
  logId: string | undefined
) {
  // ㅈㅈ(수정) 시 메시지에 수동 지정 시간이 있으면 추출
  const manualStartTime = girlSignals.isCorrection ? extractManualTime(parsed.rawMessage, receivedAt) : null;

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
    slot.id,
    slot.shop_name,
    roomStartTime,
    girlStartTime,
    receivedAt,
    girlSignals.usageDuration
  );

  console.log('handleSessionEnd - eventCount:', eventCount, 'isNewRoom:', isNewRoom, 'manualStartTime:', manualStartTime);

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
    manualStartTime?: string | null;  // ㅈㅈ 시 수동 지정 시간
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
        .select('id, start_time, trigger_type')
        .eq('slot_id', data.slotId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Correction mode - existingBySlot:', existingBySlot, 'error:', findError);

      if (existingBySlot) {
        // 수동 지정 시간이 있으면 사용, 없으면 기존 start_time 유지
        const newStartTime = data.manualStartTime || existingBySlot.start_time || data.startTime;

        // 새 방번호에 대한 rooms 테이블 등록
        await getOrCreateRoom(supabase, data.roomNumber, data.shopName, newStartTime);

        // trigger_type 결정: 'canceled'면 유지, 아니면 is_in_progress 기반
        const newTriggerType = existingBySlot.trigger_type === 'canceled'
          ? 'canceled'
          : (data.isInProgress ? 'start' : 'end');

        // 기존 레코드 수정 (방번호 등 업데이트)
        const updateData: Record<string, unknown> = {
          room_number: data.roomNumber,
          is_in_progress: data.isInProgress,
          end_time: data.endTime,
          usage_duration: data.usageDuration,
          event_count: data.eventCount,
          trigger_type: newTriggerType,
          source_log_id: data.sourceLogId || null,
          is_designated: data.isDesignated,
          updated_at: getKoreanTime(),
          data_changed: true,  // ㅈㅈ(수정) 시 재발송 트리거
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
      // 진행 중인 레코드가 있음 → 종료 시에만 업데이트
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
            is_designated: data.isDesignated,
            updated_at: getKoreanTime(),
          })
          .eq('id', inProgressRecord.id);

        if (updateError) {
          console.error('Status board update error:', updateError);
        }
      }
      // usageDuration이 없으면 (시작인데 이미 진행 중) → 무시
    } else {
      // 진행 중인 레코드가 없음 → 시작 시에만 새 레코드 생성
      if (data.usageDuration !== null) {
        console.log('Warning: 종료 요청인데 진행 중인 세션 없음');
        return; // 종료할 세션이 없으면 무시
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
