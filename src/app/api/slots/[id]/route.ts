import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// 슬롯 삭제
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

    // 삭제 전 슬롯의 kakao_id 가져오기
    const { data: slot } = await supabase
      .from('slots')
      .select('kakao_id')
      .eq('id', id)
      .eq('user_id', payload.userId)
      .single();

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id)
      .eq('user_id', payload.userId);

    if (error) {
      return NextResponse.json({ error: '슬롯 삭제 실패' }, { status: 500 });
    }

    // 삭제 성공 시 카카오 ID 사용 횟수 감소
    if (slot?.kakao_id) {
      const { data: kakaoInvite } = await supabase
        .from('kakao_invite_ids')
        .select('id, usage_count')
        .eq('kakao_id', slot.kakao_id)
        .single();

      if (kakaoInvite && kakaoInvite.usage_count > 0) {
        await supabase
          .from('kakao_invite_ids')
          .update({ usage_count: kakaoInvite.usage_count - 1 })
          .eq('id', kakaoInvite.id);
      }
    }

    return NextResponse.json({ message: '슬롯이 삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 슬롯 수정 (연장 등)
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

    // 연장 요청인 경우
    if (body.extend) {
      const { data: slot } = await supabase
        .from('slots')
        .select('expires_at')
        .eq('id', id)
        .eq('user_id', payload.userId)
        .single();

      if (!slot) {
        return NextResponse.json({ error: '슬롯을 찾을 수 없습니다.' }, { status: 404 });
      }

      // 30일 연장
      const currentExpiry = new Date(slot.expires_at);
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + 30);

      const { data: updatedSlot, error } = await supabase
        .from('slots')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', id)
        .eq('user_id', payload.userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: '슬롯 연장 실패' }, { status: 500 });
      }

      return NextResponse.json({ message: '슬롯이 연장되었습니다.', slot: updatedSlot });
    }

    // 활성화/비활성화 토글
    if (typeof body.isActive === 'boolean') {
      const { data: updatedSlot, error } = await supabase
        .from('slots')
        .update({ is_active: body.isActive })
        .eq('id', id)
        .eq('user_id', payload.userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: '슬롯 상태 변경 실패' }, { status: 500 });
      }

      return NextResponse.json({
        message: body.isActive ? '슬롯이 활성화되었습니다.' : '슬롯이 비활성화되었습니다.',
        slot: updatedSlot
      });
    }

    // 일반 수정
    const { girlName, shopName, targetRoom, chatRoomType } = body;
    const updateData: Record<string, string | null> = {};
    if (girlName) updateData.girl_name = girlName;
    if (shopName !== undefined) updateData.shop_name = shopName || null;
    if (targetRoom) updateData.target_room = targetRoom;
    if (chatRoomType === 'group' || chatRoomType === 'open') updateData.chat_room_type = chatRoomType;

    const { data: updatedSlot, error } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', payload.userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '슬롯 수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 수정되었습니다.', slot: updatedSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
