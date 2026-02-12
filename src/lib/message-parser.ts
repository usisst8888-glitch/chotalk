// 메시지 파싱 유틸리티
// 설정은 ticket-config.ts에서 관리합니다.
//
// 메시지 형식 예시: "703 이승기 도아 1.5ㄲ"
// - 703 = 방 번호
// - 이승기 = 담당자 이름
// - 도아 = 아가씨 이름 (트리거)
// - 1.5ㄲ = 종료 신호 + 이용시간
// - ㅈㅈ = 수정 신호

import {
  MESSAGE_SIGNALS,
  PARSING_PATTERNS,
  hasSignal,
  hasSignalWithAliases,
} from './ticket-config';

// ============================================================
// 파싱 결과 타입
// ============================================================

export interface ParsedMessage {
  roomNumber: string | null;       // 방 번호
  managerName: string | null;      // 담당자 이름
  girlName: string | null;         // 아가씨 이름 (매칭된)
  isEnd: boolean;                  // ㄲ이 포함되어 있으면 종료
  isCorrection: boolean;           // ㅈㅈ이 포함되어 있으면 수정
  usageDuration: number | null;    // 이용시간 (ㄲ 앞의 숫자, 분 단위)
  rawMessage: string;              // 원본 메시지
  // 확장용 필드 (새로운 신호 추가시)
  signals: {
    [key: string]: boolean;
  };
}

// ============================================================
// 방 번호 추출
// ============================================================

/**
 * 메시지에서 방 번호 추출
 * 숫자로 시작하는 패턴 (예: 703, 1205, 302호)
 */
export function extractRoomNumber(message: string): string | null {
  // 메시지 시작 부분에서 찾기
  const startMatch = message.match(PARSING_PATTERNS.ROOM_NUMBER.start);
  if (startMatch) {
    return startMatch[1];
  }

  // 메시지 중간에서 찾기
  const midMatch = message.match(PARSING_PATTERNS.ROOM_NUMBER.middle);
  if (midMatch) {
    return midMatch[1];
  }

  return null;
}

// ============================================================
// 신호 확인
// ============================================================

/**
 * 종료 신호(ㄲ) 확인
 */
export function isEndSignal(message: string): boolean {
  return hasSignal(message, MESSAGE_SIGNALS.END.code);
}

/**
 * 수정 신호(ㅈㅈ) 확인
 */
export function isCorrectionSignal(message: string): boolean {
  return hasSignal(message, MESSAGE_SIGNALS.CORRECTION.code);
}

/**
 * 이용시간 추출 (ㄲ 앞의 숫자)
 * 예: "1ㄲ" → 1, "1.5ㄲ" → 1.5, "2.5 ㄲ" → 2.5, "1ㄴㄱㄲ" → 1
 * 숫자와 ㄲ 사이에 다른 문자(날개 등)가 있어도 추출
 */
