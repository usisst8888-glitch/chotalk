import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseMessage, parseGirlSignals, extractRoomNumber } from '@/lib/message-parser';
import { processDesignatedSection } from '@/app/api/bot/designated/route';
import { getKoreanTime } from '@/app/api/bot/handlers/shared';
import { handleCancel } from '@/app/api/bot/handlers/cancel';
import { handleNewSession, handleResume } from '@/app/api/bot/handlers/session';
import { handleSessionStart } from '@/app/api/bot/handlers/start';
import { handleSessionEnd } from '@/app/api/bot/handlers/end';
import { handleCorrectionWithTime, handleCorrectionCatchAll } from '@/app/api/bot/handlers/correction';
import { ensureRoomsExist, buildKeepAliveRooms, processTransfers } from '@/app/api/bot/handlers/room';
import { HandlerContext } from '@/app/api/bot/handlers/types';

// ============================================================
// 메신저봇R에서 메시지 수신
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room, sender, message, receivedAt } = body;

    // 필수 필드 검증
    if (!room || !sender || !message) {
      return NextResponse.json({
        error: '필수 필드가 누락되었습니다.',
        required: ['room', 'sender', 'message']
      }, { status: 400 });
    }

    const supabase = getSupabase();
    const messageReceivedAt = receivedAt || getKoreanTime();

    // 활성화된 슬롯 가져오기
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, user_id, girl_name, target_room, kakao_id, is_active, expires_at, shop_name')
      .eq('is_active', true);

    if (slotsError) {
      console.error('Slots query error:', slotsError);
      return NextResponse.json({ success: false, message: '슬롯 조회 오류', error: slotsError.message });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({ success: false, message: '활성화된 슬롯 없음' });
    }

    console.log('Active slots found:', slots.length, 'names:', slots.map(s => s.girl_name));

    // ㅈ.ㅁ(지명) 섹션 감지 → message_logs 무조건 저장 + designated_notices 업데이트
    if (message.includes('ㅈ.ㅁ')) {
      await processDesignatedSection(room, sender, message, messageReceivedAt);
    }

    // 메시지 파싱
    const girlNames = slots.map(slot => slot.girl_name);
    const parsed = parseMessage(message, girlNames);

    const allLines = message.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const hasRoomNumber = allLines.some((line: string) => extractRoomNumber(line));

    // ============================================================
    // 1. message_logs 저장 (방번호가 있으면 저장, 아가씨 매칭과 무관)
    // ============================================================
    let logId: string | undefined;

    if (hasRoomNumber) {
      const { data: log, error: logError } = await supabase
        .from('message_logs')
        .insert({
          source_room: room,
          sender_name: sender,
          message: message,
          received_at: messageReceivedAt,
        })
        .select()
        .single();

      if (logError) {
        console.error('message_logs insert error:', logError);
      } else {
        logId = log?.id;
        console.log('message_logs inserted:', logId);
      }
    }

    // ============================================================
    // 2. rooms 사전생성 (message_logs 저장 후, ➖➖➖➖ 현황판 제외)
    // ============================================================
    if (hasRoomNumber && !message.includes('➖➖➖➖')) {
      await ensureRoomsExist(supabase, allLines, room, messageReceivedAt);
    }

    // 3. 미등록 아가씨의 ㅇㅈ/ㅈㅈㅎ 감지 → 해당 방은 닫지 않음
    const keepAliveRooms = buildKeepAliveRooms(allLines, girlNames);

    // 4. ㅌㄹㅅ(방이동) 감지 → status_board 세션 이동 처리
    const transferResults = await processTransfers(supabase, allLines, room);

    // ============================================================
    // 방번호 + 아가씨 매칭 → status_board 저장
    // ============================================================
    const matchedSlots = slots.filter(slot => {
      if (new Date(slot.expires_at) < new Date()) return false;
      return message.includes(slot.girl_name);
    });

    if (matchedSlots.length === 0) {
      // ㅌㄹㅅ 처리가 있었으면 성공 리턴
      if (transferResults.length > 0) {
        return NextResponse.json({ success: true, matched: 0, transfers: transferResults, logId, message: '방이동 처리 완료' });
      }
      return NextResponse.json({ success: true, matched: 0, logId, message: hasRoomNumber ? '메시지 저장 완료 (매칭 아가씨 없음)' : '매칭된 아가씨 없음' });
    }

    // 결과 처리
    const results = [];

    for (const slot of matchedSlots) {
      // ====================================================
      // status_board 테이블 처리
      // 같은 아가씨가 여러 줄에 나올 수 있음 (예: 종료 + 새 시작)
      // 각 줄을 별도로 파싱하여 순차 처리
      // ====================================================

      // 같은 아가씨가 여러 줄에 나오는지 확인
      const lines = message.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

      // 각 줄의 유효 방번호 계산 (이전 줄에서 방번호 상속)
      // 예: "603 태산\n연시 미쭈 1.5ㄲ\n905 이승기\n파이 ㄴㄱㅅㅌㅌ"
      // → 줄0: 603, 줄1: 603(상속), 줄2: 905, 줄3: 905(상속)
      let lastSeenRoom: string | null = null;
      const lineEffectiveRooms: (string | null)[] = [];
      for (const line of lines) {
        const roomNum = extractRoomNumber(line);
        if (roomNum) lastSeenRoom = roomNum;
        lineEffectiveRooms.push(lastSeenRoom);
      }

      // 아가씨가 포함된 줄의 인덱스와 유효 방번호를 함께 추적
      const girlLineEntries = lines
        .map((line: string, idx: number) => ({ line, idx }))
        .filter(({ line }: { line: string }) => line.includes(slot.girl_name));

      // 원본 메시지 첫 줄이 ㅈㅈ/정정으로 시작하면, 전체 메시지가 정정
      const messageStartsWithCorrection = lines.length > 0 && (lines[0].startsWith('ㅈㅈ') || lines[0].startsWith('정정'));

      // 아가씨가 포함된 줄만 개별 처리 (줄바꿈 시 방번호가 다를 수 있으므로)
      const messagesToProcess = girlLineEntries.length > 0
        ? girlLineEntries.map(({ line, idx }: { line: string; idx: number }) => ({ line, effectiveRoom: lineEffectiveRooms[idx] }))
        : [{ line: message, effectiveRoom: parsed.roomNumber }];

      console.log('Processing', messagesToProcess.length, 'line(s) for', slot.girl_name);

      // 핸들러 컨텍스트 생성
      const ctx: HandlerContext = { supabase, slot, receivedAt: messageReceivedAt, logId, keepAliveRooms, sourceRoom: room };

      for (const { line: lineMsg, effectiveRoom } of messagesToProcess) {
        const lineParsed = parseMessage(lineMsg, girlNames);
        const lineSignals = parseGirlSignals(lineMsg, slot.girl_name, girlNames);

        // 줄에 방번호가 없으면 가장 가까운 이전 줄의 방번호를 상속
        // 예: "603 태산\n연시 미쭈 1.5ㄲ" → 미쭈 줄에 방번호 없음 → 603 상속
        // 예: "603 태산\n905 이승기\n파이 ㄴㄱ" → 파이 줄에 방번호 없음 → 905 상속
        if (!lineParsed.roomNumber && effectiveRoom) {
          lineParsed.roomNumber = effectiveRoom;
        }

        // 원본 메시지 첫 줄이 ㅈㅈ로 시작했으면, ㄲ이 있는 아가씨에게만 정정 적용
        // ㄲ이 없는 아가씨는 새 시작일 수 있으므로 정정을 적용하지 않음
        if (messageStartsWithCorrection && lineSignals.isEnd) {
          lineSignals.isCorrection = true;
        }

        // 우선순위:
        // 0. ㄱㅌ(취소) → trigger_type을 'canceled'로 변경
        // 1. ㅎㅅㄱㅈㅈㅎ/현시간재진행 → 새 세션 INSERT
        // 2. ㅈㅈㅎ/재진행 → 가장 최근 종료 레코드를 시작으로 UPDATE
        // 3. ㄲ(종료) → 세션 종료 처리
        // 4. 방번호만 → 세션 시작 처리

        if (lineSignals.isCancel) {
          const result = await handleCancel(ctx, lineParsed.roomNumber);
          results.push({ ...result, logId });

        } else if (lineSignals.isNewSession && lineParsed.roomNumber) {
          const result = await handleNewSession(ctx, lineParsed, lineSignals);
          results.push({ ...result, logId });

        } else if (lineSignals.isResume) {
          const result = await handleResume(ctx);
          results.push({ ...result, logId });

        } else if (lineSignals.isEnd && lineParsed.roomNumber) {
          const result = await handleSessionEnd(ctx, lineParsed, lineSignals);
          results.push({ ...result, logId });

        } else if (lineSignals.isCorrection && lineParsed.roomNumber) {
          const result = await handleCorrectionWithTime(ctx, lineMsg, lineParsed.roomNumber);
          results.push({ ...result, logId });

        } else if (messageStartsWithCorrection && lineParsed.roomNumber) {
          const result = await handleCorrectionCatchAll(ctx, lineMsg, lineParsed, lineSignals);
          results.push({ ...result, logId });

        } else if (lineParsed.roomNumber && !lineSignals.isEnd && !lineSignals.isExtension && !lineSignals.isDesignatedFee && !lineSignals.isDesignatedHalfFee && !lineSignals.isCorrection) {
          const result = await handleSessionStart(ctx, lineParsed, lineSignals);
          results.push({ ...result, logId });

        } else {
          results.push({
            type: 'message',
            logId,
            slotId: slot.id,
            girlName: slot.girl_name,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      matched: results.length,
      transfers: transferResults.length > 0 ? transferResults : undefined,
      parsed: {
        roomNumber: parsed.roomNumber,
        isEnd: parsed.isEnd,
        isCorrection: parsed.isCorrection,
        usageDuration: parsed.usageDuration,
      },
      results,
    });

  } catch (error) {
    console.error('Bot message error:', error);
    return NextResponse.json({
      error: '서버 오류',
      detail: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
