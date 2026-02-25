import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { checkSuperAdmin } from '@/lib/auth';

// 총판 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();
    const { data: distributors, error } = await supabase
      .from('distributors')
      .select(`
        id, user_id, domain, site_name, logo_url,
        primary_color, secondary_color, is_active, created_at,
        users:user_id (username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = distributors?.map(d => {
      const userInfo = d.users as unknown as { username: string } | null;
      return { ...d, username: userInfo?.username || '알 수 없음', users: undefined };
    });

    return NextResponse.json({ distributors: formatted });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 총판 생성
export async function POST(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { userId, domain, siteName, primaryColor, secondaryColor, logoUrl } = await request.json();

    if (!userId || !domain || !siteName) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('distributors')
      .insert({
        user_id: userId,
        domain,
        site_name: siteName,
        primary_color: primaryColor || '#4f46e5',
        secondary_color: secondaryColor || '#7c3aed',
        logo_url: logoUrl || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ distributor: data });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 총판 수정
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id, domain, siteName, primaryColor, secondaryColor, isActive, logoUrl } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const updateData: Record<string, unknown> = {};
    if (domain !== undefined) updateData.domain = domain;
    if (siteName !== undefined) updateData.site_name = siteName;
    if (primaryColor !== undefined) updateData.primary_color = primaryColor;
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;

    const { error } = await supabase
      .from('distributors')
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

// 총판 삭제
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkSuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
