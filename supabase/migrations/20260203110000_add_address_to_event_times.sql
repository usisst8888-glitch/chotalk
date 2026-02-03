-- event_times 테이블에 address 컬럼 추가
-- 가게별 주소 저장

ALTER TABLE event_times
ADD COLUMN IF NOT EXISTS address TEXT;

COMMENT ON COLUMN event_times.address IS '가게 주소';