export function extractUsageDuration(message: string): number | null {
  // 패턴: 숫자(소수점 포함) + 임의의 문자(숫자 제외) + ㄲ
  const match = message.match(/(\d+(?:\.\d+)?)[^\d]*ㄲ/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * 메시지에서 수동 지정 시간 추출 및 가장 가까운 시간대 반환
 * 지원 포맷: 3시34분, 03시34분, 15시34분, 15:34, 03:34, 3:34,
 *           03시, 15시, 3시, 15.34, 03.34, 3.34
 *
 * @param message 메시지 내용
 * @param receivedAt 알림 받은 시간 (ISO string 또는 "YYYY-MM-DD HH:mm:ss" 형식)
 * @returns 가장 가까운 시간 (YYYY-MM-DD HH:mm:ss 형식) 또는 null
 */
export function extractManualTime(message: string, receivedAt: string, options?: { allowTwoDigit?: boolean }): string | null {
  // 시간 패턴들 (우선순위 순)
  const patterns: RegExp[] = [
    // 15시34분, 3시34분, 03시34분
    /(\d{1,2})시\s*(\d{1,2})분/,
    // 15:34, 3:34, 03:34
    /(\d{1,2}):(\d{2})/,
    // 15.34, 3.34, 03.34 (소수점 뒤 2자리만)
    /(\d{1,2})\.(\d{2})(?!\d)/,
    // 1603, 0935 (4자리 연속 HHMM, 방번호 3자리와 구분)
    /(?<!\d)(\d{2})(\d{2})(?!\d)/,
    // 15시, 3시, 03시 (분 없음 → 00분)
    /(\d{1,2})시(?!\s*\d)/,
    // 300, 951 (3자리 HMM: 1자리 시 + 2자리 분)
    /(?<!\d)(\d)(\d{2})(?!\d)/,
  ];

  // 1~2자리 시간 패턴 - ㅈㅈ 시작시간 수정에서만 사용
  // (ㄲ이 없는 컨텍스트에서만 안전, usageDuration 혼동 방지)
  // 03 → 03:00, 3 → 3:00 (또는 15:00)
  if (options?.allowTwoDigit) {
    patterns.push(/(?<!\d)(\d{2})(?!\d)/);  // 03 → 03:00
    patterns.push(/(?<!\d)(\d)(?!\d)/);     // 3 → 3:00
  }

  let hour: number | null = null;
  let minute: number = 0;

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = match[2] ? parseInt(match[2], 10) : 0;
      break;
    }
  }

  if (hour === null || hour > 23 || minute > 59) {
    return null;
  }

  // receivedAt 파싱
  const receivedDate = new Date(receivedAt.replace(' ', 'T'));
  if (isNaN(receivedDate.getTime())) {
    return null;
  }

  // 24시간제인 경우 (hour >= 13) 그대로 사용
  if (hour >= 13) {
    const result = new Date(receivedDate);
    result.setHours(hour, minute, 0, 0);
    return formatTimeString(result);
  }

  // 12시간제 애매함 처리: hour vs hour+12 중 가까운 것 선택
  const receivedHour = receivedDate.getHours();
  const receivedMinute = receivedDate.getMinutes();
  const receivedTotalMinutes = receivedHour * 60 + receivedMinute;

  const option1Minutes = hour * 60 + minute;           // AM (예: 03:34)
  const option2Minutes = (hour + 12) * 60 + minute;    // PM (예: 15:34)

  // 각 옵션과 receivedAt의 차이 계산 (하루 경계 고려)
  const diff1 = Math.min(
    Math.abs(option1Minutes - receivedTotalMinutes),
    1440 - Math.abs(option1Minutes - receivedTotalMinutes)
  );
  const diff2 = Math.min(
    Math.abs(option2Minutes - receivedTotalMinutes),
    1440 - Math.abs(option2Minutes - receivedTotalMinutes)
  );

  const selectedHour = diff1 <= diff2 ? hour : hour + 12;

  const result = new Date(receivedDate);
  result.setHours(selectedHour, minute, 0, 0);
  return formatTimeString(result);
}

/**
 * Date를 시간 문자열로 변환 (YYYY-MM-DD HH:mm:ss)
 */
function formatTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 모든 신호 확인 (확장용)
 */
export function checkAllSignals(message: string): { [key: string]: boolean } {
  const signals: { [key: string]: boolean } = {};

  for (const [key, signal] of Object.entries(MESSAGE_SIGNALS)) {
    if ('code' in signal) {
      signals[key.toLowerCase()] = hasSignal(message, signal.code);
    }
  }

  return signals;
}

// ============================================================
// 이름 추출
// ============================================================

/**
 * 메시지에서 아가씨 이름 찾기 (슬롯 목록과 매칭)
 */
export function findGirlName(message: string, girlNames: string[]): string | null {
  for (const name of girlNames) {
    if (message.includes(name)) {
      return name;
    }
  }
  return null;
}

/**
 * 담당자 이름 추출 (방번호와 아가씨 이름 사이)
 *
 * 메시지 구조: "703 이승기 도아 ㅃ2"
 *              ^^^방번호  ^^^^담당자 ^^아가씨
 */
export function extractManagerName(
  message: string,
  roomNumber: string | null,
  girlName: string | null
): string | null {
  if (!roomNumber || !girlName) return null;

  // 방 번호 다음, 아가씨 이름 전까지의 텍스트
  const roomPattern = new RegExp(`${roomNumber}\\s*호?\\s*`);
  const afterRoom = message.replace(roomPattern, '');

  const girlIndex = afterRoom.indexOf(girlName);
  if (girlIndex > 0) {
    const managerPart = afterRoom.substring(0, girlIndex).trim();
    // 공백으로 구분된 첫 번째 단어가 담당자 이름
    const words = managerPart.split(/\s+/);
    if (words.length > 0 && words[0]) {
      return words[0];
    }
  }

  return null;
}

