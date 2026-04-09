-- starttalk_order에 room_number 컬럼 추가 (메시지에서 추출한 3자리 방번호)
ALTER TABLE starttalk_order ADD COLUMN IF NOT EXISTS room_number TEXT;

CREATE INDEX IF NOT EXISTS idx_starttalk_order_room_number ON starttalk_order (room_number);
