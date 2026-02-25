import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkSuperAdmin, checkAdminOrSuperAdmin } from '@/lib/auth';

// 회원 목록 조회 (superadmin: 전체, admin: 자기 유저만)
export async function GET(request: NextRequest) {
  try {
    const authUser = await checkAdminOrSuperAdmin(request);
    if (!authUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    if (authUser.role === 'superadmin') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, nickname, phone, role, slot_count, parent_id, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ users });
    }

    // admin(총판): 자기한테 배정된 유저만
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, nickname, phone, role, slot_count, parent_id, created_at')
      .eq('parent_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 회원 정보 수정 (slot_count, role, parent_id 변경)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { userId, slotCount, role, parentId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const updateData: Record<string, unknown> = {};
    if (slotCount !== undefined) updateData.slot_count = slotCount;
    if (role !== undefined) updateData.role = role;
    if (parentId !== undefined) updateData.parent_id = parentId || null;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '수정되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