// ============================================================
// 전체 메시지 파싱
// ============================================================

/**
 * 전체 메시지 파싱
 *
 * @param message 원본 메시지
 * @param girlNames 활성화된 아가씨 이름 목록
 * @returns 파싱된 메시지 정보
 *
 * @example
 * parseMessage("703 이승기 도아 ㅃ2", ["도아", "미나"])
 * // → { roomNumber: "703", managerName: "이승기", girlName: "도아", fareAmount: 2, ... }
 */
export function parseMessage(message: string, girlNames: string[]): ParsedMessage {
  const roomNumber = extractRoomNumber(message);
  const girlName = findGirlName(message, girlNames);
  const managerName = extractManagerName(message, roomNumber, girlName);
  const isEnd = isEndSignal(message);
  const isCorrection = isCorrectionSignal(message);
  const usageDuration = isEnd ? extractUsageDuration(message) : null;
  const signals = checkAllSignals(message);

  return {
    roomNumber,
    managerName,
    girlName,
    isEnd,
    isCorrection,
    usageDuration,
    rawMessage: message,
    signals,
  };
}

// ============================================================
// 아가씨별 신호 파싱
// ============================================================

export interface GirlSignalResult {
  girlName: string;
  isEnd: boolean;                  // 해당 아가씨 뒤에 ㄲ이 있는지
  isCorrection: boolean;           // 해당 아가씨 뒤에 ㅈㅈ이 있는지
  isResume: boolean;               // 해당 아가씨 뒤에 ㅈㅈㅎ/재진행이 있는지
  isNewSession: boolean;           // 해당 아가씨 뒤에 ㅎㅅㄱㅈㅈㅎ/현시간재진행이 있는지
  isDesignated: boolean;           // 해당 아가씨 뒤에 ㅈㅁ(지명)이 있는지
  isCancel: boolean;               // 해당 아가씨 뒤에 ㄱㅌ(취소)이 있는지
  isExtension: boolean;            // 해당 아가씨 뒤에 ㅇㅈ(연장)이 있는지
  isDesignatedFee: boolean;        // 해당 아가씨 뒤에 ㅈㅁㅅㅅ(지명순번삭제)이 있는지
  isDesignatedHalfFee: boolean;    // 해당 아가씨 뒤에 ㅈㅁㅂㅅㅅ(지명반순번삭제)이 있는지
  usageDuration: number | null;    // 해당 아가씨의 이용시간 (ㄲ 앞 숫자)
}

/**
 * 특정 아가씨 이름 뒤에 오는 신호 파싱
 *
 * @example
 * parseGirlSignals("103 이승기 채빈 영미 2ㅇㅈ 라율 1ㄲ", "라율", ["채빈", "영미", "라율"])
 * // → { girlName: "라율", isEnd: true, isCorrection: false, usageDuration: 1 }
 */
