import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * 주문 메시지 저장 API (orderreader 전용)
 * - // 트리거로 시작하는 카톡 메시지를 받음
 * - status_board에서 진행중인 girl(trigger_type=hourly, is_in_progress=true) 조회
 * - 방 이름에 girl_name이 포함된 row 매칭 → shop_name, room_number 가져옴
 * - 메시지에 방번호가 없으면 room_number를 앞에 붙임
 * - starttalk_order 테이블에 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, hasPhoto, receivedAt } = body;

    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message'],
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. status_board에서 진행중인 girl 조회
    const { data: boards, error: boardsError } = await supabase
      .from('status_board')
      .select('girl_name, room_number, shop_name')
      .eq('trigger_type', 'hourly')
      .eq('is_in_progress', true);

    if (boardsError) {
      console.error('status_board 조회 실패:', boardsError);
      return NextResponse.json({
        error: 'status_board 조회 실패',
        detail: boardsError.message,
      }, { status: 500 });
    }

    if (!boards || boards.length === 0) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '진행중인 아가씨 없음',
      });
    }

    // 2. 방 이름에 girl_name이 포함된 row 찾기 (긴 이름 우선)
    const sortedBoards = [...boards].sort(
      (a, b) => (b.girl_name?.length ?? 0) - (a.girl_name?.length ?? 0)
    );
    const matched = sortedBoards.find(
      (b) => b.girl_name && room.includes(b.girl_name)
    );

    if (!matched) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '방 이름에서 girl_name 매칭 실패',
        room,
      });
    }

    // 3. 메시지에 방번호가 없으면 status_board의 room_number를 앞에 붙임
    const trimmed = String(message).trim();
    const hasRoomNumber = /^\d{3}/.test(trimmed);
    const finalMessage = hasRoomNumber
      ? trimmed
      : `${matched.room_number} ${trimmed}`;

    // 4. starttalk_order에 저장
    const insertData: Record<string, unknown> = {
      shop_name: matched.shop_name,
      room_name: room,
      sender,
      message: finalMessage,
      received_at: receivedAt || new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
      is_sent: false,
      has_photo: hasPhoto === true,
    };

    const { data, error } = await supabase
      .from('starttalk_order')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      console.error('starttalk_order insert error:', error);
      return NextResponse.json({
        error: 'DB 저장 실패',
        detail: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stored: true,
      id: data.id,
      shop_name: matched.shop_name,
      girl_name: matched.girl_name,
      room_number: matched.room_number,
      message: finalMessage,
    });

  } catch (error) {
    console.error('order message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
