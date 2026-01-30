import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().replace('Z', '+09:00');
}

// 관리자 권한 확인 헬퍼
async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', payload.userId)
    .single();

  if (!user || user.role !== 'admin') return null;
  return user;
}

// 마감 시간 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();
    const { data: closingTimes, error } = await supabase
      .from('shop_closing_times')
      .select('*')
      .order('shop_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ closingTimes });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 마감 시간 수정
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id, closingTime, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData: Record<string, unknown> = { updated_at: getKoreanTime() };
    if (closingTime !== undefined) updateData.closing_time = closingTime;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('shop_closing_times')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '수정되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
