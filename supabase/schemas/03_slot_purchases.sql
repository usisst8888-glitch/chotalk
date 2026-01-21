-- slot_purchases 테이블 (슬롯 추가 구매 요청)

CREATE TABLE IF NOT EXISTS slot_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  depositor_name VARCHAR(100) NOT NULL,
  slot_count INTEGER NOT NULL CHECK (slot_count > 0),
  total_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_slot_purchases_user_id ON slot_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_slot_purchases_status ON slot_purchases(status);
CREATE INDEX IF NOT EXISTS idx_slot_purchases_created_at ON slot_purchases(created_at);

-- 트리거
CREATE TRIGGER update_slot_purchases_updated_at
  BEFORE UPDATE ON slot_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
