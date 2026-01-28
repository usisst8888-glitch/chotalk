-- kakao_invite_ids 테이블에 사용 횟수 컬럼 추가
ALTER TABLE kakao_invite_ids ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- 인덱스 추가 (사용 횟수 기준 정렬용)
CREATE INDEX IF NOT EXISTS idx_kakao_invite_ids_usage_count ON kakao_invite_ids(usage_count);
