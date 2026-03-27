/**
 * 가게명 방 메시지에서 방번호별 웨이터(마지막 2글자 한글 이름) 추출
 *
 * [일반 배정]
 * "108 동훈 ㅃ2 철주"        → room=108, waiter=철주
 * "910 장서방 ㅃ1  명태"     → room=910, waiter=명태 (담당자 3글자)
 * "108 강 ㅃ2 철주"          → room=108, waiter=철주 (담당자 1글자)
 *
 * [ㅌㄹㅅ - 웨이터 이동]
 * "120 망나 119 ㅌㄹㅅ"      → 망나가 119방으로 이동 (웨이터 있음 → upsert)
 * "118 지효 ㅌㄹㅅ 110"      → 지효가 110방으로 이동 (웨이터 있음 → upsert)
 * "221 ㅌㄹㅅ 218"           → 221방 레코드의 방번호를 218로 변경 (웨이터 없음 → room 업데이트)
 *
 * 규칙:
 * - 정확히 3자리 방번호 (4자리 이상 제외)
 * - ㄴ.ㄱ / ㅈ.ㅁ 섹션 이후는 무시
 * - ㅌㄹㅅ취소는 무시
 */

export interface WaiterAssignment {
  roomNumber: string;
  waiterName: string;
}

export interface WaiterTransfer {
  fromRoom: string;
  toRoom: string;
  waiterName?: string; // 있으면 toRoom에 upsert, 없으면 fromRoom의 방번호를 toRoom으로 변경
}

export function parseWaiterMessage(message: string): WaiterAssignment[] {
  const lines = message.split('\n');
  const assignments: WaiterAssignment[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ㄴ.ㄱ 또는 ㅈ.ㅁ 섹션 도달하면 파싱 중단
    if (/ㄴ\.?ㄱ/.test(line) || /ㅈ\.?ㅁ/.test(line)) break;

    // ㅌㄹㅅ 라인은 별도 처리
    if (line.includes('ㅌㄹㅅ')) continue;

    // 구분선, 출근자 헤더 스킵
    if (/^➖/.test(line)) continue;
    if (/출\.?근\.?자/.test(line)) continue;

    // 정확히 3자리 방번호로 시작하는 라인만 처리 (4자리 이상 제외)
    const roomMatch = line.match(/^(\d{3})(?!\d)/);
    if (!roomMatch) continue;

    const roomNumber = roomMatch[1];
    const afterRoom = line.substring(roomMatch[0].length);

    // 모든 한글 이름 추출 (1글자 이상)
    const allNames = afterRoom.match(/(?<![가-힣])[가-힣]{1,}(?![가-힣])/g);

    // 한글 이름이 2개 이상 있어야 함 (담당자 + 웨이터)
    if (!allNames || allNames.length < 2) continue;

    // 마지막 2글자 한글 이름 = 웨이터
    const twoCharNames = allNames.filter(n => n.length === 2);
    if (twoCharNames.length === 0) continue;

    const waiterName = twoCharNames[twoCharNames.length - 1];

    assignments.push({ roomNumber, waiterName });
  }

  return assignments;
}

export function parseTransferMessage(message: string): WaiterTransfer[] {
  const lines = message.split('\n');
  const transfers: WaiterTransfer[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ㄴ.ㄱ 또는 ㅈ.ㅁ 섹션 도달하면 파싱 중단
    if (/ㄴ\.?ㄱ/.test(line) || /ㅈ\.?ㅁ/.test(line)) break;

    // ㅌㄹㅅ 없는 라인 스킵
    if (!line.includes('ㅌㄹㅅ')) continue;

    // 취소 스킵
    if (line.includes('ㅌㄹㅅ취소')) continue;

    // 3자리 방번호 모두 추출
    const roomMatches = [...line.matchAll(/(?<!\d)(\d{3})(?!\d)/g)];
    if (roomMatches.length < 2) continue;

    const fromRoom = roomMatches[0][1];
    const toRoom = roomMatches[roomMatches.length - 1][1];
    if (fromRoom === toRoom) continue;

    // fromRoom 끝 ~ 첫 번째 ㅌㄹㅅ 사이 텍스트에서 한글 이름 추출
    const fromRoomEnd = roomMatches[0].index! + fromRoom.length;
    const tlsIndex = line.indexOf('ㅌㄹㅅ', fromRoomEnd);
    const betweenText = tlsIndex > fromRoomEnd
      ? line.substring(fromRoomEnd, tlsIndex)
      : line.substring(fromRoomEnd);

    const nameMatches = betweenText.match(/(?<![가-힣])[가-힣]{2,}(?![가-힣])/g);

    if (nameMatches && nameMatches.length > 0) {
      transfers.push({ fromRoom, toRoom, waiterName: nameMatches[0] });
    } else {
      transfers.push({ fromRoom, toRoom });
    }
  }

  return transfers;
}
