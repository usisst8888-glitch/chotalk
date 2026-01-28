// 티켓 계산 유틸리티
// 설정은 ticket-config.ts에서 관리합니다.

import {
  TICKET_RULES,
  NUMBER_EMOJIS,
  findTicketRule,
} from './ticket-config';

// ============================================================
// 숫자 → 이모지 변환
// ============================================================

/**
 * 숫자를 이모지로 변환
 * @example numberToEmoji(1) → '1️⃣'
 * @example numberToEmoji(12) → '1️⃣2️⃣'
 */
export function numberToEmoji(num: number): string {
  if (num <= 10) {
    return NUMBER_EMOJIS[num];
  }
  return num.toString().split('').map(digit => NUMBER_EMOJIS[parseInt(digit)]).join('');
}

// ============================================================
// 시간 계산
// ============================================================

/**
 * 시간 문자열(HH:MM)을 분 단위로 변환
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 시작 시간과 끝 시간을 기준으로 경과 시간(분) 계산
 * 자정을 넘어가는 경우도 처리
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // 자정을 넘어가는 경우 (예: 23:30 ~ 01:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

// ============================================================
// 티켓 계산
// ============================================================

export interface TicketResult {
  halfTickets: number;
  fullTickets: number;
  isFree: boolean;
  ruleName: string;
}

/**
 * 경과 시간(분)을 기준으로 티켓 종류 계산
 *
 * 기본 규칙 (ticket-config.ts에서 수정 가능):
 * - 1-10분: 무료
 * - 11-30분: 반티 (0.5)
 * - 31-60분: 완티 (1.0)
 * - 60분 초과: 시간에 비례하여 계산
 */
export function calculateTicketType(durationMinutes: number): TicketResult {
  // 0분 이하
  if (durationMinutes <= 0) {
    return { halfTickets: 0, fullTickets: 0, isFree: true, ruleName: '시간없음' };
  }

  // 60분 이하: 규칙에서 찾기
  const rule = findTicketRule(durationMinutes);
  if (rule && durationMinutes <= 60) {
    return {
      halfTickets: rule.halfTickets,
      fullTickets: rule.fullTickets,
      isFree: rule.isFree,
      ruleName: rule.name,
    };
  }

  // 60분 초과: 시간에 비례하여 완티 계산
  const fullCount = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  const remainingRule = findTicketRule(remainingMinutes);

  return {
    halfTickets: remainingRule?.halfTickets || 0,
    fullTickets: fullCount + (remainingRule?.fullTickets || 0),
    isFree: false,
    ruleName: `완티${fullCount}+${remainingRule?.name || ''}`,
  };
}

// ============================================================
// 세션 합계 계산
// ============================================================

export interface SessionTicket {
  halfTickets: number;
  fullTickets: number;
}

/**
 * 세션 정보를 기반으로 티켓 합계 계산
 */
export function calculateTotalTickets(sessions: SessionTicket[]): number {
  return sessions.reduce((total, session) => {
    return total + (session.halfTickets || 0) + (session.fullTickets || 0);
  }, 0);
}

// ============================================================
// 메시지 포맷팅
// ============================================================

/**
 * 메시지 바디 포맷팅 (티켓 합계만)
 * @example formatMessageBody(1.5) → "1.5"
 */
export function formatMessageBody(totalTickets: number): string {
  return totalTickets.toFixed(1);
}

export interface SessionForFooter {
  roomNumber: string;
  startTime: string;
  endTime: string;
  halfTickets: number;
  fullTickets: number;
  hasFare?: boolean;
  fareAmount?: number;
}

/**
 * 메시지 푸터 포맷팅 (각 방별 상세 정보)
 * 각 줄 앞에 숫자 이모지 추가
 *
 * @example
 * 1️⃣ 703번방 14:00~14:45 (완티 1)
 * 2️⃣ 802번방 15:00~15:25 (반티 0.5) 차비2
 */
export function formatMessageFooter(sessions: SessionForFooter[]): string {
  const lines = sessions.map((session, index) => {
    const emoji = numberToEmoji(index + 1);

    // 티켓 정보 조합
    const ticketParts: string[] = [];
    if (session.halfTickets > 0) {
      ticketParts.push(`반티 ${session.halfTickets}`);
    }
    if (session.fullTickets > 0) {
      ticketParts.push(`완티 ${session.fullTickets}`);
    }

    // 기본 라인: 이모지 + 방번호 + 시간
    let line = `${emoji} ${session.roomNumber}번방 ${session.startTime}~${session.endTime}`;

    // 티켓 정보 추가
    if (ticketParts.length > 0) {
      line += ` (${ticketParts.join(', ')})`;
    }

    // 차비 추가
    if (session.hasFare && session.fareAmount) {
      line += ` 차비${session.fareAmount}`;
    }

    return line;
  });

  return lines.join('\n');
}

// ============================================================
// 티켓 규칙 조회 (디버깅/관리용)
// ============================================================

/**
 * 현재 설정된 모든 티켓 규칙 조회
 */
export function getAllTicketRules() {
  return TICKET_RULES;
}
