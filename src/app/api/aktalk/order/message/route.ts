import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * 주문 메시지 저장 API (orderreader 전용)
 * - 카톡 알림에서 모든 메시지를 받아서 처리
 * - 메시지가 "방번호+요구사항" 패턴(^\d{3}\s*.+)인지 확인
 * - 방 이름에 활성 girl_name이 포함되어 있는지 slots에서 조회
 * - 매칭되면 해당 shop_name으로 aktalk_atok에 저장
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

    const trimmed = String(message).trim();

    // 1. 방번호+텍스트 패턴 확인 (예: "108티 파티빅스랑 디제이좀여", "902 술추가요")
    if (!/^\d{3}\s*.+/.test(trimmed)) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '방번호+텍스트 패턴 불일치',
      });
    }

    const supabase = getSupabase();

    // 2. 활성 girl_name 목록 조회
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

    // 3. 방 이름에 girl_name이 포함되는 것 찾기 (가장 긴 이름 우선)
    const sortedSlots = [...slots].sort(
      (a, b) => (b.girl_name?.length ?? 0) - (a.girl_name?.length ?? 0)
    );
    const matched = sortedSlots.find(
      (s) => s.girl_name && room.includes(s.girl_name)
    );

    if (!matched) {
      return NextResponse.json({
        success: true,
        stored: false,
        reason: '방 이름에서 girl_name 매칭 실패',
        room,
      });
    }

    // 4. aktalk_atok에 저장
    const insertData: Record<string, unknown> = {
      shop_name: matched.shop_name,
      team_name: null,
      room_name: room,
      sender,
      message,
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
    });

  } catch (error) {
    console.error('order message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
