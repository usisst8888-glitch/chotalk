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

// 관리자용 슬롯 수정 (카카오 ID 변경 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    const updateData: Record<string, string | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    // 카카오 ID 수정
    if (body.kakaoId !== undefined) {
      updateData.kakao_id = body.kakaoId;
    }

    // 활성화 상태 수정
    if (typeof body.isActive === 'boolean') {
      updateData.is_active = body.isActive;
    }

    const { data: updatedSlot, error } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '수정되었습니다.', slot: updatedSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
