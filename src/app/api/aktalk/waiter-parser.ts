/**
 * 가게명 방 메시지에서 방번호별 웨이터(마지막 2글자 한글 이름) 추출
 *
 * [일반 배정]
 * "108 동훈 ㅃ2 철주"        → room=108, waiter=철주
 * "910 장서방 ㅃ1  명태"     → room=910, waiter=명태 (담당자 3글자)
 * "108 강 ㅃ2 철주"          → room=108, waiter=철주 (담당자 1글자)
 *
 * [ㅌㄹㅅ - 웨이터 이동]
 * "120 담당자 119 ㅌㄹㅅ"          → 담당자 무시, 웨이터 없음 → 120방 레코드를 119로 변경
 * "221 ㅌㄹㅅ 218"                 → 웨이터 없음 → 221방 레코드를 218로 변경
 * "222 담당자 107 ㅌㄹㅅ 웨 알리"  → ㅌㄹㅅ 뒤 "웨 알리" → 107방에 알리 upsert
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
    // @ 이후는 무시, 트랜스→ㅌㄹㅅ 정규화
    const line = rawLine.split('@')[0].trim().replace(/트랜스/g, 'ㅌㄹㅅ');
    if (!line) continue;

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

/**
 * 인계 메시지 파싱
 * "215 인계웨 지니"              → room=215, waiter=지니
 * "106 113 118 127 인계 웨 순돌" → rooms=106,113,118,127, waiter=순돌
 * "201,3,7 인계웨 도일"          → rooms=201,203,207, waiter=도일
 * "125 태양 인계 웨 금보 -> 민동" → room=125, waiter=민동
 * "220우기명 인계웨 민동 입니다"  → room=220, waiter=민동
 */
export function parseHandoverMessage(message: string): WaiterAssignment[] {
  const lines = message.split('\n');
  const assignments: WaiterAssignment[] = [];

  for (const rawLine of lines) {
    const line = rawLine.split('@')[0].trim();
    if (!line) continue;

    // 인계 키워드 없으면 스킵
    if (!/인계/.test(line) && !/인수인계/.test(line)) continue;

    // "웨" 뒤에서 웨이터 이름 추출
    const weMatch = line.match(/웨\s*([가-힣]{2,})/);
    if (!weMatch) continue;

    let waiterName = weMatch[1];

    // "-> 이름" 패턴이 있으면 마지막 이름이 최종 웨이터
    const arrowMatch = line.match(/->\s*([가-힣]{2,})/);
    if (arrowMatch) {
      waiterName = arrowMatch[1];
    }

    // "입니다" 제거
    waiterName = waiterName.replace(/입니다$/, '');
    if (!waiterName) continue;

    // 방번호 추출: 콤마 축약 (201,3,7 → 201, 203, 207) 또는 공백 구분
    const beforeIngyae = line.split(/인수?인계/)[0];
    const rooms: string[] = [];

    // 콤마 축약 패턴: "201,3,7"
    const commaMatch = beforeIngyae.match(/(\d{3})((?:\s*,\s*\d{1,2})+)/);
    if (commaMatch) {
      const baseRoom = commaMatch[1];
      const prefix = baseRoom.substring(0, baseRoom.length - 1); // 앞 2자리
      rooms.push(baseRoom);
      const extras = commaMatch[2].match(/\d{1,2}/g);
      if (extras) {
        for (const ext of extras) {
          if (ext.length === 1) {
            rooms.push(prefix + ext);
          } else {
            rooms.push(baseRoom[0] + ext);
          }
        }
      }
    } else {
      // 공백 구분 3자리 방번호
      const roomMatches = beforeIngyae.match(/(?<!\d)\d{3}(?!\d)/g);
      if (roomMatches) {
        rooms.push(...roomMatches);
      }
    }

    if (rooms.length === 0) continue;

    for (const room of rooms) {
      assignments.push({ roomNumber: room, waiterName });
    }
  }

  return assignments;
}

export function parseTransferMessage(message: string): WaiterTransfer[] {
  const lines = message.split('\n');
  const transfers: WaiterTransfer[] = [];

  for (const rawLine of lines) {
    // @ 이후는 무시, 트랜스→ㅌㄹㅅ 정규화
    const line = rawLine.split('@')[0].trim().replace(/트랜스/g, 'ㅌㄹㅅ');
    if (!line) continue;

    // ㅌㄹㅅ 없는 라인 스킵
    if (!line.includes('ㅌㄹㅅ')) continue;

    // 취소 스킵
    if (line.includes('ㅌㄹㅅ취소')) continue;

    // 3자리 방번호 모두 추출
    const roomMatches = [...line.matchAll(/(?<!\d)(\d{3})(?!\d)/g)];
    if (roomMatches.length < 2) continue;

    const fromRoom = roomMatches[0][1];
    const lastMatch = roomMatches[roomMatches.length - 1];
    const toRoom = lastMatch[1];
    if (fromRoom === toRoom) continue;

    // 두 번째(마지막) 방번호 이후에서 "웨" 키워드 찾기
    // "웨 {웨이터이름}" 형식일 때만 웨이터 등록, 없으면 방번호만 변경
    const afterLastRoom = line.substring(lastMatch.index! + toRoom.length);
    const weIndex = afterLastRoom.search(/웨\s*/);

    if (weIndex !== -1) {
      const afterWe = afterLastRoom.substring(weIndex + 1).trim();
      const nameMatches = afterWe.match(/^(?<![가-힣])[가-힣]{2,}(?![가-힣])/);
      if (nameMatches) {
        transfers.push({ fromRoom, toRoom, waiterName: nameMatches[0] });
        continue;
      }
    }

    transfers.push({ fromRoom, toRoom });
  }

  return transfers;
}
