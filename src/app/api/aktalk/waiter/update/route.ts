import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const kstNow = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '');

/**
 * 아톡 채팅방에서 웨이터 수정 요청 처리
 * 메시지 형식: "103 도균 수정"
 * → waiter_assignments 테이블의 해당 shop_name + room_number의 waiter_name 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_name, room_number, waiter_name } = body;

    if (!shop_name || !room_number || !waiter_name) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['shop_name', 'room_number', 'waiter_name'],
      }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('waiter_assignments')
      .upsert(
        {
          shop_name,
          room_number,
          waiter_name,
          updated_at: kstNow(),
        },
        { onConflict: 'shop_name,room_number' }
      );

    if (error) {
      console.error('waiter update error:', error);
      return NextResponse.json({ error: 'DB 업데이트 실패', detail: error.message }, { status: 500 });
    }

    console.log(`[웨이터 수정] ${shop_name} / ${room_number} → ${waiter_name}`);

    return NextResponse.json({
      success: true,
      shop_name,
      room_number,
      waiter_name,
    });

  } catch (error) {
    console.error('waiter update error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
