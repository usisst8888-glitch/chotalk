import { getSupabase } from '@/lib/supabase';

// ============================================================
// 이벤트 적용 여부 판단
// event_times의 start_time ~ end_time 사이에 한 타임이라도 시작하면
// 다음날 15시까지 모든 타임에 이벤트 적용
// ============================================================

/**
 * 이벤트 날짜 범위 계산 (15시 기준)
 * 예: 2/14 18:00 → 이벤트 날짜 = 2/14 15:00 ~ 2/15 15:00
 * 예: 2/15 02:00 → 이벤트 날짜 = 2/14 15:00 ~ 2/15 15:00
 */
function getEventDateRange(time: Date): { start: Date; end: Date } {
  const eventStart = new Date(time);
  // 15시 이전이면 전날 15시부터
  if (eventStart.getHours() < 15) {
    eventStart.setDate(eventStart.getDate() - 1);
  }
  eventStart.setHours(15, 0, 0, 0);

  const eventEnd = new Date(eventStart);
  eventEnd.setDate(eventEnd.getDate() + 1);

  return { start: eventStart, end: eventEnd };
}

export async function checkIsEvent(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string | null,
  startTime: string
): Promise<boolean> {
  if (!shopName) return false;

  // 1. event_times에서 해당 가게의 이벤트 시간대 조회
  const { data: eventTime } = await supabase
    .from('event_times')
    .select('start_time, end_time')
    .eq('shop_name', shopName)
    .eq('is_active', true)
    .single();

  if (!eventTime) return false;

  // 2. 세션 시작 시간의 시:분 추출
  const sessionStart = new Date(startTime);
  const sessionHour = sessionStart.getHours();
  const sessionMinute = sessionStart.getMinutes();
  const sessionMinutes = sessionHour * 60 + sessionMinute;

  // event_times의 start_time/end_time은 TIME 타입 (예: "18:00:00")
  const [eventStartHour, eventStartMin] = eventTime.start_time.split(':').map(Number);
  const [eventEndHour, eventEndMin] = eventTime.end_time.split(':').map(Number);
  const eventStartMinutes = eventStartHour * 60 + (eventStartMin || 0);
  const eventEndMinutes = eventEndHour * 60 + (eventEndMin || 0);

  // 3. 이벤트 시간대 안이면 바로 true
  if (sessionMinutes >= eventStartMinutes && sessionMinutes < eventEndMinutes) {
    console.log('checkIsEvent: 이벤트 시간대 안 →', shopName, startTime);
    return true;
  }

  // 4. 이벤트 시간대 밖이면 → 같은 이벤트 날짜에 is_event=true 기록 확인
  const { start: rangeStart, end: rangeEnd } = getEventDateRange(sessionStart);

  const { data: eventRecords } = await supabase
    .from('status_board')
    .select('id')
    .eq('slot_id', slotId)
    .eq('shop_name', shopName)
    .eq('is_event', true)
    .gte('start_time', rangeStart.toISOString().slice(0, -1))
    .lt('start_time', rangeEnd.toISOString().slice(0, -1))
    .limit(1);

  if (eventRecords && eventRecords.length > 0) {
    console.log('checkIsEvent: 이전 이벤트 기록 있음 → 유지', shopName, startTime);
    return true;
  }

  console.log('checkIsEvent: 이벤트 아님', shopName, startTime);
  return false;
}
