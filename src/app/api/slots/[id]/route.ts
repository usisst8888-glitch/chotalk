import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// ISO 문자열 변환 (Z 제거) - 기존 값 연장용
function toTimestampString(date: Date): string {
  return date.toISOString().slice(0, -1);
}

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

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id)
      .eq('user_id', payload.userId);

    if (error) {
      return NextResponse.json({ error: '슬롯 삭제 실패' }, { status: 500 });
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

    // 관리자 여부 확인
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', payload.userId)
      .single();
    const isAdmin = currentUser?.role === 'admin';

    // 연장 요청인 경우
    if (body.extend) {
      let q = supabase.from('slots').select('expires_at').eq('id', id);
      if (!isAdmin) q = q.eq('user_id', payload.userId);
      const { data: slot } = await q.single();

      if (!slot) {
        return NextResponse.json({ error: '슬롯을 찾을 수 없습니다.' }, { status: 404 });
      }

      // 30일 연장 (한국 시간 기준)
      const currentExpiry = new Date(slot.expires_at);
      currentExpiry.setDate(currentExpiry.getDate() + 30);

      let updateQ = supabase.from('slots').update({ expires_at: toTimestampString(currentExpiry) }).eq('id', id);
      if (!isAdmin) updateQ = updateQ.eq('user_id', payload.userId);
      const { data: updatedSlot, error } = await updateQ.select().single();

      if (error) {
        return NextResponse.json({ error: '슬롯 연장 실패' }, { status: 500 });
      }

      return NextResponse.json({ message: '슬롯이 연장되었습니다.', slot: updatedSlot });
    }

    // 활성화/비활성화 토글
    if (typeof body.isActive === 'boolean') {
      // 비활성화 시 status_board 레코드를 히스토리로 이동
      if (!body.isActive) {
        const { data: records } = await supabase
          .from('status_board')
          .select('*')
          .eq('slot_id', id);

        if (records && records.length > 0) {
          await supabase.from('status_board_history').insert(
            records.map((r: Record<string, unknown>) => ({
              original_id: r.id,
              slot_id: r.slot_id,
              user_id: r.user_id,
              shop_name: r.shop_name,
              room_number: r.room_number,
              girl_name: r.girl_name,
              is_in_progress: r.is_in_progress,
              start_time: r.start_time,
              end_time: r.end_time,
              source_log_id: r.source_log_id,
              created_at: r.created_at,
              updated_at: r.updated_at,
              usage_duration: r.usage_duration,
              kakao_id: r.kakao_id,
              target_room: r.target_room,
              trigger_type: r.trigger_type,
              start_sent_at: r.start_sent_at,
              hourly_count: r.hourly_count,
              end_sent_at: r.end_sent_at,
              is_designated: r.is_designated,
              event_count: r.event_count,
              last_hourly_sent_at: r.last_hourly_sent_at,
              canceled_sent_at: r.canceled_sent_at,
              data_changed: r.data_changed,
            }))
          );

          await supabase.from('status_board').delete().eq('slot_id', id);
        }
      }

      let updateQ = supabase.from('slots').update({ is_active: body.isActive }).eq('id', id);
      if (!isAdmin) updateQ = updateQ.eq('user_id', payload.userId);
      const { data: updatedSlot, error } = await updateQ.select().single();

      if (error) {
        return NextResponse.json({ error: '슬롯 상태 변경 실패' }, { status: 500 });
      }

      return NextResponse.json({
        message: body.isActive ? '슬롯이 활성화되었습니다.' : '슬롯이 비활성화되었습니다.',
        slot: updatedSlot
      });
    }

    // 일반 수정
    const { girlName, shopName, targetRoom } = body;
    const updateData: Record<string, string | null> = {};
    if (girlName) updateData.girl_name = girlName;
    if (shopName !== undefined) updateData.shop_name = shopName || null;
    if (targetRoom) updateData.target_room = targetRoom;

    let updateQ = supabase.from('slots').update(updateData).eq('id', id);
    if (!isAdmin) updateQ = updateQ.eq('user_id', payload.userId);
    const { data: updatedSlot, error } = await updateQ.select().single();

    if (error) {
      return NextResponse.json({ error: '슬롯 수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '슬롯이 수정되었습니다.', slot: updatedSlot });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
