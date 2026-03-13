import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkSuperAdmin } from '@/lib/auth';

function getTableName(type: string) {
  if (type === 'atok') return 'aktalk_atok_services';
  if (type === 'chotok') return 'aktalk_chotok_services';
  return null;
}

// 전체 서비스 목록 조회 (superadmin)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tableName = getTableName(type || '');
    if (!tableName) {
      return NextResponse.json({ error: '잘못된 타입입니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(tableName)
      .select('*, users(username, nickname)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    const services = (data || []).map((svc: Record<string, unknown>) => {
      const users = svc.users as Record<string, unknown> | null;
      return {
        ...svc,
        username: users?.username || null,
        nickname: users?.nickname || null,
        users: undefined,
      };
    });

    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 상태 변경 (활성/비활성)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, isActive } = body;
    const tableName = getTableName(type);
    if (!tableName || !id) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from(tableName)
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 삭제
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const tableName = getTableName(type || '');
    if (!tableName || !id) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
