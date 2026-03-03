-- slots 테이블에 domain 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
