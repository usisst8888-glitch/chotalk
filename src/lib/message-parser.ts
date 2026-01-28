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
 * 예: "1ㄲ" → 1, "1.5ㄲ" → 1.5, "2.5 ㄲ" → 2.5
 */
export function extractUsageDuration(message: string): number | null {
  // 패턴: 숫자(소수점 포함) + 공백(선택) + ㄲ
  const match = message.match(/(\d+(?:\.\d+)?)\s*ㄲ/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
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
    usageDuration: null,
  };

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

  // 해당 아가씨에게 해당하는 부분만 추출
  const girlSection = afterGirl.substring(0, nextGirlIndex);

  // ㄲ (종료) 신호 확인
  if (hasSignal(girlSection, MESSAGE_SIGNALS.END.code)) {
    result.isEnd = true;
    // 이용시간 추출 (ㄲ 앞의 숫자)
    const match = girlSection.match(/(\d+(?:\.\d+)?)\s*ㄲ/);
    if (match) {
      result.usageDuration = parseFloat(match[1]);
    }
  }

  // ㅈㅈ (수정) 신호 확인
  if (hasSignal(girlSection, MESSAGE_SIGNALS.CORRECTION.code)) {
    result.isCorrection = true;
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
