import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

function getKoreanTime(): string {
  return new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, -1);
}

// 해당 슬롯의 status_board 전체 레코드 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
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

    const { slotId } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('status_board')
      .select('id, room_number, girl_name, start_time, end_time, usage_duration, is_designated, is_event, event_count, trigger_type, is_in_progress, created_at')
      .eq('slot_id', slotId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: '레코드가 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ records: data });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 특정 레코드 수정 + data_changed = true
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
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

    const { slotId } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // is_event 전체 일괄 업데이트 (개별이 아닌 슬롯 전체)
    if (body.is_event !== undefined && body.bulkEvent) {
      const { error: bulkError } = await supabase
        .from('status_board')
        .update({
          is_event: body.is_event,
          data_changed: true,
          updated_at: getKoreanTime(),
        })
        .eq('slot_id', slotId);

      if (bulkError) {
        return NextResponse.json({ error: '이벤트 일괄 수정 실패' }, { status: 500 });
      }
      return NextResponse.json({ message: '이벤트 일괄 수정 완료, 재발송 예정' });
    }

    // recordId가 있으면 해당 레코드, 없으면 가장 최근 레코드
    let recordId = body.recordId;
    if (!recordId) {
      const { data: record, error: findError } = await supabase
        .from('status_board')
        .select('id')
        .eq('slot_id', slotId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !record) {
        return NextResponse.json({ error: '레코드를 찾을 수 없습니다.' }, { status: 404 });
      }
      recordId = record.id;
    }

    // 수정할 필드 구성
    const updateData: Record<string, unknown> = {
      data_changed: true,
      updated_at: getKoreanTime(),
    };

    if (body.room_number !== undefined) updateData.room_number = body.room_number;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.usage_duration !== undefined) {
      updateData.usage_duration = body.usage_duration;
      updateData.event_count = Math.floor(body.usage_duration);
    }
    if (body.is_designated !== undefined) updateData.is_designated = body.is_designated;

    const { error: updateError } = await supabase
      .from('status_board')
      .update(updateData)
      .eq('id', recordId);

    if (updateError) {
      return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '수정 완료, 재발송 예정' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
