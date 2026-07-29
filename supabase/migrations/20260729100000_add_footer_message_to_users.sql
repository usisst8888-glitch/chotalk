-- users에 발송 문구 하단 멘트(footer_message) 컬럼 추가
-- 프리미엄 회원이 사이트에서 직접 설정하는, 발송 문구 맨 아래에 붙는 멘트.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS footer_message text;
