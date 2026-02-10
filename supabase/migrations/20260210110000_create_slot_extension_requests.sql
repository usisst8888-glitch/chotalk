-- 슬롯 연장 요청 테이블
CREATE TABLE IF NOT EXISTS slot_extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  depositor_name TEXT NOT NULL,
  slot_ids UUID[] NOT NULL,
  slot_count INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ext_req_status ON slot_extension_requests(status);
CREATE INDEX IF NOT EXISTS idx_ext_req_user_id ON slot_extension_requests(user_id);
