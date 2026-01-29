-- send_queue 테이블에 room_number, start_time, end_time 컬럼 추가
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN send_queue.room_number IS '방번호';
COMMENT ON COLUMN send_queue.start_time IS '세션 시작 시간';
COMMENT ON COLUMN send_queue.end_time IS '세션 종료 시간';
