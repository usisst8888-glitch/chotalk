-- aktalk_chotok에 sent_at 컬럼 추가 (발송 시간 기록)
ALTER TABLE aktalk_chotok ADD COLUMN IF NOT EXISTS sent_at timestamptz;
