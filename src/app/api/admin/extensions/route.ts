import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { getKoreanTime } from '@/app/api/bot/handlers/shared';

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

// ISO 문자열 변환 (Z 제거)
function toTimestampString(date: Date): string {
  return date.toISOString().slice(0, -1);
}

// pending 연장 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const supabase = getSupabase();

    const { data: requests, error } = await supabase
      .from('slot_extension_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // user_id로 username 조회
    const userIds = [...new Set((requests || []).map(r => r.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    const userMap = new Map((users || []).map(u => [u.id, u.username]));

    const result = (requests || []).map(r => ({
      ...r,
      username: userMap.get(r.user_id) || '알 수 없음',
    }));

    return NextResponse.json({ requests: result });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 연장 요청 승인
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: '요청 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 요청 조회
    const { data: extRequest, error: findError } = await supabase
      .from('slot_extension_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (findError || !extRequest) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 각 슬롯 30일 연장
    for (const slotId of extRequest.slot_ids) {
      const { data: slot } = await supabase
        .from('slots')
        .select('expires_at')
        .eq('id', slotId)
        .single();

      if (slot) {
        const newExpiry = new Date(slot.expires_at);
        newExpiry.setDate(newExpiry.getDate() + 30);

        await supabase
          .from('slots')
          .update({ expires_at: toTimestampString(newExpiry) })
          .eq('id', slotId);
      }
    }

    // 요청 상태 업데이트
    await supabase
      .from('slot_extension_requests')
      .update({ status: 'approved', updated_at: getKoreanTime() })
      .eq('id', requestId);

    return NextResponse.json({ message: '연장이 승인되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
