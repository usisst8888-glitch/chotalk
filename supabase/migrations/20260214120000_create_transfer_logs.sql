CREATE TABLE transfer_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_room VARCHAR(50) NOT NULL,
  to_room VARCHAR(50) NOT NULL,
  shop_name VARCHAR(100),
  is_canceled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

ALTER TABLE transfer_logs ENABLE ROW LEVEL SECURITY;
