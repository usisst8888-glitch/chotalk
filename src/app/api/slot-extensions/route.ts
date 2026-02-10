import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const EXTENSION_PRICE = 50000; // 1인당 30일 연장 가격

// 연장 신청
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

    const { depositorName, slotIds } = await request.json();

    if (!depositorName || !slotIds || slotIds.length === 0) {
      return NextResponse.json({ error: '입금자명과 연장 대상을 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const totalAmount = slotIds.length * EXTENSION_PRICE;

    const { data, error } = await supabase
      .from('slot_extension_requests')
      .insert({
        user_id: payload.userId,
        depositor_name: depositorName,
        slot_ids: slotIds,
        slot_count: slotIds.length,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Extension request error:', error);
      return NextResponse.json({ error: '연장 신청 실패' }, { status: 500 });
    }

    return NextResponse.json({
      message: '연장 신청이 접수되었습니다. 입금 확인 후 연장됩니다.',
      request: data,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
