import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// 가게 목록 조회 (이벤트 시간 포함) - 인증 불필요
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: shops, error } = await supabase
      .from('event_times')
      .select('id, shop_name, start_time, end_time, is_active')
      .eq('is_active', true)
      .order('shop_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ shops });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
