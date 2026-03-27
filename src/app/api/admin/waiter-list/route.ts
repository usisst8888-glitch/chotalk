import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET: 웨이터 배정 목록 조회
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const shopName = searchParams.get('shop_name');

  let query = supabase
    .from('waiter_assignments')
    .select('*')
    .order('updated_at', { ascending: false });

  if (shopName) {
    query = query.eq('shop_name', shopName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 가게 목록도 함께 반환
  const { data: shops } = await supabase
    .from('waiter_assignments')
    .select('shop_name')
    .order('shop_name');

  const uniqueShops = [...new Set((shops || []).map(s => s.shop_name))];

  return NextResponse.json({ assignments: data || [], shops: uniqueShops });
}

// DELETE: 개별 항목 삭제
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const shopName = searchParams.get('shop_name');

  // shop_name만 있으면 해당 가게 전체 삭제
  if (!id && shopName) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('waiter_assignments')
      .delete()
      .eq('shop_name', shopName);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: 'id 필수' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('waiter_assignments')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
