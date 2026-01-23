import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// 샘플 템플릿 정의 (DB에 저장하지 않음, 코드에서만 관리)
export const SAMPLE_TEMPLATES = [
  {
    id: 'sample-1',
    name: '💜 퍼플 하트',
    template: `💜💜 {업체명} 💜💜
♾️  {주소}  ♾️
💟 {날짜} 💟`,
  },
  {
    id: 'sample-2',
    name: '🌸 벚꽃 핑크',
    template: `🌸🌸 {업체명} 🌸🌸
🎀  {주소}  🎀
💕 {날짜} 💕`,
  },
  {
    id: 'sample-3',
    name: '⭐ 골드 스타',
    template: `⭐⭐ {업체명} ⭐⭐
✨  {주소}  ✨
🌟 {날짜} 🌟`,
  },
  {
    id: 'sample-4',
    name: '💎 블루 다이아',
    template: `💎💎 {업체명} 💎💎
🔷  {주소}  🔷
💙 {날짜} 💙`,
  },
  {
    id: 'sample-5',
    name: '🔥 레드 파이어',
    template: `🔥🔥 {업체명} 🔥🔥
❤️  {주소}  ❤️
🌹 {날짜} 🌹`,
  },
];

// 템플릿 목록 조회 (샘플 + 커스텀 + 선택된 템플릿)
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

    // 유저의 커스텀 템플릿 조회
    const { data: customTemplates } = await supabase
      .from('custom_templates')
      .select('id, name, template, created_at')
      .eq('user_id', payload.userId)
      .order('created_at', { ascending: true });

    // 유저가 선택한 템플릿 조회
    const { data: selectedTemplate } = await supabase
      .from('user_templates')
      .select('id, template, source_type, source_id')
      .eq('user_id', payload.userId)
      .single();

    // 선택된 템플릿 정보 결정
    let selectedInfo = null;
    if (selectedTemplate) {
      if (selectedTemplate.source_type === 'sample') {
        // 샘플 중에서 찾기
        const matchingSample = SAMPLE_TEMPLATES.find(s => s.template === selectedTemplate.template);
        selectedInfo = {
          type: 'sample',
          id: matchingSample?.id || 'sample-1',
          template: selectedTemplate.template,
        };
      } else {
        selectedInfo = {
          type: 'custom',
          id: selectedTemplate.source_id,
          template: selectedTemplate.template,
        };
      }
    }

    return NextResponse.json({
      samples: SAMPLE_TEMPLATES,                    // 샘플 템플릿 (코드에서)
      customTemplates: customTemplates || [],       // 유저 커스텀 템플릿 (DB에서)
      selected: selectedInfo,                       // 현재 선택된 템플릿 정보
    });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 커스텀 템플릿 생성
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

    const { name, template } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '템플릿 이름을 입력해주세요.' }, { status: 400 });
    }

    if (!template || typeof template !== 'string') {
      return NextResponse.json({ error: '템플릿 내용을 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // custom_templates에 저장
    const { data, error } = await supabase
      .from('custom_templates')
      .insert({
        user_id: payload.userId,
        name,
        template,
      })
      .select()
      .single();

    if (error) {
      console.error('Custom template create error:', error);
      return NextResponse.json({ error: '템플릿 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '템플릿이 생성되었습니다.', template: data });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
