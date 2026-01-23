-- message_logs에 kakao_id 컬럼 추가
-- 어떤 스마트폰(카카오톡 계정)이 이 메시지를 발송해야 하는지 식별용

ALTER TABLE message_logs
ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(100);

-- 인덱스 추가 (폴링 시 kakao_id로 필터링할 때 성능 향상)
CREATE INDEX IF NOT EXISTS idx_message_logs_kakao_id ON message_logs(kakao_id);

-- 복합 인덱스: kakao_id + is_processed (자주 사용될 조회 패턴)
CREATE INDEX IF NOT EXISTS idx_message_logs_kakao_id_processed
ON message_logs(kakao_id, is_processed) WHERE is_processed = false;
