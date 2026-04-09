import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * 주문 메시지 저장 API (orderreader 전용)
 *
 * 흐름:
 * 1. // 트리거로 시작하는 카톡 메시지 받음
 * 2. slots에서 활성 girl_name 목록 조회
 * 3. 카톡방 이름에 포함된 girl_name 찾기 (긴 이름 우선)
 * 4. 메시지에 방번호 있으면 → 그대로 사용
 *    없으면 → status_board에서 girl_name으로 진행중 row 조회 → room_number 자동 추가
 * 5. starttalk_order에 저장
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

    // 1. slots에서 활성 girl 목록 조회
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('girl_name, shop_name')
      .eq('is_active', true);

    if (slotsError) {
      console.error('slots 조회 실패:', slotsError);
      return NextResponse.json({
        error: 'slots 조회 실패',
        detail: slotsError.message,
      }, { status: 500 });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '활성 slots 없음',
      });
    }

    // 2. 카톡방 이름에 girl_name이 포함된 slot 찾기 (긴 이름 우선)
    const sortedSlots = [...slots].sort(
      (a, b) => (b.girl_name?.length ?? 0) - (a.girl_name?.length ?? 0)
    );
    const matchedSlot = sortedSlots.find(
      (s) => s.girl_name && room.includes(s.girl_name)
    );

    if (!matchedSlot) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '방 이름에서 girl_name 매칭 실패',
        room,
      });
    }

    const girlName = matchedSlot.girl_name;
    let shopName = matchedSlot.shop_name;

    // 3. 메시지 방번호 확인
    const trimmed = String(message).trim();
    const hasRoomNumber = /^\d{3}/.test(trimmed);
    let finalMessage = trimmed;

    if (!hasRoomNumber) {
      // 방번호 없으면 status_board에서 진행중 row 조회
      const { data: boards, error: boardsError } = await supabase
        .from('status_board')
        .select('room_number, shop_name')
        .eq('girl_name', girlName)
        .eq('trigger_type', 'hourly')
        .eq('is_in_progress', true)
        .limit(1);

      if (boardsError) {
        console.error('status_board 조회 실패:', boardsError);
        return NextResponse.json({
          error: 'status_board 조회 실패',
          detail: boardsError.message,
        }, { status: 500 });
      }

      const board = boards?.[0];
      if (!board) {
        return NextResponse.json({
          success: true,
          stored: false,
          reason: `${girlName} 진행중 아님 (status_board)`,
        });
      }

      finalMessage = `${board.room_number} ${trimmed}`;
      shopName = board.shop_name;
    }

    // 4. starttalk_order에 저장
    const insertData: Record<string, unknown> = {
      shop_name: shopName,
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
      shop_name: shopName,
      girl_name: girlName,
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
