import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// 현재 도메인의 총판 정보 조회
export async function GET(request: NextRequest) {
  try {
    const distributorId = request.headers.get('x-distributor-id');

    if (!distributorId) {
      // 메인 도메인 (총판 아님)
      return NextResponse.json({ distributor: null });
    }

    const supabase = getSupabase();
    const { data: distributor, error } = await supabase
      .from('distributors')
      .select('id, site_name, logo_url, primary_color, secondary_color')
      .eq('id', distributorId)
      .eq('is_active', true)
      .single();

    if (error || !distributor) {
      return NextResponse.json({ distributor: null });
    }

    return NextResponse.json({ distributor });
  } catch {
    return NextResponse.json({ distributor: null });
  }
}
