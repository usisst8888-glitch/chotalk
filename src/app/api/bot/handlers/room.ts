import { getSupabase } from '@/lib/supabase';
import { extractRoomNumber, parseTransfer } from '@/lib/message-parser';
import { MESSAGE_SIGNALS, hasSignalWithAliases } from '@/lib/ticket-config';
import { checkAndCloseRoom, getKoreanTime } from './shared';

// ============================================================
// 방(Room) 관련 핸들러 (status_board 세션 이동 + keepAliveRooms)
// rooms 테이블 생성은 /api/bot/room에서 독립 처리
// ============================================================

// ============================================================
// keepAliveRooms 구성: 미등록 아가씨의 ㅇㅈ/ㅈㅈㅎ 감지
// 해당 방은 checkAndCloseRoom에서 닫지 않음
// ============================================================

export function buildKeepAliveRooms(
  lines: string[],
  girlNames: string[]
): Set<string> {
  const keepAliveRooms = new Set<string>();
  let lastSeenRoom: string | null = null;

  for (const line of lines) {
    const roomNum = extractRoomNumber(line);
    if (roomNum) lastSeenRoom = roomNum;
    const effectiveRoom = roomNum || lastSeenRoom;

    if (!effectiveRoom) continue;

    // ㅇㅈ(연장) 또는 ㅈㅈㅎ(재진행) 신호가 있는지 확인
    const hasExtension = line.includes(MESSAGE_SIGNALS.EXTENSION.code);
    const hasResume = hasSignalWithAliases(line, MESSAGE_SIGNALS.RESUME);

    if (hasExtension || hasResume) {
      // 이 줄에 등록된 아가씨가 없으면 → 미등록 아가씨의 신호
      const lineHasRegisteredGirl = girlNames.some(name => line.includes(name));
      if (!lineHasRegisteredGirl) {
        keepAliveRooms.add(effectiveRoom);
      }
    }
  }

  if (keepAliveRooms.size > 0) {
    console.log('keepAliveRooms:', [...keepAliveRooms]);
  }

  return keepAliveRooms;
}

// ============================================================
// ㅌㄹㅅ(방이동) 처리 - status_board 세션 이동만 담당
// fromRoom의 모든 활성 세션을 toRoom으로 이동 (시간 유지!)
// rooms 테이블 생성은 /api/bot/room에서 독립 처리
// ============================================================

export interface TransferHandlerResult {
  type: 'transfer';
  fromRoom: string;
  toRoom: string;
  movedSessions: number;
}

export async function handleTransfer(
  supabase: ReturnType<typeof getSupabase>,
  fromRoom: string,
  toRoom: string,
  shopName: string | null,
): Promise<TransferHandlerResult> {
  console.log('handleTransfer:', fromRoom, '→', toRoom, 'shop:', shopName);

  // 1. fromRoom의 모든 활성 세션 → toRoom으로 이동 (start_time 유지!)
  const { data: movedRecords, error: updateError } = await supabase
    .from('status_board')
    .update({
      room_number: toRoom,
      updated_at: getKoreanTime(),
      data_changed: true,
    })
    .eq('room_number', fromRoom)
    .eq('shop_name', shopName || '')
    .eq('is_in_progress', true)
    .select('id');

  if (updateError) {
    console.error('Transfer update error:', updateError);
  }

  const movedCount = movedRecords?.length || 0;
  console.log('Transfer moved', movedCount, 'sessions from', fromRoom, 'to', toRoom);

  // 2. 이전 방 닫기 (남은 세션 없으므로)
  await checkAndCloseRoom(supabase, fromRoom, shopName);

  return {
    type: 'transfer',
    fromRoom,
    toRoom,
    movedSessions: movedCount,
  };
}

// ============================================================
// ㅌㄹㅅ 감지 + 일괄 처리
// ============================================================

export async function processTransfers(
  supabase: ReturnType<typeof getSupabase>,
  lines: string[],
  shopName: string | null,
): Promise<TransferHandlerResult[]> {
  const results: TransferHandlerResult[] = [];

  for (const line of lines) {
    const transfer = parseTransfer(line);
    if (transfer) {
      const result = await handleTransfer(
        supabase, transfer.fromRoom, transfer.toRoom, shopName,
      );
      results.push(result);
    }
  }

  return results;
}
