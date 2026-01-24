import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// 슬롯 목록 조회
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const supabase = getSupabase();

    // 사용자 정보와 슬롯 개수 조회
    const { data: user } = await supabase
      .from('users')
      .select('slot_count')
      .eq('id', payload.userId)
      .single();

    // 슬롯 목록 조회
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '슬롯 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({
      slots: slots || [],
      slotCount: user?.slot_count || 0,
      usedSlots: slots?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 슬롯 추가
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { girlName, shopName, targetRoom, chatRoomType, closingTime } = await request.json();

    if (!girlName || !targetRoom) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
    }

    // 채팅방 타입 유효성 검사
    const validChatRoomType = chatRoomType === 'open' ? 'open' : 'group';

    const supabase = getSupabase();

    // 사용자의 슬롯 개수 확인
    const { data: user } = await supabase
      .from('users')
      .select('slot_count')
      .eq('id', payload.userId)
      .single();

    // 현재 사용 중인 슬롯 개수 확인
    const { count } = await supabase
      .from('slots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', payload.userId);

    if ((count || 0) >= (user?.slot_count || 0)) {
      return NextResponse.json({ error: '슬롯이 부족합니다. 슬롯을 추가로 구매해주세요.' }, { status: 400 });
    }

    // 새 가게인 경우 마감시간 테이블에 추가
    if (shopName && closingTime) {
      const { data: existingShop } = await supabase
        .from('shop_closing_times')
        .select('id')
        .eq('shop_name', shopName)
        .single();

      if (!existingShop) {
        await supabase
          .from('shop_closing_times')
          .insert({
            shop_name: shopName,
            closing_time: closingTime,
          });
      }
    }

    // 30일 후 만료
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 슬롯 생성
    const { data: newSlot, error } = await supabase
      .from('slots')
      .insert({
        user_id: payload.userId,
        girl_name: girlName,
        shop_name: shopName || null,
        target_room: targetRoom,
        chat_room_type: validChatRoomType,
        kakao_id: 'test_kakao_id_123', // 하드코딩된 테스트 값
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Slot creation error:', error);
      return NextResponse.json({ error: '슬롯 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 생성되었습니다.', slot: newSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
