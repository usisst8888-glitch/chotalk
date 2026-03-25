/**
 * 공지방 메시지에서 방번호별 웨이터(두 번째 2글자 한글 이름) 추출
 *
 * 메시지 형식 예시:
 * "102 기철 2 욱현 ㄷㄱ" → room=102, waiter=욱현
 * "120 하준 ㅃ3 연준"   → room=120, waiter=연준
 * "502 우빈 2응구"      → room=502, waiter=응구
 *
 * 규칙: 3자리 방번호 + 두 번째 2글자 한글 이름 = 웨이터
 */

export interface WaiterAssignment {
  roomNumber: string;
  waiterName: string;
}

export function parseWaiterMessage(message: string): WaiterAssignment[] {
  const lines = message.split('\n');
  const assignments: WaiterAssignment[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 구분선, ㅈ.ㅁ, ㄴ.ㄱ 등 무의미한 라인 스킵
    if (/^➖/.test(line)) continue;
    if (/^ㅈ\.ㅁ$/.test(line)) continue;
    if (/^ㄴ\.ㄱ$/.test(line)) continue;

    // 3자리 방번호로 시작하는 라인만 처리
    const roomMatch = line.match(/^(\d{3})(?!\d)/);
    if (!roomMatch) continue;

    const roomNumber = roomMatch[1];

    // 방번호 이후 텍스트에서 정확히 2글자 한글 이름 추출
    const afterRoom = line.substring(roomMatch[0].length);
    const names = afterRoom.match(/(?<![가-힣])[가-힣]{2}(?![가-힣])/g);

    // 두 번째 2글자 한글 이름이 웨이터
    if (names && names.length >= 2) {
      assignments.push({
        roomNumber,
        waiterName: names[1],
      });
    }
  }

  return assignments;
}
