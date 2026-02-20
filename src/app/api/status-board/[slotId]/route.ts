import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { checkIsEvent } from '@/app/api/bot/handlers/event';

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
      .select('id, room_number, girl_name, start_time, end_time, usage_duration, is_designated, is_event, event_count, trigger_type, is_in_progress, data_changed, created_at')
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

    // 재발송: 가장 최근 레코드만 data_changed = true
    if (body.bulkResend) {
      const { data: latest, error: latestError } = await supabase
        .from('status_board')
        .select('id')
        .eq('slot_id', slotId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError || !latest) {
        return NextResponse.json({ error: '레코드를 찾을 수 없습니다.' }, { status: 404 });
      }

      const { error: bulkError } = await supabase
        .from('status_board')
        .update({
          data_changed: true,
          updated_at: getKoreanTime(),
        })
        .eq('id', latest.id);

      if (bulkError) {
        return NextResponse.json({ error: '재발송 처리 실패' }, { status: 500 });
      }
      return NextResponse.json({ message: '재발송 예정' });
    }

    // 취소 처리: trigger_type을 'canceled'로 변경
    if (body.cancel && body.recordId) {
      const { error: cancelError } = await supabase
        .from('status_board')
        .update({
          trigger_type: 'canceled',
          is_in_progress: false,
          updated_at: getKoreanTime(),
          data_changed: true,
        })
        .eq('id', body.recordId);

      if (cancelError) {
        return NextResponse.json({ error: '취소 처리 실패' }, { status: 500 });
      }
      return NextResponse.json({ message: '취소 처리 완료' });
    }

    // 강제 종료: 진행 중인 레코드를 종료 처리 (ㄲ 핸들러와 동일)
    if (body.forceEnd && body.recordId) {
      const endUpdate: Record<string, unknown> = {
        is_in_progress: false,
        end_time: getKoreanTime(),
        usage_duration: body.usage_duration ?? null,
        event_count: body.usage_duration ? Math.floor(body.usage_duration) : null,
        trigger_type: 'end',
        data_changed: true,
        updated_at: getKoreanTime(),
      };
      if (body.room_number !== undefined) endUpdate.room_number = body.room_number;
      if (body.start_time !== undefined) endUpdate.start_time = body.start_time;
      if (body.is_designated !== undefined) endUpdate.is_designated = body.is_designated;

      const { error: endError } = await supabase
        .from('status_board')
        .update(endUpdate)
        .eq('id', body.recordId);

      if (endError) {
        return NextResponse.json({ error: '수정 실패' }, { status: 500 });
      }
      return NextResponse.json({ message: '수정 완료, 재발송 예정' });
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

// 새 세션 추가 (수동 INSERT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });

    const { slotId } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // 슬롯 정보 조회
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('id, user_id, girl_name, shop_name, kakao_id, target_room')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: '슬롯을 찾을 수 없습니다.' }, { status: 404 });
    }

    const now = getKoreanTime();
    const startTime = body.start_time || now;

    // 이벤트 여부 자동 체크 (봇과 동일 로직)
    const isEvent = await checkIsEvent(supabase, slotId, slot.shop_name, startTime);

    const { error: insertError } = await supabase
      .from('status_board')
      .insert({
        slot_id: slotId,
        user_id: slot.user_id,
        girl_name: slot.girl_name,
        shop_name: slot.shop_name,
        kakao_id: slot.kakao_id,
        target_room: slot.target_room,
        room_number: body.room_number || null,
        is_in_progress: true,
        start_time: startTime,
        end_time: null,
        usage_duration: null,
        event_count: null,
        trigger_type: 'start',
        is_designated: body.is_designated || false,
        is_event: isEvent,
        source_log_id: null,
        data_changed: true,
      });

    if (insertError) {
      return NextResponse.json({ error: '세션 추가 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '세션이 추가되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 특정 레코드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });

    const { slotId } = await params;
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const deleteAll = searchParams.get('deleteAll');

    const supabase = getSupabase();

    // 전체 삭제 (초기화)
    if (deleteAll === 'true') {
      const { error } = await supabase
        .from('status_board')
        .delete()
        .eq('slot_id', slotId);

      if (error) {
        return NextResponse.json({ error: '초기화 실패' }, { status: 500 });
      }
      return NextResponse.json({ message: '초기화되었습니다.' });
    }

    if (!recordId) {
      return NextResponse.json({ error: 'recordId가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('status_board')
      .delete()
      .eq('id', recordId);

    if (error) {
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '삭제되었습니다.' });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
