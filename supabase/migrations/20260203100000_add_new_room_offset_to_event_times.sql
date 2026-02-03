-- event_times 테이블에 new_room_offset 컬럼 추가
-- 도파민: -1 (신규방 기준 14:00, 기존방 로직 있음)
-- 다른 shop: 0 (신규방 기준 = start_time, 기존방 로직 없음)

ALTER TABLE event_times
ADD COLUMN IF NOT EXISTS new_room_offset INTEGER DEFAULT 0;

-- 도파민은 -1로 설정
UPDATE event_times
SET new_room_offset = -1
WHERE shop_name = '도파민';

COMMENT ON COLUMN event_times.new_room_offset IS '신규방 기준 offset (도파민: -1, 나머지: 0). 신규방 threshold = start_time + offset';
