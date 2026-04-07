-- aktalk_chotok: timestamptz → timestamp without time zone 변경 (한국 시간 저장)
ALTER TABLE aktalk_chotok
  ALTER COLUMN received_at TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE,
  ALTER COLUMN sent_at TYPE TIMESTAMP WITHOUT TIME ZONE;

-- 기본값도 한국 시간으로
ALTER TABLE aktalk_chotok
  ALTER COLUMN received_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul');

-- 기존 데이터 UTC → 한국 시간으로 변환 (+9시간)
UPDATE aktalk_chotok SET
  received_at = received_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours',
  updated_at = updated_at + INTERVAL '9 hours',
  sent_at = CASE WHEN sent_at IS NOT NULL THEN sent_at + INTERVAL '9 hours' ELSE NULL END;
