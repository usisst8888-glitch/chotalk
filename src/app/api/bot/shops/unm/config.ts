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
  aliases?: readonly string[];     // 대체 코드 (한글 버전 등)
}

export const MESSAGE_SIGNALS = {
  // 세션 종료 신호
  END: {
    code: 'ㄲ',
    type: 'end',
    description: '세션 종료',
    aliases: ['끝'],
  },

  // 수정 신호
  CORRECTION: {
    code: 'ㅈㅈ',
    type: 'correction',
    description: '수정 (방번호 또는 이용시간 변경)',
    aliases: ['정정', 'ㅈ ㅈ'],
  },

  // 재진행 신호 (종료 → 시작으로 되돌리기)
  RESUME: {
    code: 'ㅈㅈㅎ',
    type: 'resume',
    description: '재진행 (종료된 세션을 다시 시작으로 되돌림)',
    aliases: ['재진행'],  // 한글 대체 코드
  },

  // 현시간재진행 신호 (새 세션 시작, ㅈㅈ 무시)
  NEW_SESSION: {
    code: 'ㅎㅅㄱㅈㅈㅎ',
    type: 'new_session',
    description: '현시간재진행 (새 세션 시작)',
    aliases: ['현시간재진행'],
  },

  // 지명 신호
  DESIGNATED: {
    code: 'ㅈㅁ',
    type: 'designated',
    description: '지명 (손님이 특정 아가씨를 지명)',
  },

  // 취소 신호 (세션 삭제)
  CANCEL: {
    code: 'ㄱㅌ',
    type: 'cancel',
    description: '취소 (해당 세션을 status_board에서 삭제)',
    aliases: ['ㅋㅌ', 'ㄱㅋ', '걍팅', '팅', 'ㅌ'],
  },

  // 연장 신호 (시작으로 잡으면 안 됨)
  EXTENSION: {
    code: 'ㅇㅈ',
    type: 'extension',
    description: '연장 (기존 세션 연장, 새 시작 아님)',
  },

  // 지명순번삭제 신호 (시작으로 잡으면 안 됨)
  DESIGNATED_FEE: {
    code: 'ㅈㅁㅅㅅ',
    type: 'designated_fee',
    description: '지명순번삭제 (트리거 무시)',
  },

  // 지명반순번삭제 신호 (시작으로 잡으면 안 됨)
  DESIGNATED_HALF_FEE: {
    code: 'ㅈㅁㅂㅅㅅ',
    type: 'designated_half_fee',
    description: '지명반순번삭제 (트리거 무시)',
  },

  // 방이동 신호 (방 번호 변경, 시간 유지)
  TRANSFER: {
    code: 'ㅌㄹㅅ',
    type: 'transfer',
    description: '방이동 (해당 방의 모든 세션을 새 방으로 이동, 시간 유지)',
  },
} as const;

// ============================================================
// 3. 메시지 파싱 패턴
// ============================================================
export const PARSING_PATTERNS = {
  // 방 번호 패턴 (정확히 3자리 숫자만, 호 옵션)
  ROOM_NUMBER: {
    start: /^(\d{3})(?!\d)\s*호?\s*/,   // 메시지 시작 부분 (3자리만)
    middle: /(?<!\d)(\d{3})(?!\d)(?:\s*호?\s|(?=[가-힣ㄱ-ㅎ]))/,  // 메시지 중간 (3자리만, 한글 직접 붙어도 OK)
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

/**
 * 메시지에서 신호 확인 (aliases 포함)
 * 'ㅌ' alias는 ㅌㄹㅅ/ㅁㅌㄹㅅ의 ㅌ와 구분하기 위해
 * ㅌ 뒤에 ㄹ이 오지 않는 경우만 매칭
 */
export function hasSignalWithAliases(message: string, signal: MessageSignal): boolean {
  if (message.includes(signal.code)) return true;
  if (signal.aliases) {
    return signal.aliases.some(alias => {
      if (alias === 'ㅌ') {
        // ㅌ 단독: ㅌ 뒤에 ㄹ이 오면 ㅌㄹㅅ이므로 제외
        return /(?<![ㄱ-ㅎ])ㅌ(?![ㄱ-ㅎ])/.test(message);
      }
      return message.includes(alias);
    });
  }
  return false;
}

