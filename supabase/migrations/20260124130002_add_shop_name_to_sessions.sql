-- sessions 테이블에 shop_name 컬럼 추가

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS shop_name VARCHAR(100);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_shop_name ON sessions(shop_name);
