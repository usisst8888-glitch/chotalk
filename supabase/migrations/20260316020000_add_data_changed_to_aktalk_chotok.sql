-- aktalk_chotok에 data_changed, updated_at 컬럼 추가
ALTER TABLE aktalk_chotok ADD COLUMN IF NOT EXISTS data_changed boolean NOT NULL DEFAULT false;
ALTER TABLE aktalk_chotok ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
