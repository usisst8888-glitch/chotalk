/**
 * 가게명 방 메시지에서 방번호별 웨이터(두 번째 2글자 한글 이름) 추출
 *
 * 메시지 형식 예시:
 * "108 동훈 ㅃ2 철주"     → room=108, waiter=철주
 * "120 하준 ㅃ3 연준"     → room=120, waiter=연준
 * "502 우빈 2 응구"       → room=502, waiter=응구
 * "107 승주 4 순돌a ㄷㄱ" → room=107, waiter=순돌
 *
 * 규칙: 3자리 방번호 + 두 번째 2글자 한글 이름 = 웨이터
 * ㄴ.ㄱ / ㅈ.ㅁ 섹션 이후는 무시
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

    // ㄴ.ㄱ 또는 ㅈ.ㅁ 섹션 도달하면 파싱 중단
    if (/ㄴ\.?ㄱ/.test(line) || /ㅈ\.?ㅁ/.test(line)) break;

    // 구분선 스킵
    if (/^➖/.test(line)) continue;

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
