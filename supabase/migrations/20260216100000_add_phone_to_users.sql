-- 회원가입 시 전화번호 입력을 위해 phone 컬럼 추가
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