export function parseGirlSignals(
  message: string,
  targetGirlName: string,
  allGirlNames: string[]
): GirlSignalResult {
  const result: GirlSignalResult = {
    girlName: targetGirlName,
    isEnd: false,
    isCorrection: false,
    isResume: false,
    isNewSession: false,
    isDesignated: false,
    isCancel: false,
    isExtension: false,
    isDesignatedFee: false,
    isDesignatedHalfFee: false,
    usageDuration: null,
  };

  // ㅈㅈ(수정)는 메시지 맨 앞에 prefix로 올 수 있음
  if (message.startsWith(MESSAGE_SIGNALS.CORRECTION.code)) {
    result.isCorrection = true;
  }

  // 해당 아가씨 이름의 위치 찾기
  const girlIndex = message.indexOf(targetGirlName);
  if (girlIndex === -1) {
    return result;
  }

  // 아가씨 이름 뒤의 텍스트 추출
  const afterGirl = message.substring(girlIndex + targetGirlName.length);

  // 다음 아가씨 이름이 나오는 위치 찾기 (해당 아가씨의 신호 범위 결정)
  let nextGirlIndex = afterGirl.length;
  for (const otherGirl of allGirlNames) {
    if (otherGirl === targetGirlName) continue;
    const idx = afterGirl.indexOf(otherGirl);
    if (idx !== -1 && idx < nextGirlIndex) {
      nextGirlIndex = idx;
    }
  }

  // 해당 아가씨에게 해당하는 부분만 추출 (이름 뒤)
  const afterSection = afterGirl.substring(0, nextGirlIndex);

  // 아가씨 이름 앞의 텍스트도 확인 (이름에 직접 붙은 신호 감지)
  // 이전 아가씨 이름이 끝나는 위치부터 현재 아가씨 이름 시작까지
  let prevGirlEndIndex = 0;
  for (const otherGirl of allGirlNames) {
    if (otherGirl === targetGirlName) continue;
    const idx = message.indexOf(otherGirl);
    if (idx !== -1 && idx < girlIndex) {
      const endIdx = idx + otherGirl.length;
      if (endIdx > prevGirlEndIndex) {
        prevGirlEndIndex = endIdx;
      }
    }
  }
  const beforeSection = message.substring(prevGirlEndIndex, girlIndex);

  // 신호 감지는 afterSection(아가씨 이름 뒤~다음 아가씨 이름 전)만 사용
  // beforeSection을 포함하면 앞 아가씨의 신호가 현재 아가씨에게 오염됨
  // 예: "한채2ㅇㅈ 달래 1ㄲ" → beforeSection에 ㅇㅈ이 포함되어 달래의 ㄲ이 차단되는 버그

  // ㄱㅌ (취소) 신호 확인 - 가장 먼저 체크 (세션 삭제)
  if (hasSignal(afterSection, MESSAGE_SIGNALS.CANCEL.code)) {
    result.isCancel = true;
    // 취소면 다른 신호는 무시
    return result;
  }

  // ㅎㅅㄱㅈㅈㅎ/현시간재진행 (새 세션) 신호 확인 - 가장 긴 패턴
  if (hasSignalWithAliases(afterSection, MESSAGE_SIGNALS.NEW_SESSION)) {
    result.isNewSession = true;
    // 새 세션이면 다른 신호는 무시
    return result;
  }

  // ㅈㅈㅎ/재진행 (재개) 신호 확인 - ㅈㅈ보다 먼저 체크 (더 긴 패턴)
  if (hasSignalWithAliases(afterSection, MESSAGE_SIGNALS.RESUME)) {
    result.isResume = true;
    // 재진행이면 ㅈㅈ은 무시
    return result;
  }

  // ㄲ (종료) 신호 확인
  // - 아가씨 구간 또는 메시지 전체에 ㄲ이 있으면 종료 후보
  // - 단, ㅇㅈ(연장)/ㅈㅁㅅㅅ(지명순번삭제) 신호가 구간에 있으면 종료가 아님
  // - 이용시간은 항상 아가씨 이름 바로 뒤 첫 번째 숫자
  const hasEndInSection = hasSignal(afterSection, MESSAGE_SIGNALS.END.code);
  const hasEndInMessage = hasSignal(message, MESSAGE_SIGNALS.END.code);
  const hasExtension = hasSignal(afterSection, MESSAGE_SIGNALS.EXTENSION.code);
  const hasDesignatedFee = hasSignal(afterSection, MESSAGE_SIGNALS.DESIGNATED_FEE.code);
  const hasDesignatedHalfFee = hasSignal(afterSection, MESSAGE_SIGNALS.DESIGNATED_HALF_FEE.code);

  if ((hasEndInSection || hasEndInMessage) && !hasExtension && !hasDesignatedFee && !hasDesignatedHalfFee) {
    result.isEnd = true;
    // ㄲ 바로 앞의 숫자를 추출 (예: "3시 ㄱㅈ 1.5 ㄲ" → 1.5, "3시"의 3이 아님)
    const match = afterSection.match(/(\d+(?:\.\d+)?)[^\d]*ㄲ/);
    if (match) {
      result.usageDuration = parseFloat(match[1]);
    }
  }

  // ㅈㅈ (수정) 신호 확인
  if (hasSignal(afterSection, MESSAGE_SIGNALS.CORRECTION.code)) {
    result.isCorrection = true;
  }

  // ㅈㅁㅂㅅㅅ (지명반순번삭제) 신호 확인 - ㅈㅁㅅㅅ/ㅈㅁ보다 먼저 체크! (가장 긴 패턴)
  if (hasSignal(afterSection, MESSAGE_SIGNALS.DESIGNATED_HALF_FEE.code)) {
    result.isDesignatedHalfFee = true;
  }

  // ㅈㅁㅅㅅ (지명순번삭제) 신호 확인 - ㅈㅁ보다 먼저 체크! (시작으로 잡으면 안 됨)
  if (!result.isDesignatedHalfFee && hasSignal(afterSection, MESSAGE_SIGNALS.DESIGNATED_FEE.code)) {
    result.isDesignatedFee = true;
  }

  // ㅈㅁ (지명) 신호 확인 - ㅈㅁㅅㅅ(순번삭제)/ㅈㅁㅂㅅㅅ(반순번삭제)가 아닐 때만
  if (!result.isDesignatedFee && !result.isDesignatedHalfFee && hasSignal(afterSection, MESSAGE_SIGNALS.DESIGNATED.code)) {
    result.isDesignated = true;
  }

  // ㅇㅈ (연장) 신호 확인 - 시작으로 잡으면 안 됨
  if (hasSignal(afterSection, MESSAGE_SIGNALS.EXTENSION.code)) {
    result.isExtension = true;
  }

  return result;
}

