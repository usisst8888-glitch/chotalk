import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// 정산 입금 처리 (superadmin만)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { distributorId, month, isPaid, paidAmount } = await request.json();

    if (!distributorId || !month) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('settlement_records')
      .upsert({
        distributor_id: distributorId,
        month,
        is_paid: isPaid,
        paid_amount: isPaid ? (paidAmount || 0) : 0,
        paid_at: isPaid ? new Date().toISOString() : null,
        paid_by: isPaid ? user.id : null,
      }, { onConflict: 'distributor_id,month' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: isPaid ? '입금 처리 완료' : '입금 취소 완료' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 총판별 정산 데이터 조회 (superadmin: 전체, admin: 자기 총판만)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM 형식
    const distributorId = searchParams.get('distributorId');

    if (!month) {
      return NextResponse.json({ error: '월(month)을 지정해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 해당 월의 시작/끝
    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0);
    const endDateStr = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;

    // 총판 목록 조회
    let distributorQuery = supabase
      .from('distributors')
      .select('id, user_id, site_name, bank_name, account_number, account_holder, slot_price, extension_price, cost_price, users:user_id (username)');

    if (user.role === 'admin') {
      // 총판은 자기 것만
      distributorQuery = distributorQuery.eq('user_id', user.id);
    } else if (distributorId) {
      distributorQuery = distributorQuery.eq('id', distributorId);
    }

    const { data: distributors, error: distError } = await distributorQuery;
    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 });
    }

    // 정산 입금 기록 조회
    const distributorIds = (distributors || []).map(d => d.id);
    let settlementRecords: Record<string, { isPaid: boolean; paidAt: string | null; paidAmount: number }> = {};
    if (distributorIds.length > 0) {
      const { data: records } = await supabase
        .from('settlement_records')
        .select('distributor_id, is_paid, paid_at, paid_amount')
        .in('distributor_id', distributorIds)
        .eq('month', month);

      for (const r of records || []) {
        settlementRecords[r.distributor_id] = { isPaid: r.is_paid, paidAt: r.paid_at, paidAmount: r.paid_amount || 0 };
      }
    }

    const settlements = [];

    for (const dist of distributors || []) {
      const userInfo = dist.users as unknown as { username: string } | null;
      const costPrice = dist.cost_price || 20000; // 본사 입금 단가

      // 이 총판 소속 유저들 조회 (parent_id = 총판의 user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .eq('parent_id', dist.user_id);

      const userIds = (users || []).map(u => u.id);

      let totalSalesAmount = 0; // 총판이 유저에게 받은 총 금액
      let totalSlotCount = 0; // 총 판매 인원수

      if (userIds.length > 0) {
        // 슬롯 구매 (approved만)
        const { data: purchases } = await supabase
          .from('slot_purchases')
          .select('slot_count, total_amount')
          .in('user_id', userIds)
          .eq('status', 'approved')
          .gte('created_at', startDate)
          .lte('created_at', endDateStr + 'T23:59:59');

        for (const p of purchases || []) {
          totalSlotCount += p.slot_count;
          totalSalesAmount += p.total_amount;
        }

        // 슬롯 연장 (approved만)
        const { data: extensions } = await supabase
          .from('slot_extension_requests')
          .select('slot_count, total_amount')
          .in('user_id', userIds)
          .eq('status', 'approved')
          .gte('created_at', startDate)
          .lte('created_at', endDateStr + 'T23:59:59');

        for (const e of extensions || []) {
          totalSlotCount += e.slot_count;
          totalSalesAmount += e.total_amount;
        }
      }

      const costToHQ = totalSlotCount * costPrice; // 본사 입금액
      const settlementAmount = totalSalesAmount - costToHQ; // 정산 금액 (총판 수익)

      const record = settlementRecords[dist.id];
      settlements.push({
        distributorId: dist.id,
        siteName: dist.site_name,
        username: userInfo?.username || '-',
        bankName: dist.bank_name,
        accountNumber: dist.account_number,
        accountHolder: dist.account_holder,
        slotPrice: dist.slot_price,
        costPrice,
        userCount: userIds.length,
        totalSlotCount,
        totalSalesAmount,
        costToHQ,
        settlementAmount,
        isPaid: record?.isPaid || false,
        paidAt: record?.paidAt || null,
        paidAmount: record?.paidAmount || 0,
      });
    }

    return NextResponse.json({ settlements, month });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
