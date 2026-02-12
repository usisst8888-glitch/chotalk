import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage, parseGirlSignals, extractManualTime } from '@/lib/message-parser';
import { processDesignatedSection } from '@/app/api/bot/designated/route';

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
// 이벤트 계산 함수 (주석 처리 - 새로 구현 예정)
// ============================================================

/*
interface EventCalculation {
  eventCount: number;
  isNewRoom: boolean;
}

function getEventDate(time: Date, thresholdHour: number): Date {
  const eventDate = new Date(time);
  if (eventDate.getHours() < thresholdHour) {
    eventDate.setDate(eventDate.getDate() - 1);
  }
  eventDate.setHours(thresholdHour, 0, 0, 0);
  return eventDate;
}

async function checkGirlEventStatus(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string,
  currentTime: string,
  eventStartHour: number,
  eventEndHour: number,
  newRoomOffset: number
): Promise<boolean> {
  const currentDate = new Date(currentTime);
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const hasExistingRoomLogic = newRoomOffset !== 0;
  const eventDate = getEventDate(currentDate, newRoomThresholdHour);

  const eventDateStart = new Date(eventDate);
  const eventDateEnd = new Date(eventDate);
  eventDateEnd.setDate(eventDateEnd.getDate() + 1);

  const { data: records, error } = await supabase
    .from('status_board')
    .select('start_time, end_time, room_number, shop_name')
    .eq('slot_id', slotId)
    .eq('shop_name', shopName)
    .gte('start_time', eventDateStart.toISOString().slice(0, -1))
    .lt('start_time', eventDateEnd.toISOString().slice(0, -1));

  if (error || !records || records.length === 0) return false;

  for (const record of records) {
    const startTime = new Date(record.start_time);
    const startInMinutes = startTime.getHours() * 60 + startTime.getMinutes();

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
    const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                      (roomStartTime.getDate() !== startTime.getDate() && roomStartHour < newRoomThresholdHour);

    const eventStartInMinutes = eventStartHour * 60;
    const eventEndInMinutes = eventEndHour * 60;

    if (isNewRoom) {
      const newRoomEventStart = newRoomThresholdHour * 60;
      if (startInMinutes >= newRoomEventStart && startInMinutes < eventEndInMinutes) return true;
    } else if (hasExistingRoomLogic) {
      if (record.end_time) {
        const endTime = new Date(record.end_time);
        const endInMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        if (endInMinutes > eventStartInMinutes) return true;
      }
    }
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

  const { data: eventTime } = await supabase
    .from('event_times')
    .select('start_time, end_time, new_room_offset')
    .eq('shop_name', shopName)
    .eq('is_active', true)
    .single();

  if (!eventTime) return { eventCount: 0, isNewRoom: false };

  const [eventStartHour] = eventTime.start_time.split(':').map(Number);
  const [eventEndHour] = eventTime.end_time.split(':').map(Number);
  const newRoomOffset = eventTime.new_room_offset || 0;

  const roomStart = new Date(roomStartTime);
  const girlStart = new Date(girlStartTime);
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const roomStartHour = roomStart.getHours();

  const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                    (roomStart.getDate() !== girlStart.getDate() && roomStartHour < newRoomThresholdHour);

  const hasExistingRoomLogic = newRoomOffset !== 0;
  const girlEnd = new Date(girlEndTime);
  const girlStartInMinutes = girlStart.getHours() * 60 + girlStart.getMinutes();
  const girlEndInMinutes = girlEnd.getHours() * 60 + girlEnd.getMinutes();
  const eventStartInMinutes = eventStartHour * 60;
  const eventEndInMinutes = eventEndHour * 60;
  const newRoomEventStart = newRoomThresholdHour * 60;

  let eventCount = 0;

  const hasEventStatus = await checkGirlEventStatus(
    supabase, slotId, shopName, girlEndTime, eventStartHour, eventEndHour, newRoomOffset
  );

  if (hasEventStatus) {
    eventCount = usageDuration;
  } else if (isNewRoom) {
    if (girlStartInMinutes >= newRoomEventStart && girlStartInMinutes < eventEndInMinutes) {
      eventCount = usageDuration;
    }
  } else if (hasExistingRoomLogic) {
    if (girlEndInMinutes > eventStartInMinutes) {
      if (girlStartInMinutes >= eventStartInMinutes) {
        eventCount = usageDuration;
      } else {
        eventCount = (girlEndInMinutes - eventStartInMinutes) / 60;
      }
    }
  }

  return { eventCount, isNewRoom };
}
*/

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

    // ㅈ.ㅁ(지명) 섹션 감지 → message_logs 무조건 저장 + designated_notices 업데이트
    if (message.includes('ㅈ.ㅁ')) {
      await processDesignatedSection(room, sender, message, messageReceivedAt);
    }

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
      // 1. message_logs에 원본 메시지 저장 (항상 - 한번만)
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
      // 같은 아가씨가 여러 줄에 나올 수 있음 (예: 종료 + 새 시작)
      // 각 줄을 별도로 파싱하여 순차 처리
      // ====================================================

      // 같은 아가씨가 여러 줄에 나오는지 확인
      const lines = message.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const girlLines = lines.filter((line: string) => line.includes(slot.girl_name));

      // 원본 메시지 첫 줄이 ㅈㅈ로 시작하면, 전체 메시지가 정정
      const messageStartsWithCorrection = lines.length > 0 && lines[0].startsWith('ㅈㅈ');

      // 아가씨가 포함된 줄만 개별 처리 (줄바꿈 시 방번호가 다를 수 있으므로)
      const messagesToProcess = girlLines.length > 0 ? girlLines : [message];

      console.log('Processing', messagesToProcess.length, 'line(s) for', slot.girl_name);

      for (const lineMsg of messagesToProcess) {
        const lineParsed = parseMessage(lineMsg, girlNames);
        const lineSignals = parseGirlSignals(lineMsg, slot.girl_name, girlNames);

        // 원본 메시지 첫 줄이 ㅈㅈ로 시작했으면, ㄲ이 있는 아가씨에게만 정정 적용
        // ㄲ이 없는 아가씨는 새 시작일 수 있으므로 정정을 적용하지 않음
        if (messageStartsWithCorrection && lineSignals.isEnd) {
          lineSignals.isCorrection = true;
        }

        // 우선순위:
        // 0. ㄱㅌ(취소) → trigger_type을 'canceled'로 변경
        // 1. ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 INSERT
        // 2. ㅈㅈㅎ/재진행 → 가장 최근 종료 레코드를 시작으로 UPDATE
        // 3. ㄲ(종료) → 세션 종료 처리
        // 4. 방번호만 → 세션 시작 처리

        if (lineSignals.isCancel) {
          const result = await handleCancel(supabase, slot, lineParsed.roomNumber, log?.id);
          results.push({ ...result, logId: log?.id });

        } else if (lineSignals.isNewSession && lineParsed.roomNumber) {
          const result = await handleNewSession(
            supabase, slot, lineParsed, lineSignals, messageReceivedAt, log?.id
          );
          results.push({ ...result, logId: log?.id });

        } else if (lineSignals.isResume) {
          const result = await handleResume(
            supabase, slot, messageReceivedAt, log?.id
          );
          results.push({ ...result, logId: log?.id });

        } else if (lineSignals.isEnd && lineParsed.roomNumber) {
          const result = await handleSessionEnd(
            supabase, slot, lineParsed, lineSignals, messageReceivedAt, log?.id
          );
          results.push({ ...result, logId: log?.id });

        } else if (lineSignals.isCorrection && lineParsed.roomNumber) {
          // ㅈㅈ + 방번호 (ㄲ 없음): 시간패턴이 있으면 시작시간만 수정
          // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
          // allowTwoDigit: ㄲ이 없어서 usageDuration 혼동 없으므로 2자리(03→03:00)도 허용
          const corrGirlIdx = lineMsg.lastIndexOf(slot.girl_name);
          const corrAfterGirl = corrGirlIdx >= 0 ? lineMsg.substring(corrGirlIdx + slot.girl_name.length) : lineMsg;
          const manualTime = extractManualTime(corrAfterGirl, messageReceivedAt, { allowTwoDigit: true });
          if (manualTime) {
            const { data: record } = await supabase
              .from('status_board')
              .select('id')
              .eq('slot_id', slot.id)
              .eq('room_number', lineParsed.roomNumber)
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

              console.log('ㅈㅈ 시작시간 수정:', slot.girl_name, '방:', lineParsed.roomNumber, '→', manualTime);
              results.push({ type: 'correction_time', slotId: slot.id, girlName: slot.girl_name, roomNumber: lineParsed.roomNumber, newStartTime: manualTime, logId: log?.id });
            } else {
              console.log('ㅈㅈ 시작시간 수정 - 레코드 없음:', lineParsed.roomNumber);
              results.push({ type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: '수정할 레코드 없음', logId: log?.id });
            }
          } else {
            console.log('ㅈㅈ 시간패턴 없음 - 무시:', lineMsg);
            results.push({ type: 'ignored', slotId: slot.id, girlName: slot.girl_name, reason: 'ㅈㅈ 시간패턴 없음', logId: log?.id });
          }

        } else if (lineParsed.roomNumber && !lineSignals.isEnd && !lineSignals.isExtension && !lineSignals.isDesignatedFee && !lineSignals.isDesignatedHalfFee && !lineSignals.isCorrection) {
          const result = await handleSessionStart(
            supabase, slot, lineParsed, lineSignals, messageReceivedAt, log?.id
          );
          results.push({ ...result, logId: log?.id });

        } else {
          results.push({
            type: 'message',
            logId: log?.id,
            slotId: slot.id,
            girlName: slot.girl_name,
          });
        }
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

  // 가장 최근 레코드가 'end'가 아니면 재진행 불가
  if (recentRecord.trigger_type !== 'end' || recentRecord.is_in_progress) {
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
      trigger_type: 'start',
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
  // 단, ㅈㅈ(수정) 신호일 때는 무시하지 않고 수정 처리
  const { data: existingSession } = await supabase
    .from('status_board')
    .select('id, room_number')
    .eq('slot_id', slot.id)
    .eq('is_in_progress', true)
    .single();

  if (existingSession && !girlSignals.isCorrection) {
    console.log('handleSessionStart - 이미 진행 중인 세션 있음:', slot.girl_name, '현재 방:', existingSession.room_number, '→ 무시');
    return {
      type: 'ignored',
      slotId: slot.id,
      girlName: slot.girl_name,
      reason: `이미 ${existingSession.room_number}번 방에서 진행 중`,
    };
  }

  // 메시지에 수동 지정 시간이 있으면 사용, 없으면 receivedAt 사용
  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  const girlIdx = parsed.rawMessage.lastIndexOf(slot.girl_name);
  const afterGirlSection = girlIdx >= 0 ? parsed.rawMessage.substring(girlIdx + slot.girl_name.length) : parsed.rawMessage;
  const manualTime = extractManualTime(afterGirlSection, receivedAt);
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
    manualStartTime: girlSignals.isCorrection ? manualTime : null,
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
  // 아가씨 이름 뒤 부분만 전달 (방번호 3자리와 시간패턴 혼동 방지)
  let manualStartTime: string | null = null;
  if (girlSignals.isCorrection) {
    const girlIdx = parsed.rawMessage.lastIndexOf(slot.girl_name);
    const afterGirlSection = girlIdx >= 0 ? parsed.rawMessage.substring(girlIdx + slot.girl_name.length) : parsed.rawMessage;
    manualStartTime = extractManualTime(afterGirlSection, receivedAt);
  }

  // 기존 레코드에서 start_time 조회
  const { data: existingRecord } = await supabase
    .from('status_board')
    .select('start_time')
    .eq('slot_id', slot.id)
    .eq('room_number', parsed.roomNumber)
    .single();

  const girlStartTime = existingRecord?.start_time || receivedAt;

  // 이벤트 계산 (주석 처리 - 새로 구현 예정)
  const eventCount = 0;
  const isNewRoom = false;
  /*
  const { eventCount, isNewRoom } = await calculateEventCount(
    supabase,
    slot.id,
    slot.shop_name,
    roomStartTime,
    girlStartTime,
    receivedAt,
    girlSignals.usageDuration
  );
  */

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
        // 수동 지정 시간이 있으면 사용, 없으면 기존 start_time 유지
        const newStartTime = data.manualStartTime || existingBySlot.start_time || data.startTime;

        // rooms 테이블 등록 (기존 방번호 사용)
        await getOrCreateRoom(supabase, existingBySlot.room_number, data.shopName, newStartTime);

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
          updated_at: getKoreanTime(),
          // trigger_type이 변경되면 data_changed는 false, 아니면 true
          data_changed: !triggerTypeChanging,
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
            updated_at: getKoreanTime(),
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

