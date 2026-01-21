import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// 템플릿 조회
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: template, error } = await supabase
      .from('user_templates')
      .select('template')
      .eq('user_id', payload.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is fine, user hasn't set a template)
      return NextResponse.json({ error: '템플릿 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ template: template?.template || '' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 템플릿 저장 (생성 또는 업데이트)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { template } = await request.json();

    if (!template || typeof template !== 'string') {
      return NextResponse.json({ error: '템플릿 내용을 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // upsert: 있으면 업데이트, 없으면 생성
    const { error } = await supabase
      .from('user_templates')
      .upsert(
        {
          user_id: payload.userId,
          template,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Template save error:', error);
      return NextResponse.json({ error: '템플릿 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '템플릿이 저장되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
