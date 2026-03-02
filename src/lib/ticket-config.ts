// 호환성 유지용 re-export
// 실제 코드는 shops/dopamine/config.ts에 있음
// lib/ticket.ts → message-format/route.ts 체인에서 사용

export {
  TICKET_RULES,
  NUMBER_EMOJIS,
  findTicketRule,
} from '@/app/api/bot/shops/dopamine/config';

export type { TicketRule } from '@/app/api/bot/shops/dopamine/config';
