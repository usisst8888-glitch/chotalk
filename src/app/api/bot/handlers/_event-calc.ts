// ============================================================
// 이벤트 계산 함수 (주석 처리 - 새로 구현 예정)
// end.ts의 handleSessionEnd에서 사용 예정
// ============================================================

/*
import { getSupabase } from '@/lib/supabase';

interface EventCalculation {
  eventCount: number;
  isNewRoom: boolean;
}

function getEventDate(time: Date, thresholdHour: number): Date {
  const eventDate = new Date(time);
  if (eventDate.getHours() < thresholdHour) {
    eventDate.setDate(eventDate.getDate() - 1);
  }
  eventDate.setHours(thresholdHour, 0, 0, 0);
  return eventDate;
}

async function checkGirlEventStatus(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string,
  currentTime: string,
  eventStartHour: number,
  eventEndHour: number,
  newRoomOffset: number
): Promise<boolean> {
  const currentDate = new Date(currentTime);
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const hasExistingRoomLogic = newRoomOffset !== 0;
  const eventDate = getEventDate(currentDate, newRoomThresholdHour);

  const eventDateStart = new Date(eventDate);
  const eventDateEnd = new Date(eventDate);
  eventDateEnd.setDate(eventDateEnd.getDate() + 1);

  const { data: records, error } = await supabase
    .from('status_board')
    .select('start_time, end_time, room_number, shop_name')
    .eq('slot_id', slotId)
    .eq('shop_name', shopName)
    .gte('start_time', eventDateStart.toISOString().slice(0, -1))
    .lt('start_time', eventDateEnd.toISOString().slice(0, -1));

  if (error || !records || records.length === 0) return false;

  for (const record of records) {
    const startTime = new Date(record.start_time);
    const startInMinutes = startTime.getHours() * 60 + startTime.getMinutes();

    const { data: room } = await supabase
      .from('rooms')
      .select('room_start_time')
      .eq('room_number', record.room_number)
      .eq('shop_name', shopName)
      .lte('room_start_time', record.start_time)
      .order('room_start_time', { ascending: false })
      .limit(1)
      .single();

    if (!room) continue;

    const roomStartTime = new Date(room.room_start_time);
    const roomStartHour = roomStartTime.getHours();
    const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                      (roomStartTime.getDate() !== startTime.getDate() && roomStartHour < newRoomThresholdHour);

    const eventStartInMinutes = eventStartHour * 60;
    const eventEndInMinutes = eventEndHour * 60;

    if (isNewRoom) {
      const newRoomEventStart = newRoomThresholdHour * 60;
      if (startInMinutes >= newRoomEventStart && startInMinutes < eventEndInMinutes) return true;
    } else if (hasExistingRoomLogic) {
      if (record.end_time) {
        const endTime = new Date(record.end_time);
        const endInMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        if (endInMinutes > eventStartInMinutes) return true;
      }
    }
  }

  return false;
}

export async function calculateEventCount(
  supabase: ReturnType<typeof getSupabase>,
  slotId: string,
  shopName: string | null,
  roomStartTime: string,
  girlStartTime: string,
  girlEndTime: string,
  usageDuration: number | null
): Promise<EventCalculation> {
  if (!shopName || usageDuration === null || usageDuration <= 0) {
    return { eventCount: 0, isNewRoom: false };
  }

  const { data: eventTime } = await supabase
    .from('event_times')
    .select('start_time, end_time, new_room_offset')
    .eq('shop_name', shopName)
    .eq('is_active', true)
    .single();

  if (!eventTime) return { eventCount: 0, isNewRoom: false };

  const [eventStartHour] = eventTime.start_time.split(':').map(Number);
  const [eventEndHour] = eventTime.end_time.split(':').map(Number);
  const newRoomOffset = eventTime.new_room_offset || 0;

  const roomStart = new Date(roomStartTime);
  const girlStart = new Date(girlStartTime);
  const newRoomThresholdHour = eventStartHour + newRoomOffset;
  const roomStartHour = roomStart.getHours();

  const isNewRoom = roomStartHour >= newRoomThresholdHour ||
                    (roomStart.getDate() !== girlStart.getDate() && roomStartHour < newRoomThresholdHour);

  const hasExistingRoomLogic = newRoomOffset !== 0;
  const girlEnd = new Date(girlEndTime);
  const girlStartInMinutes = girlStart.getHours() * 60 + girlStart.getMinutes();
  const girlEndInMinutes = girlEnd.getHours() * 60 + girlEnd.getMinutes();
  const eventStartInMinutes = eventStartHour * 60;
  const eventEndInMinutes = eventEndHour * 60;
  const newRoomEventStart = newRoomThresholdHour * 60;

  let eventCount = 0;

  const hasEventStatus = await checkGirlEventStatus(
    supabase, slotId, shopName, girlEndTime, eventStartHour, eventEndHour, newRoomOffset
  );

  if (hasEventStatus) {
    eventCount = usageDuration;
  } else if (isNewRoom) {
    if (girlStartInMinutes >= newRoomEventStart && girlStartInMinutes < eventEndInMinutes) {
      eventCount = usageDuration;
    }
  } else if (hasExistingRoomLogic) {
    if (girlEndInMinutes > eventStartInMinutes) {
      if (girlStartInMinutes >= eventStartInMinutes) {
        eventCount = usageDuration;
      } else {
        eventCount = (girlEndInMinutes - eventStartInMinutes) / 60;
      }
    }
  }

  return { eventCount, isNewRoom };
}
*/
