import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { SAMPLE_TEMPLATES } from '../route';

function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().replace('Z', '+09:00');
}

// 템플릿 선택 또는 커스텀 템플릿 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // 템플릿 선택 요청
    if (body.select === true) {
      let templateContent: string;
      let sourceType: 'sample' | 'custom';
      let sourceId: string | null = null;

      // 샘플 템플릿인지 확인
      const sampleTemplate = SAMPLE_TEMPLATES.find(s => s.id === id);

      if (sampleTemplate) {
        // 샘플 템플릿 선택
        templateContent = sampleTemplate.template;
        sourceType = 'sample';
      } else {
        // 커스텀 템플릿 선택 (DB에서 조회)
        const { data: customTemplate } = await supabase
          .from('custom_templates')
          .select('id, template')
          .eq('id', id)
          .eq('user_id', payload.userId)
          .single();

        if (!customTemplate) {
          return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 });
        }

        templateContent = customTemplate.template;
        sourceType = 'custom';
        sourceId = customTemplate.id;
      }

      // user_templates에 선택된 템플릿 저장 (UPSERT)
      const { error } = await supabase
        .from('user_templates')
        .upsert({
          user_id: payload.userId,
          template: templateContent,
          source_type: sourceType,
          source_id: sourceId,
          updated_at: getKoreanTime(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Template select error:', error);
        return NextResponse.json({ error: '템플릿 선택 실패' }, { status: 500 });
      }

      return NextResponse.json({ message: '템플릿이 선택되었습니다.' });
    }

    // 커스텀 템플릿 수정 요청
    const { name, template } = body;

    // 커스텀 템플릿인지 확인
    const { data: existing } = await supabase
      .from('custom_templates')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== payload.userId) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 템플릿 내용 수정
    const updateData: { name?: string; template?: string; updated_at: string } = {
      updated_at: getKoreanTime(),
    };

    if (name) updateData.name = name;
    if (template) updateData.template = template;

    const { error } = await supabase
      .from('custom_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '템플릿 수정 실패' }, { status: 500 });
    }

    // 만약 이 커스텀 템플릿이 현재 선택된 상태라면, user_templates도 업데이트
    if (template) {
      await supabase
        .from('user_templates')
        .update({ template, updated_at: getKoreanTime() })
        .eq('user_id', payload.userId)
        .eq('source_id', id);
    }

    return NextResponse.json({ message: '템플릿이 수정되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 커스텀 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = getSupabase();

    // 샘플 템플릿인지 확인 (샘플은 삭제 불가)
    const sampleTemplate = SAMPLE_TEMPLATES.find(s => s.id === id);
    if (sampleTemplate) {
      return NextResponse.json({ error: '샘플 템플릿은 삭제할 수 없습니다.' }, { status: 400 });
    }

    // 커스텀 템플릿 소유권 확인
    const { data: existing } = await supabase
      .from('custom_templates')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== payload.userId) {
      return NextResponse.json({ error: '템플릿을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 삭제하려는 템플릿이 현재 선택된 상태인지 확인
    const { data: selectedTemplate } = await supabase
      .from('user_templates')
      .select('source_id')
      .eq('user_id', payload.userId)
      .single();

    const wasSelected = selectedTemplate?.source_id === id;

    // 삭제
    const { error } = await supabase
      .from('custom_templates')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '템플릿 삭제 실패' }, { status: 500 });
    }

    // 삭제한 템플릿이 선택된 상태였으면 첫 번째 샘플로 자동 변경
    if (wasSelected) {
      const firstSample = SAMPLE_TEMPLATES[0];
      await supabase
        .from('user_templates')
        .update({
          template: firstSample.template,
          source_type: 'sample',
          source_id: null,
          updated_at: getKoreanTime(),
        })
        .eq('user_id', payload.userId);
    }

    return NextResponse.json({ message: '템플릿이 삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
