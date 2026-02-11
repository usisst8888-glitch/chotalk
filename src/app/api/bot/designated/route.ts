import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseDesignatedSection } from '@/lib/message-parser';

// ============================================================
// ㅈ.ㅁ(지명) 섹션 처리 엔드포인트
// 게시판 메시지의 ➖➖ㅈ.ㅁ➖➖ 구분선 아래 아가씨 목록을 파싱하여 DB 저장
// ============================================================

function getKoreanTime(): string {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  return koreaTime.toISOString().slice(0, -1);
}

/**
 * ㅈ.ㅁ 섹션 처리 핵심 로직
 * route.ts에서도 import하여 사용
 */
export async function processDesignatedSection(
  room: string,
  sender: string,
  message: string,
  receivedAt: string
): Promise<{ processed: number; skipped: number; deduped: number }> {
  const supabase = getSupabase();
  const result = { processed: 0, skipped: 0, deduped: 0, removed: 0 };

  const entries = parseDesignatedSection(message);
  if (entries.length === 0) return result;

  console.log('ㅈ.ㅁ section found:', entries);

  // 활성 슬롯 가져오기
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('id, user_id, girl_name, target_room, kakao_id, shop_name')
    .eq('is_active', true);

  if (slotsError || !slots) {
    console.error('ㅈ.ㅁ slots query error:', slotsError);
    return result;
  }

  // 슬롯 매칭된 이름만 추출 (중복 포함)
  const newGirlNames: string[] = [];
  for (const entry of entries) {
    const matchedSlot = slots.find(s => s.girl_name === entry.girlName);
    if (matchedSlot && new Date((matchedSlot as any).expires_at) >= new Date()) {
      newGirlNames.push(entry.girlName);
    } else {
      result.skipped++;
    }
  }

  // 기존 DB 상태 가져오기
  const { data: currentNotices } = await supabase
    .from('designated_notices')
    .select('*');

  const currentGirlNames = (currentNotices || []).map((n: any) => n.girl_name).sort();
  const newGirlNamesSorted = [...newGirlNames].sort();

  // 상태가 동일하면 skip (반복 메시지 dedup)
  if (JSON.stringify(currentGirlNames) === JSON.stringify(newGirlNamesSorted)) {
    console.log('ㅈ.ㅁ dedup: same state, skipping');
    result.deduped = newGirlNames.length;
    return result;
  }

  // 상태가 다르면 전체 갱신: 기존 → history 이동
  if (currentNotices && currentNotices.length > 0) {
    for (const notice of currentNotices) {
      const { error: historyError } = await supabase
        .from('designated_notices_history')
        .insert({
          original_id: notice.id,
          slot_id: notice.slot_id,
          user_id: notice.user_id,
          shop_name: notice.shop_name,
          girl_name: notice.girl_name,
          kakao_id: notice.kakao_id,
          target_room: notice.target_room,
          source_log_id: notice.source_log_id,
          sent_at: notice.sent_at,
          send_success: notice.send_success,
          created_at: notice.created_at,
        });

      if (!historyError) {
        await supabase.from('designated_notices').delete().eq('id', notice.id);
        console.log(`ㅈ.ㅁ removed: "${notice.girl_name}" → history`);
        result.removed++;
      }
    }
  }

  // 새 엔트리 전부 INSERT (중복 이름도 각각 별도 세션)
  for (const girlName of newGirlNames) {
    const matchedSlot = slots.find(s => s.girl_name === girlName)!;

    // message_logs에 원본 메시지 저장
    const { data: log, error: logError } = await supabase
      .from('message_logs')
      .insert({
        slot_id: matchedSlot.id,
        user_id: matchedSlot.user_id,
        source_room: room,
        sender_name: sender,
        message: message,
        received_at: receivedAt,
      })
      .select()
      .single();

    if (logError) {
      console.error(`ㅈ.ㅁ message_logs error for "${girlName}":`, logError);
    }

    const { error: insertError } = await supabase
      .from('designated_notices')
      .insert({
        slot_id: matchedSlot.id,
        user_id: matchedSlot.user_id,
        shop_name: matchedSlot.shop_name,
        girl_name: matchedSlot.girl_name,
        kakao_id: matchedSlot.kakao_id,
        target_room: matchedSlot.target_room,
        source_log_id: log?.id || null,
      });

    if (insertError) {
      console.error(`ㅈ.ㅁ insert error for "${girlName}":`, insertError);
    } else {
      console.log(`ㅈ.ㅁ saved: "${girlName}"`);
      result.processed++;
    }
  }

  return result;
}

// POST 핸들러 (직접 호출용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message']
      }, { status: 400 });
    }

    const messageReceivedAt = receivedAt || getKoreanTime();
    const result = await processDesignatedSection(room, sender, message, messageReceivedAt);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('ㅈ.ㅁ endpoint error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
