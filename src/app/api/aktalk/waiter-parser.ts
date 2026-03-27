/**
 * 가게명 방 메시지에서 방번호별 웨이터(마지막 2글자 한글 이름) 추출
 *
 * 메시지 형식 예시:
 * "108 동훈 ㅃ2 철주"        → room=108, waiter=철주
 * "120 하준 ㅃ3 연준"        → room=120, waiter=연준
 * "502 우빈 2 응구"          → room=502, waiter=응구
 * "910 장서방 ㅃ1  명태"     → room=910, waiter=명태 (담당자 3글자)
 * "907 지효린 2 명태 ㄷㄱ"   → room=907, waiter=명태 (담당자 3글자)
 * "902 정부장 ㅃ1 명태ㄷㅊ"  → room=902, waiter=명태 (자음 붙어있어도 OK)
 * "108 강 ㅃ2 철주"          → room=108, waiter=철주 (담당자 1글자)
 *
 * 규칙:
 * - 정확히 3자리 방번호 (4자리 이상 제외)
 * - 한글 이름(1글자 이상)이 2개 이상 있어야 함 (담당자 + 웨이터)
 * - 마지막 2글자 한글 이름 = 웨이터
 * - ㄴ.ㄱ / ㅈ.ㅁ 섹션 이후는 무시
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

    assignments.push({
      roomNumber,
      waiterName,
    });
  }

  return assignments;
}
