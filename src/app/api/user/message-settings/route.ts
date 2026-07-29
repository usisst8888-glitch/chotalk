import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';

// ============================================================
// 회원 본인의 발송 문구 설정 (헤더 템플릿 + 하단 멘트) 수정
// 프리미엄 회원만 가능. 관리자 대시보드와 별개로 회원이 자기 걸 직접 편집.
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const supabase = getSupabase();

    // 본인 프리미엄 여부 확인
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('is_premium')
      .eq('id', payload.userId)
      .single();

    if (meError || !me) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!me.is_premium) {
      return NextResponse.json({ error: '프리미엄 회원만 발송 문구를 설정할 수 있습니다.' }, { status: 403 });
    }

    const { headerTemplate, footerMessage } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (headerTemplate !== undefined) updateData.header_template = headerTemplate || null;
    if (footerMessage !== undefined) updateData.footer_message = footerMessage || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', payload.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '저장되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
