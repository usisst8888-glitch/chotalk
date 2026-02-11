-- designated_notices에 source_log_id 컬럼 추가
ALTER TABLE designated_notices ADD COLUMN source_log_id UUID REFERENCES message_logs(id);
