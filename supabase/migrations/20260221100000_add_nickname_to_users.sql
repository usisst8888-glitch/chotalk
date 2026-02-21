-- users 테이블에 담당자 닉네임 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);
