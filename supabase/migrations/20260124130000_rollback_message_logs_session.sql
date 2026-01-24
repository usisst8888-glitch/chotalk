-- message_logs 세션 컬럼 롤백 (별도 sessions 테이블로 분리)

ALTER TABLE message_logs DROP COLUMN IF EXISTS room_number;
ALTER TABLE message_logs DROP COLUMN IF EXISTS is_session_start;
ALTER TABLE message_logs DROP COLUMN IF EXISTS is_session_end;
ALTER TABLE message_logs DROP COLUMN IF EXISTS start_log_id;
ALTER TABLE message_logs DROP COLUMN IF EXISTS half_tickets;
ALTER TABLE message_logs DROP COLUMN IF EXISTS full_tickets;
ALTER TABLE message_logs DROP COLUMN IF EXISTS has_fare;
ALTER TABLE message_logs DROP COLUMN IF EXISTS fare_amount;
ALTER TABLE message_logs DROP COLUMN IF EXISTS duration_minutes;

-- 인덱스도 삭제
DROP INDEX IF EXISTS idx_message_logs_room_number;
DROP INDEX IF EXISTS idx_message_logs_is_session_start;
DROP INDEX IF EXISTS idx_message_logs_is_session_end;
DROP INDEX IF EXISTS idx_message_logs_start_log_id;
