// 메시지 파싱 유틸리티
// 설정은 ticket-config.ts에서 관리합니다.
//
// 메시지 형식 예시: "703 이승기 도아 ㅃ2"
// - 703 = 방 번호
// - 이승기 = 담당자 이름
// - 도아 = 아가씨 이름 (트리거)
// - ㅃ2 = 차비 정보
// - ㄲ = 종료 신호

import {
  MESSAGE_SIGNALS,
  PARSING_PATTERNS,
  hasSignal,
  extractFare,
} from './ticket-config';

// ============================================================
// 파싱 결과 타입
// ============================================================

export interface ParsedMessage {
  roomNumber: string | null;       // 방 번호
  managerName: string | null;      // 담당자 이름
  girlName: string | null;         // 아가씨 이름 (매칭된)
  isEnd: boolean;                  // ㄲ이 포함되어 있으면 종료
  fareInfo: string | null;         // 차비 정보 (ㅃ 뒤의 숫자)
  fareAmount: number;              // 차비 금액
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
 * 차비 정보 추출 (ㅃ 뒤의 숫자)
 */
export function extractFareInfo(message: string): { fareInfo: string | null; fareAmount: number } {
  const result = extractFare(message);
  if (result.hasFare) {
    return {
      fareInfo: `ㅃ${result.amount}`,
      fareAmount: result.amount,
    };
  }
  return { fareInfo: null, fareAmount: 0 };
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
  const { fareInfo, fareAmount } = extractFareInfo(message);
  const signals = checkAllSignals(message);

  return {
    roomNumber,
    managerName,
    girlName,
    isEnd,
    fareInfo,
    fareAmount,
    rawMessage: message,
    signals,
  };
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
  if (parsed.fareAmount > 0) parts.push(`차비: ${parsed.fareAmount}`);

  return parts.join(' | ');
}
