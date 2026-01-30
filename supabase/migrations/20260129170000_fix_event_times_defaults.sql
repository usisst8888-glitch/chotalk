-- event_times의 created_at, updated_at 기본값을 한국 시간으로 변경

-- 한국 시간 반환 함수 생성
CREATE OR REPLACE FUNCTION get_korean_time()
RETURNS TIMESTAMP WITHOUT TIME ZONE AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'Asia/Seoul';
END;
$$ LANGUAGE plpgsql;

-- event_times 테이블 기본값 변경
ALTER TABLE event_times
  ALTER COLUMN created_at SET DEFAULT get_korean_time(),
  ALTER COLUMN updated_at SET DEFAULT get_korean_time();

-- 기존 데이터도 한국 시간으로 변환 (UTC → KST, +9시간)
UPDATE event_times SET
  created_at = created_at + INTERVAL '9 hours',
  updated_at = updated_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;
