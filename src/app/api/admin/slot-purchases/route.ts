import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getKoreanTime } from '@/app/api/bot/handlers/shared';
import { checkSuperAdmin } from '@/lib/auth';

// pending 구매 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    const { data: requests, error } = await supabase
      .from('slot_purchases')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // user_id로 username 조회
    const userIds = [...new Set((requests || []).map(r => r.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    const userMap = new Map((users || []).map(u => [u.id, u.username]));

    const result = (requests || []).map(r => ({
      ...r,
      username: userMap.get(r.user_id) || '알 수 없음',
    }));

    return NextResponse.json({ requests: result });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 구매 요청 승인 → users.slot_count 증가
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: '요청 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 요청 조회
    const { data: purchaseRequest, error: findError } = await supabase
      .from('slot_purchases')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (findError || !purchaseRequest) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 유저의 현재 slot_count 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('slot_count')
      .eq('id', purchaseRequest.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '유저를 찾을 수 없습니다.' }, { status: 404 });
    }

    // slot_count 증가
    const newSlotCount = (user.slot_count || 0) + purchaseRequest.slot_count;
    await supabase
      .from('users')
      .update({ slot_count: newSlotCount })
      .eq('id', purchaseRequest.user_id);

    // 요청 상태 업데이트
    await supabase
      .from('slot_purchases')
      .update({ status: 'approved', updated_at: getKoreanTime() })
      .eq('id', requestId);

    return NextResponse.json({ message: '구매가 승인되었습니다. 슬롯이 추가되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
