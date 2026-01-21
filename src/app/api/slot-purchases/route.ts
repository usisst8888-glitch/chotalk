import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const SLOT_PRICE = 100000; // 슬롯 1개당 가격

// 구매 요청 생성
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

    const body = await request.json();
    const { depositorName, slotCount } = body;

    if (!depositorName || !slotCount) {
      return NextResponse.json({ error: '입금자명과 슬롯 개수를 입력해주세요.' }, { status: 400 });
    }

    if (slotCount < 1 || slotCount > 10) {
      return NextResponse.json({ error: '슬롯 개수는 1~10개 사이로 선택해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const totalAmount = slotCount * SLOT_PRICE;

    const { data: purchase, error } = await supabase
      .from('slot_purchases')
      .insert({
        user_id: payload.userId,
        depositor_name: depositorName,
        slot_count: slotCount,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Slot purchase error:', error);
      return NextResponse.json({ error: '구매 요청 실패' }, { status: 500 });
    }

    return NextResponse.json({
      message: '구매 요청이 접수되었습니다. 입금 확인 후 슬롯이 추가됩니다.',
      purchase
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 내 구매 요청 목록 조회
export async function GET(request: NextRequest) {
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

    const { data: purchases, error } = await supabase
      .from('slot_purchases')
      .select('*')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
