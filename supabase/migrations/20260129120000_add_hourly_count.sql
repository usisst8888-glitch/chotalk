-- 1시간마다 발송 횟수 추적용 컬럼 추가
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS hourly_count INTEGER DEFAULT 0;

-- hourly_sent_at 삭제 (hourly_count로 대체)
ALTER TABLE send_queue DROP COLUMN IF EXISTS hourly_sent_at;

COMMENT ON COLUMN send_queue.hourly_count IS '1시간 메시지 발송 횟수 (매 시간마다 증가)';
COMMENT ON COLUMN send_queue.start_sent_at IS '시작 메시지 발송 완료 시간';
COMMENT ON COLUMN send_queue.end_sent_at IS '종료 메시지 발송 완료 시간';
