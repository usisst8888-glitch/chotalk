import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// 메신저봇R에서 메시지 수신 (감지용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message } = body;

    // 필수 필드 검증
    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message']
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // 활성화된 모든 슬롯 가져오기
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, user_id, girl_name, chat_room_name, is_active, expires_at')
      .eq('is_active', true);

    if (slotsError || !slots || slots.length === 0) {
      return NextResponse.json({
        success: false,
        message: '활성화된 슬롯 없음'
      });
    }

    // 메시지 본문에 아가씨 닉네임이 포함된 슬롯 찾기
    const matchedSlots = slots.filter(slot => {
      // 만료 확인
      if (new Date(slot.expires_at) < new Date()) {
        return false;
      }
      // 메시지에 아가씨 이름이 포함되어 있는지 확인
      return message.includes(slot.girl_name);
    });

    if (matchedSlots.length === 0) {
      return NextResponse.json({
        success: false,
        message: '매칭된 아가씨 없음'
      });
    }

    // 매칭된 슬롯들에 대해 메시지 로그 저장
    const savedLogs = [];
    for (const slot of matchedSlots) {
      // 해당 user_id의 템플릿 찾기
      const { data: template } = await supabase
        .from('user_templates')
        .select('id')
        .eq('user_id', slot.user_id)
        .single();

      const { data: log, error: logError } = await supabase
        .from('message_logs')
        .insert({
          slot_id: slot.id,
          user_id: slot.user_id,
          room_name: slot.chat_room_name,  // 슬롯의 채팅방 이름 사용
          sender_name: sender,
          message: message,
          user_template_id: template?.id || null,  // 템플릿 ID 저장
          is_processed: false,
        })
        .select()
        .single();

      if (!logError && log) {
        savedLogs.push({
          logId: log.id,
          slotId: slot.id,
          girlName: slot.girl_name,
          chatRoomName: slot.chat_room_name,
          templateId: template?.id || null
        });
      }
    }

    return NextResponse.json({
      success: true,
      matched: savedLogs.length,
      logs: savedLogs
    });

  } catch (error) {
    console.error('Bot message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
