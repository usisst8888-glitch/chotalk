-- 모든 테이블의 created_at, updated_at 기본값을 한국 시간으로 변경

-- users 테이블
ALTER TABLE users
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- slots 테이블
ALTER TABLE slots
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- user_templates 테이블
ALTER TABLE user_templates
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- custom_templates 테이블
ALTER TABLE custom_templates
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- message_logs 테이블
ALTER TABLE message_logs
  ALTER COLUMN created_at SET DEFAULT get_korean_time();

-- kakao_invite_ids 테이블
ALTER TABLE kakao_invite_ids
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- status_board 테이블
ALTER TABLE status_board
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();
