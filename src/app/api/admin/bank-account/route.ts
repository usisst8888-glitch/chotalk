import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// 본인 총판 계좌/판매금액 조회
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from('distributors')
      .select('bank_name, account_number, account_holder, slot_price')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      bankName: data?.bank_name || '',
      accountNumber: data?.account_number || '',
      accountHolder: data?.account_holder || '',
      slotPrice: data?.slot_price || 100000,
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 본인 총판 계좌/판매금액 수정
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { bankName, accountNumber, accountHolder, slotPrice } = await request.json();
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {};
    if (bankName !== undefined) updateData.bank_name = bankName;
    if (accountNumber !== undefined) updateData.account_number = accountNumber;
    if (accountHolder !== undefined) updateData.account_holder = accountHolder;
    if (slotPrice !== undefined) {
      updateData.slot_price = slotPrice;
      updateData.extension_price = slotPrice; // 동일 금액
    }

    const { error } = await supabase
      .from('distributors')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '저장되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