// ============================================================
// 디버깅용 헬퍼
// ============================================================

/**
 * 파싱 결과를 읽기 쉬운 문자열로 변환
 */
export function formatParsedMessage(parsed: ParsedMessage): string {
  const parts = [];

  if (parsed.roomNumber) parts.push(`방: ${parsed.roomNumber}`);
  if (parsed.managerName) parts.push(`담당자: ${parsed.managerName}`);
  if (parsed.girlName) parts.push(`아가씨: ${parsed.girlName}`);
  if (parsed.isEnd) parts.push('종료');
  if (parsed.isCorrection) parts.push('수정');
  if (parsed.usageDuration) parts.push(`이용시간: ${parsed.usageDuration}`);

  return parts.join(' | ');
}

// ============================================================
// ㅈㅁ(지명) 섹션 파싱
// ============================================================

export interface DesignatedNoticeEntry {
  girlName: string;         // 점 제거된 아가씨 이름 (유라)
}

/**
 * 게시판 메시지에서 ㅈ.ㅁ 섹션을 파싱하여 지명된 아가씨 목록 반환
 *
 * 메시지 예시:
 * ➖➖➖➖ㅈ.ㅁ➖➖➖➖
 * 동.생 ㅡ 유.라
 * 하.유호 ㅡ 주.은 4.03
 *
 * → [{ girlName: "유라" }, { girlName: "주은" }]
 */
export function parseDesignatedSection(message: string): DesignatedNoticeEntry[] {
  const lines = message.split('\n');

  // ➖ 와 ㅈ.ㅁ 를 포함하는 구분선 찾기
  const dividerPattern = /➖+\s*ㅈ\.?ㅁ\s*➖+/;
  const dividerIndex = lines.findIndex(line => dividerPattern.test(line));

  if (dividerIndex === -1) {
    return [];
  }

  const results: DesignatedNoticeEntry[] = [];

  // 구분선 이후 줄들을 순회
  for (let i = dividerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // ㅡ (U+3161) 또는 - (하이픈) 로 분리
    const parts = line.split(/[ㅡ\-]/);
    if (parts.length < 2) continue;

    // 오른쪽: 점 제거 후 공백으로 분리 → 각각이 아가씨 이름 (숫자는 룸번호이므로 제외)
    const rightRaw = parts.slice(1).join('').replace(/\./g, '').trim();
    if (!rightRaw) continue;

    // 공백으로 분리하여 각 토큰 처리 (예: "검지 예서 403" → ["검지", "예서"])
    // 같은 이름이 여러 줄에 나오면 각각 별도 세션
    const tokens = rightRaw.split(/\s+/).filter(t => t && !/^\d+$/.test(t));
    for (const girlName of tokens) {
      results.push({ girlName });
    }
  }

  return results;
}
