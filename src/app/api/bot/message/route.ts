import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage, parseGirlSignals } from '@/lib/message-parser';

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
      // 2. sessions 테이블 처리
      // 핵심 조건: 방번호 + 아가씨이름 뒤에 ㄲ(종료) 있을 때만 종료
      // ====================================================

      if (girlSignals.isEnd && parsed.roomNumber) {
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
// 세션 시작 처리 (sessions 테이블에 저장)
// ============================================================

async function handleSessionStart(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isEnd: boolean; isCorrection: boolean; usageDuration: number | null },
  receivedAt: string,
  logId: string | undefined,
  userTemplateId: string | null
) {
  console.log('handleSessionStart called for:', slot.girl_name, 'roomNumber:', parsed.roomNumber);
  // 상황판에만 저장 (sender_logs 필요없음)
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
    isCorrection: girlSignals.isCorrection,
    sourceLogId: logId,
    userTemplateId: userTemplateId,
  });

  // 발송 큐에 추가 (세션 시작)
  if (userTemplateId && slot.target_room && slot.kakao_id) {
    await upsertSendQueue(supabase, {
      slotId: slot.id,
      userTemplateId,
      targetRoom: slot.target_room,
      kakaoId: slot.kakao_id,
      triggerType: 'start',
      roomNumber: parsed.roomNumber!,
      startTime: receivedAt,
      endTime: null,
    });
  }

  return {
    type: 'start',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    startTime: receivedAt,
  };
}

// ============================================================
// 세션 종료 처리 (상황판만 업데이트)
// ============================================================

async function handleSessionEnd(
  supabase: ReturnType<typeof getSupabase>,
  slot: { id: string; user_id: string; girl_name: string; shop_name: string | null; kakao_id: string | null; target_room: string | null },
  parsed: ReturnType<typeof parseMessage>,
  girlSignals: { isEnd: boolean; isCorrection: boolean; usageDuration: number | null },
  receivedAt: string,
  logId: string | undefined,
  userTemplateId: string | null
) {
  // 상황판에만 저장 (sender_logs 필요없음)
  await updateStatusBoard(supabase, {
    slotId: slot.id,
    userId: slot.user_id,
    shopName: slot.shop_name,
    roomNumber: parsed.roomNumber!,
    girlName: slot.girl_name,
    kakaoId: slot.kakao_id,
    targetRoom: slot.target_room,
    isInProgress: false,
    startTime: receivedAt,
    endTime: receivedAt,
    usageDuration: girlSignals.usageDuration,
    isCorrection: girlSignals.isCorrection,
    sourceLogId: logId,
    userTemplateId: userTemplateId,
  });

  // 발송 큐 업데이트 (세션 종료)
  if (userTemplateId && slot.target_room && slot.kakao_id) {
    await upsertSendQueue(supabase, {
      slotId: slot.id,
      userTemplateId,
      targetRoom: slot.target_room,
      kakaoId: slot.kakao_id,
      triggerType: 'end',
      roomNumber: parsed.roomNumber!,
      startTime: receivedAt,
      endTime: receivedAt,
    });
  }

  return {
    type: 'end',
    slotId: slot.id,
    girlName: slot.girl_name,
    roomNumber: parsed.roomNumber,
    endTime: receivedAt,
    usageDuration: girlSignals.usageDuration,
  };
}

// ============================================================
// 발송 큐에 추가/업데이트 (세션당 한 줄)
// ============================================================

async function upsertSendQueue(
  supabase: ReturnType<typeof getSupabase>,
  data: {
    slotId: string;
    userTemplateId: string;
    targetRoom: string;
    kakaoId: string;
    triggerType: 'start' | 'end' | 'hourly';
    roomNumber: string;
    startTime: string;
    endTime: string | null;
  }
) {
  // 기존 레코드 찾기 (slot_id + room_number로 세션 식별)
  const { data: existing } = await supabase
    .from('send_queue')
    .select('id')
    .eq('slot_id', data.slotId)
    .eq('room_number', data.roomNumber)
    .single();

  if (existing) {
    // 기존 레코드 업데이트 (종료 시)
    const { error } = await supabase
      .from('send_queue')
      .update({
        trigger_type: data.triggerType,
        end_time: data.endTime,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('send_queue update error:', error);
    } else {
      console.log('send_queue updated to:', data.triggerType);
    }
  } else {
    // 새 레코드 생성 (시작 시)
    const { error } = await supabase
      .from('send_queue')
      .insert({
        slot_id: data.slotId,
        user_template_id: data.userTemplateId,
        target_room: data.targetRoom,
        kakao_id: data.kakaoId,
        trigger_type: data.triggerType,
        room_number: data.roomNumber,
        start_time: data.startTime,
        end_time: data.endTime,
      });

    if (error) {
      console.error('send_queue insert error:', error);
    } else {
      console.log('send_queue created with:', data.triggerType);
    }
  }
}

// ============================================================
// 상황판 업데이트 (정제된 현재 상황)
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
    isCorrection: boolean;
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
        // 기존 레코드 수정 (방번호도 업데이트)
        const { error: updateError } = await supabase
          .from('status_board')
          .update({
            room_number: data.roomNumber,
            is_in_progress: data.isInProgress,
            start_time: data.startTime,
            end_time: data.endTime,
            usage_duration: data.usageDuration,
            source_log_id: data.sourceLogId || null,
            user_template_id: data.userTemplateId,
            updated_at: new Date().toISOString(),
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
            source_log_id: data.sourceLogId || null,
            user_template_id: data.userTemplateId,
            updated_at: new Date().toISOString(),
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
          source_log_id: data.sourceLogId || null,
          user_template_id: data.userTemplateId,
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
