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

// 카카오 아이디 목록 조회 (슬롯 등록 수 포함)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    // 카카오 아이디 목록 조회
    const { data: kakaoIds, error } = await supabase
      .from('kakao_invite_ids')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 슬롯에서 각 카카오 아이디의 사용 횟수 조회
    const { data: slots } = await supabase
      .from('slots')
      .select('kakao_id');

    // 카카오 아이디별 사용 횟수 계산
    const usageCount: Record<string, number> = {};
    if (slots) {
      for (const slot of slots) {
        if (slot.kakao_id) {
          usageCount[slot.kakao_id] = (usageCount[slot.kakao_id] || 0) + 1;
        }
      }
    }

    // 결과에 등록 수 추가
    const kakaoIdsWithCount = kakaoIds?.map((item) => ({
      ...item,
      slot_count: usageCount[item.kakao_id] || 0,
    }));

    return NextResponse.json({ kakaoIds: kakaoIdsWithCount });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 카카오 아이디 추가
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { kakaoId, description } = await request.json();

    if (!kakaoId) {
      return NextResponse.json({ error: '카카오 아이디를 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 중복 체크
    const { data: existing } = await supabase
      .from('kakao_invite_ids')
      .select('id')
      .eq('kakao_id', kakaoId)
      .single();

    if (existing) {
      return NextResponse.json({ error: '이미 등록된 카카오 아이디입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('kakao_invite_ids')
      .insert({
        kakao_id: kakaoId,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ kakaoId: data });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 카카오 아이디 수정
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { id, kakaoId, description, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (kakaoId !== undefined) updateData.kakao_id = kakaoId;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error } = await supabase
      .from('kakao_invite_ids')
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

// 카카오 아이디 삭제
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
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
      .from('kakao_invite_ids')
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
