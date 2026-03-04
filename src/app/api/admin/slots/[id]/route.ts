import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkAdminOrSuperAdmin } from '@/lib/auth';

function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().slice(0, -1);
}

// admin(총판)이 해당 슬롯에 대한 권한이 있는지 확인
async function checkSlotAccess(authUser: { id: string; role: string }, slotId: string): Promise<boolean> {
  if (authUser.role === 'superadmin') return true;

  const supabase = getSupabase();
  const { data: slot } = await supabase
    .from('slots')
    .select('user_id')
    .eq('id', slotId)
    .single();

  if (!slot) return false;

  const { data: slotUser } = await supabase
    .from('users')
    .select('parent_id')
    .eq('id', slot.user_id)
    .single();

  return slotUser?.parent_id === authUser.id;
}

// 관리자용 슬롯 삭제 (연관 데이터 전부 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await checkAdminOrSuperAdmin(request);
    if (!authUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await params;

    if (!(await checkSlotAccess(authUser, id))) {
      return NextResponse.json({ error: '해당 슬롯에 대한 권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    // CASCADE 안 되는 테이블 수동 삭제
    await supabase.from('status_board_history').delete().eq('slot_id', id);
    await supabase.from('send_queue').delete().eq('slot_id', id);

    // slots 삭제 (status_board, message_logs는 ON DELETE CASCADE)
    const { error } = await supabase.from('slots').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 관리자용 슬롯 수정 (카카오 ID 변경 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await checkAdminOrSuperAdmin(request);
    if (!authUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id } = await params;

    if (!(await checkSlotAccess(authUser, id))) {
      return NextResponse.json({ error: '해당 슬롯에 대한 권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const supabase = getSupabase();

    const updateData: Record<string, string | boolean | null> = {
      updated_at: getKoreanTime(),
    };

    // 카카오 ID 수정
    if (body.kakaoId !== undefined) {
      updateData.kakao_id = body.kakaoId;
    }

    // 활성화 상태 수정
    if (typeof body.isActive === 'boolean') {
      updateData.is_active = body.isActive;
    }

    // 만료일 연장 (superadmin 전용)
    if (typeof body.extendDays === 'number' && body.extendDays > 0) {
      if (authUser.role !== 'superadmin') {
        return NextResponse.json({ error: '만료일 변경은 슈퍼관리자만 가능합니다.' }, { status: 403 });
      }

      // 현재 만료일 조회
      const { data: slot } = await supabase
        .from('slots')
        .select('expires_at')
        .eq('id', id)
        .single();

      if (slot?.expires_at) {
        const currentExpiry = new Date(slot.expires_at);
        currentExpiry.setDate(currentExpiry.getDate() + body.extendDays);
        // 한국 시간 ISO 문자열 (Z 없이)
        const newExpiry = new Date(currentExpiry.getTime() + (9 * 60 * 60 * 1000));
        updateData.expires_at = newExpiry.toISOString().slice(0, -1);
      }
    }

    // 남은 기간 직접 설정 (superadmin 전용) - 오늘부터 N일
    if (typeof body.setRemainingDays === 'number' && body.setRemainingDays > 0) {
      if (authUser.role !== 'superadmin') {
        return NextResponse.json({ error: '만료일 변경은 슈퍼관리자만 가능합니다.' }, { status: 403 });
      }

      const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
      now.setDate(now.getDate() + body.setRemainingDays);
      updateData.expires_at = now.toISOString().slice(0, -1);
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
