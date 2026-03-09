-- 정산 입금 완료 기록 테이블
CREATE TABLE IF NOT EXISTS settlement_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM 형식
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES users(id),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(distributor_id, month)
);
