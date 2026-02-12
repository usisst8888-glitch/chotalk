import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseDesignatedSection } from '@/lib/message-parser';
import { getKoreanTime } from '@/app/api/bot/handlers/shared';

// ============================================================
// ㅈ.ㅁ(지명) 섹션 처리 엔드포인트
// 게시판 메시지의 ➖➖ㅈ.ㅁ➖➖ 구분선 아래 아가씨 목록을 파싱하여 DB 저장
// ============================================================

/**
 * ㅈ.ㅁ 섹션 처리 핵심 로직
 * 1) message_logs 무조건 저장 (맨 처음, 파싱/분석 전에)
 * 2) designated_notices 증분 업데이트
 */
export async function processDesignatedSection(
  room: string,
  sender: string,
  message: string,
  receivedAt: string
): Promise<{ processed: number; skipped: number; deduped: number; removed: number }> {
  const supabase = getSupabase();
  const result = { processed: 0, skipped: 0, deduped: 0, removed: 0 };

  // ★ message_logs 무조건 저장 (파싱/슬롯매칭 전에 먼저!)
  const { data: anySlot } = await supabase
    .from('slots')
    .select('id, user_id')
    .eq('is_active', true)
    .limit(1)
    .single();

  let sourceLogId: string | null = null;
  if (anySlot) {
    const { data: log, error: logError } = await supabase
      .from('message_logs')
      .insert({
        slot_id: anySlot.id,
        user_id: anySlot.user_id,
        source_room: room || null,
        sender_name: sender || null,
        message: message,
        received_at: receivedAt || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('ㅈ.ㅁ message_logs error:', logError);
    } else {
      sourceLogId = log?.id || null;
      console.log('ㅈ.ㅁ message_logs saved:', sourceLogId);
    }
  }

  // 파싱
  const entries = parseDesignatedSection(message);
  if (entries.length === 0) return result;

  console.log('ㅈ.ㅁ section found:', entries);

  // 활성 슬롯 가져오기
  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('id, user_id, girl_name, target_room, kakao_id, shop_name, expires_at')
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

  // 기존 DB 레코드 가져오기 (제거 로직은 newGirlNames가 비어도 실행해야 함)
  const { data: currentNotices, error: currentError } = await supabase
    .from('designated_notices')
    .select('*');

  if (currentError) {
    console.error('ㅈ.ㅁ designated_notices 조회 에러:', currentError);
  }

  const currentRecords = currentNotices || [];

  console.log('ㅈ.ㅁ 비교:', {
    newGirlNames,
    dbRecordCount: currentRecords.length,
    dbGirlNames: currentRecords.map((n: any) => n.girl_name),
  });

  // 새 메시지에 매칭되는 이름도 없고 DB에도 레코드가 없으면 조기 리턴
  if (newGirlNames.length === 0 && currentRecords.length === 0) return result;

  // 이름별 카운트: 새 메시지 vs DB
  const newCount = new Map<string, number>();
  for (const name of newGirlNames) {
    newCount.set(name, (newCount.get(name) || 0) + 1);
  }

  const dbCount = new Map<string, number>();
  const dbRecords = new Map<string, any[]>();
  for (const notice of currentRecords) {
    dbCount.set(notice.girl_name, (dbCount.get(notice.girl_name) || 0) + 1);
    if (!dbRecords.has(notice.girl_name)) dbRecords.set(notice.girl_name, []);
    dbRecords.get(notice.girl_name)!.push(notice);
  }

  // 1. DB에만 있고 새 메시지에 없는 이름 → 전부 history로 이동
  for (const [name, records] of dbRecords) {
    if (!newCount.has(name)) {
      for (const notice of records) {
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
        if (historyError) {
          console.error(`ㅈ.ㅁ history INSERT 실패 "${name}":`, historyError);
        } else {
          await supabase.from('designated_notices').delete().eq('id', notice.id);
          console.log(`ㅈ.ㅁ removed: "${name}" → history`);
          result.removed++;
        }
      }
    }
  }

  // 2. 양쪽 다 있지만 DB가 더 많으면 → 초과분 history로 이동
  for (const [name, nc] of newCount) {
    const dc = dbCount.get(name) || 0;
    if (dc > nc) {
      const records = dbRecords.get(name) || [];
      const toRemove = records.slice(nc); // 앞에서 nc개는 유지, 나머지 제거
      for (const notice of toRemove) {
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
        if (historyError) {
          console.error(`ㅈ.ㅁ history INSERT 실패 (excess) "${name}":`, historyError);
        } else {
          await supabase.from('designated_notices').delete().eq('id', notice.id);
          console.log(`ㅈ.ㅁ removed excess: "${name}" → history`);
          result.removed++;
        }
      }
    }
  }

  // 3. 새 메시지에 더 많거나 새로 추가된 이름 → 부족분만 INSERT
  for (const [name, nc] of newCount) {
    const dc = dbCount.get(name) || 0;
    const toAdd = nc - dc;
    if (toAdd <= 0) continue;

    const matchedSlot = slots.find(s => s.girl_name === name)!;

    for (let i = 0; i < toAdd; i++) {
      const { error: insertError } = await supabase
        .from('designated_notices')
        .insert({
          slot_id: matchedSlot.id,
          user_id: matchedSlot.user_id,
          shop_name: matchedSlot.shop_name,
          girl_name: matchedSlot.girl_name,
          kakao_id: matchedSlot.kakao_id,
          target_room: matchedSlot.target_room,
          source_log_id: sourceLogId,
        });

      if (insertError) {
        console.error(`ㅈ.ㅁ insert error for "${name}":`, insertError);
      } else {
        console.log(`ㅈ.ㅁ saved: "${name}"`);
        result.processed++;
      }
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
