-- slots 테이블에 is_active 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
