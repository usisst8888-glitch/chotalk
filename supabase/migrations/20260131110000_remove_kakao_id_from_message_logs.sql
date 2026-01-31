-- message_logs에서 사용하지 않는 kakao_id 컬럼 삭제

-- 인덱스 먼저 삭제
DROP INDEX IF EXISTS idx_message_logs_kakao_id;
DROP INDEX IF EXISTS idx_message_logs_kakao_id_processed;

-- 컬럼 삭제
ALTER TABLE message_logs DROP COLUMN IF EXISTS kakao_id;
