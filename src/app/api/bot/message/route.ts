import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage } from '@/lib/message-parser';
import { calculateTicketType } from '@/lib/ticket';

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
    const messageReceivedAt = receivedAt || new Date().toISOString();

    // 활성화된 슬롯 가져오기
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, user_id, girl_name, target_room, kakao_id, is_active, expires_at, shop_name')
      .eq('is_active', true);

    if (slotsError || !slots || slots.length === 0) {
      return NextResponse.json({ success: false, message: '활성화된 슬롯 없음' });
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
      return NextResponse.json({ success: false, message: '매칭된 아가씨 없음' });
    }

    // 결과 처리
    const results = [];

    for (const slot of matchedSlots) {
      // 템플릿 조회
      const { data: template } = await supabase
        .from('user_templates')
        .select('id')
        .eq('user_id', slot.user_id)
        .single();

      // 1. message_logs에 원본 메시지 저장 (항상)
      const { data: log } = await supabase
        .from('message_logs')
        .insert({
          slot_id: slot.id,
          user_id: slot.user_id,
          source_room: room,
          target_room: slot.target_room,
          kakao_id: slot.kakao_id,
          sender_name: sender,
          message: message,
          user_template_id: template?.id || null,
          received_at: messageReceivedAt,
        })
        .select()
        .single();

      // ====================================================
      // 2. sessions 테이블 처리
      // 핵심 조건: 방번호 + 아가씨이름 + 시간 + ㄲ(종료)
      // ====================================================

      if (parsed.isEnd && parsed.roomNumber) {
        // ㄲ 있음 → 세션 종료 처리
        const result = await handleSessionEnd(
          supabase, slot, parsed, messageReceivedAt, log?.id
        );
        results.push({ ...result, logId: log?.id });

      } else if (parsed.roomNumber) {
        // ㄲ 없음 + 방번호 있음 → 세션 시작 처리
        const result = await handleSessionStart(
          supabase, slot, parsed, messageReceivedAt, log?.id
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
        fareAmount: parsed.fareAmount,
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
// 세션 시작 처리 (sessions 테이블에 저장)
// ============================================================

async function handleSessionStart(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  receivedAt: string,
  logId: string | undefined
) {
  // sender_logs 테이블에 새 세션 생성
  const { data: session, error } = await supabase
    .from('sender_logs')
    .insert({
      slot_id: slot.id,
      user_id: slot.user_id,
      room_number: parsed.roomNumber,
      girl_name: slot.girl_name,
      shop_name: slot.shop_name,
      kakao_id: slot.kakao_id,
      target_room: slot.target_room,
      start_time: receivedAt,
      is_completed: false,
      has_fare: parsed.fareAmount > 0,
      fare_amount: parsed.fareAmount,
      start_log_id: logId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Session start error:', error);
    return { type: 'error', error: error.message };
  }

  return {
    type: 'start',
    sessionId: session.id,
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: receivedAt,
  };
}

// ============================================================
// 세션 종료 처리 (sessions 테이블 업데이트)
// ============================================================

async function handleSessionEnd(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  receivedAt: string,
  logId: string | undefined
) {
  // 해당 방의 진행 중인 세션 찾기 (가장 오래된 것 먼저 - FIFO)
  const { data: activeSession } = await supabase
    .from('sender_logs')
    .select('*')
    .eq('slot_id', slot.id)
    .eq('room_number', parsed.roomNumber)
    .eq('is_completed', false)
    .order('start_time', { ascending: true })
    .limit(1)
    .single();

  if (!activeSession) {
    // 활성 세션 없으면 새로 생성하고 바로 종료
    const { data: newSession, error } = await supabase
      .from('sender_logs')
      .insert({
        slot_id: slot.id,
        user_id: slot.user_id,
        room_number: parsed.roomNumber,
        girl_name: slot.girl_name,
        shop_name: slot.shop_name,
        kakao_id: slot.kakao_id,
        target_room: slot.target_room,
        start_time: receivedAt,
        end_time: receivedAt,
        duration_minutes: 0,
        half_tickets: 0,
        full_tickets: 0,
        is_completed: true,
        has_fare: parsed.fareAmount > 0,
        fare_amount: parsed.fareAmount,
        start_log_id: logId,
        end_log_id: logId,
      })
      .select()
      .single();

    if (error) {
      return { type: 'error', error: error.message };
    }

    return {
      type: 'end',
      sessionId: newSession.id,
      slotId: slot.id,
      girlName: slot.girl_name,
      roomNumber: parsed.roomNumber,
      note: '활성 세션 없음, 즉시 종료',
    };
  }

  // 시간 계산
  const startTime = new Date(activeSession.start_time);
  const endTime = new Date(receivedAt);
  const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  // 티켓 계산
  const ticketResult = calculateTicketType(durationMinutes);

  // 차비 합산
  const totalFare = (activeSession.fare_amount || 0) + parsed.fareAmount;

  // 세션 업데이트
  const { data: updatedSession, error } = await supabase
    .from('sender_logs')
    .update({
      end_time: receivedAt,
      duration_minutes: durationMinutes,
      half_tickets: ticketResult.halfTickets,
      full_tickets: ticketResult.fullTickets,
      is_completed: true,
      has_fare: totalFare > 0,
      fare_amount: totalFare,
      end_log_id: logId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activeSession.id)
    .select()
    .single();

  if (error) {
    console.error('Session end error:', error);
    return { type: 'error', error: error.message };
  }

  return {
    type: 'end',
    sessionId: updatedSession.id,
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: activeSession.start_time,
    endTime: receivedAt,
    durationMinutes,
    halfTickets: ticketResult.halfTickets,
    fullTickets: ticketResult.fullTickets,
    fareAmount: totalFare,
  };
}
