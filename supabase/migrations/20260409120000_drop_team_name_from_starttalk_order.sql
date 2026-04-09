-- starttalk_order에서 team_name 컬럼 제거 (orderreader는 팀 개념 없음)
ALTER TABLE starttalk_order DROP COLUMN IF EXISTS team_name;
