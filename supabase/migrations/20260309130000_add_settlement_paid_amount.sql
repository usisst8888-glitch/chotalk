-- 정산 입금 금액 추가
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS paid_amount INTEGER DEFAULT 0;
