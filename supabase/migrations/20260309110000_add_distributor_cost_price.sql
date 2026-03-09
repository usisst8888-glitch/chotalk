-- 총판 본사 입금 단가 (총판이 본사에 내는 1인원당 금액)
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 20000;
