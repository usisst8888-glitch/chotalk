// 티켓 계산 및 메시지 파싱 설정
// 새로운 조건을 추가하려면 이 파일만 수정하면 됩니다.

// ============================================================
// 1. 티켓 계산 규칙 (시간 범위별)
// ============================================================
export interface TicketRule {
  name: string;           // 규칙 이름 (로깅용)
  minMinutes: number;     // 최소 시간 (포함)
  maxMinutes: number;     // 최대 시간 (포함)
  halfTickets: number;    // 반티 개수
  fullTickets: number;    // 완티 개수
  isFree: boolean;        // 무료 여부
}

export const TICKET_RULES: TicketRule[] = [
  {
    name: '무료',
    minMinutes: 1,
    maxMinutes: 10,
    halfTickets: 0,
    fullTickets: 0,
    isFree: true,
  },
  {
    name: '반티',
    minMinutes: 11,
    maxMinutes: 30,
    halfTickets: 0.5,
    fullTickets: 0,
    isFree: false,
  },
  {
    name: '완티',
    minMinutes: 31,
    maxMinutes: 60,
    halfTickets: 0,
    fullTickets: 1,
    isFree: false,
  },
  // 새로운 규칙 추가 예시:
  // {
  //   name: '완티반',
  //   minMinutes: 61,
  //   maxMinutes: 90,
  //   halfTickets: 0.5,
  //   fullTickets: 1,
  //   isFree: false,
  // },
];

// ============================================================
// 2. 메시지 신호 (트리거)
// ============================================================
export interface MessageSignal {
  code: string;           // 신호 코드 (예: 'ㄲ')
  type: string;           // 신호 타입
  description: string;    // 설명
}

export const MESSAGE_SIGNALS = {
  // 세션 종료 신호
  END: {
    code: 'ㄲ',
    type: 'end',
    description: '세션 종료',
  },

  // 수정 신호
  CORRECTION: {
    code: 'ㅈㅈ',
    type: 'correction',
    description: '수정 (방번호 또는 이용시간 변경)',
  },

  // 추가 신호 예시:
  // EXTENSION: {
  //   code: 'ㅇㅈ',
  //   type: 'extension',
  //   description: '연장',
  // },
  // CANCEL: {
  //   code: 'ㅊㅅ',
  //   type: 'cancel',
  //   description: '취소',
  // },
} as const;

// ============================================================
// 3. 메시지 파싱 패턴
// ============================================================
export const PARSING_PATTERNS = {
  // 방 번호 패턴 (숫자로 시작, 호 옵션)
  ROOM_NUMBER: {
    start: /^(\d+)\s*호?\s*/,           // 메시지 시작 부분
    middle: /(\d{3,4})\s*호?\s/,        // 메시지 중간
  },

  // 시간 패턴
  TIME: /(\d{1,2}):(\d{2})/,
};

// ============================================================
// 5. 숫자 이모지 매핑
// ============================================================
export const NUMBER_EMOJIS = [
  '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣',
  '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
];

// ============================================================
// 헬퍼 함수들
// ============================================================

/**
 * 시간(분)에 해당하는 티켓 규칙 찾기
 */
export function findTicketRule(durationMinutes: number): TicketRule | null {
  // 정확히 매칭되는 규칙 찾기
  for (const rule of TICKET_RULES) {
    if (durationMinutes >= rule.minMinutes && durationMinutes <= rule.maxMinutes) {
      return rule;
    }
  }

  // 60분 초과시 마지막 규칙(완티) 기준으로 계산
  if (durationMinutes > 60) {
    return TICKET_RULES[TICKET_RULES.length - 1];
  }

  return null;
}

/**
 * 메시지에서 특정 신호 확인
 */
export function hasSignal(message: string, signalCode: string): boolean {
  return message.includes(signalCode);
}

