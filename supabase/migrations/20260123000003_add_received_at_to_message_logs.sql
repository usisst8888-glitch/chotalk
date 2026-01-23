-- message_logs에 received_at 컬럼 추가 (알림 수신 시간)
-- 폰에서 메시지 알림이 감지된 시간 (서버 저장 시간과 다름)

ALTER TABLE message_logs
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (시간대별 조회 용이)
CREATE INDEX IF NOT EXISTS idx_message_logs_received_at ON message_logs(received_at DESC);
