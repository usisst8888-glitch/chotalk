-- 총판 계좌 정보 (본사가 정산금 입금할 계좌)
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS bank_name VARCHAR(50);
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS account_holder VARCHAR(50);

-- 총판 판매 금액 설정
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS slot_price INTEGER DEFAULT 100000;
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS extension_price INTEGER DEFAULT 50000;
