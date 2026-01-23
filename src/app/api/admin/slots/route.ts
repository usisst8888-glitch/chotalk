import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

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

// 전체 슬롯 조회 (만료일 오름차순)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    // 슬롯과 함께 유저 정보도 가져옴
    const { data: slots, error } = await supabase
      .from('slots')
      .select(`
        id,
        girl_name,
        shop_name,
        target_room,
        chat_room_type,
        kakao_id,
        is_active,
        expires_at,
        created_at,
        user_id,
        users:user_id (
          username
        )
      `)
      .order('expires_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // users 객체를 평탄화
    const formattedSlots = slots?.map(slot => {
      const userInfo = slot.users as unknown as { username: string } | null;
      return {
        ...slot,
        username: userInfo?.username || '알 수 없음',
        users: undefined
      };
    });

    return NextResponse.json({ slots: formattedSlots });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
