-- aktalk_atok: timestamptz → timestamp without time zone 변경 (한국 시간 저장)
ALTER TABLE aktalk_atok
  ALTER COLUMN received_at TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE;

-- 기본값도 한국 시간으로
ALTER TABLE aktalk_atok
  ALTER COLUMN received_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul');

-- 기존 데이터 UTC → 한국 시간으로 변환 (+9시간)
UPDATE aktalk_atok SET
  received_at = received_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours';
