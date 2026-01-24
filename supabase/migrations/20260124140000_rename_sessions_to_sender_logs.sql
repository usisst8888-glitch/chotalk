-- sessions 테이블을 sender_logs로 이름 변경

ALTER TABLE sessions RENAME TO sender_logs;

-- 인덱스 이름도 변경
ALTER INDEX IF EXISTS idx_sessions_slot_id RENAME TO idx_sender_logs_slot_id;
ALTER INDEX IF EXISTS idx_sessions_user_id RENAME TO idx_sender_logs_user_id;
ALTER INDEX IF EXISTS idx_sessions_room_number RENAME TO idx_sender_logs_room_number;
ALTER INDEX IF EXISTS idx_sessions_is_completed RENAME TO idx_sender_logs_is_completed;
ALTER INDEX IF EXISTS idx_sessions_is_settled RENAME TO idx_sender_logs_is_settled;
ALTER INDEX IF EXISTS idx_sessions_start_time RENAME TO idx_sender_logs_start_time;
ALTER INDEX IF EXISTS idx_sessions_created_at RENAME TO idx_sender_logs_created_at;
ALTER INDEX IF EXISTS idx_sessions_shop_name RENAME TO idx_sender_logs_shop_name;
