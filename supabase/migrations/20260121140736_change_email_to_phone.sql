-- email 컬럼을 phone으로 변경

-- 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_users_email;

-- 컬럼명 변경
ALTER TABLE users RENAME COLUMN email TO phone;

-- 새 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
