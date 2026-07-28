-- users에 프리미엄 여부 컬럼 추가
-- 프리미엄 회원만 발송 문구(상황판)에 담당자(manager_name) 이름이 표시된다.
-- 기본값 false = 담당자 숨김(기본 템플릿).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
