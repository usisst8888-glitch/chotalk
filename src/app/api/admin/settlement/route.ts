import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkSuperAdmin } from '@/lib/auth';

// 총판별 정산 데이터 조회 (superadmin)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
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
      .select('id, user_id, site_name, bank_name, account_number, account_holder, slot_price, extension_price, users:user_id (username)');

    if (distributorId) {
      distributorQuery = distributorQuery.eq('id', distributorId);
    }

    const { data: distributors, error: distError } = await distributorQuery;
    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 });
    }

    const settlements = [];

    for (const dist of distributors || []) {
      const userInfo = dist.users as unknown as { username: string } | null;

      // 이 총판 소속 유저들 조회 (parent_id = 총판의 user_id)
      const { data: users } = await supabase
        .from('users')
        .select('id, username')
        .eq('parent_id', dist.user_id);

      const userIds = (users || []).map(u => u.id);

      let purchaseCount = 0;
      let purchaseSlots = 0;
      let purchaseAmount = 0;
      let extensionCount = 0;
      let extensionSlots = 0;
      let extensionAmount = 0;

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
          purchaseCount++;
          purchaseSlots += p.slot_count;
          purchaseAmount += p.total_amount;
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
          extensionCount++;
          extensionSlots += e.slot_count;
          extensionAmount += e.total_amount;
        }
      }

      settlements.push({
        distributorId: dist.id,
        siteName: dist.site_name,
        username: userInfo?.username || '-',
        bankName: dist.bank_name,
        accountNumber: dist.account_number,
        accountHolder: dist.account_holder,
        slotPrice: dist.slot_price,
        extensionPrice: dist.extension_price,
        userCount: userIds.length,
        purchaseCount,
        purchaseSlots,
        purchaseAmount,
        extensionCount,
        extensionSlots,
        extensionAmount,
        totalAmount: purchaseAmount + extensionAmount,
      });
    }

    return NextResponse.json({ settlements, month });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
