import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseWaiterMessage } from '../../waiter-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message } = body;

    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message'],
      }, { status: 400 });
    }

    // 방이름에서 가게명 추출: {가게명}-공지방
    if (!room.endsWith('-공지방')) {
      return NextResponse.json({ success: false, reason: '공지방이 아닙니다.' });
    }

    const shopName = room.slice(0, room.lastIndexOf('-공지방'));
    if (!shopName) {
      return NextResponse.json({ error: '가게명을 파싱할 수 없습니다.' }, { status: 400 });
    }

    // 웨이터 파싱
    const assignments = parseWaiterMessage(message);

    if (assignments.length === 0) {
      return NextResponse.json({ success: true, stored: false, reason: '웨이터 파싱 결과 없음' });
    }

    const supabase = getSupabase();

    // upsert: 같은 shop_name + room_number면 waiter_name 업데이트
    for (const a of assignments) {
      const { error } = await supabase
        .from('waiter_assignments')
        .upsert(
          {
            shop_name: shopName,
            room_number: a.roomNumber,
            waiter_name: a.waiterName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'shop_name,room_number' }
        );

      if (error) {
        console.error('waiter_assignments upsert error:', error);
        return NextResponse.json({ error: 'DB 저장 실패', detail: error.message }, { status: 500 });
      }
    }

    console.log(`웨이터 ${assignments.length}건 저장:`, shopName, assignments);

    return NextResponse.json({
      success: true,
      stored: true,
      count: assignments.length,
      assignments,
    });

  } catch (error) {
    console.error('waiter message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
