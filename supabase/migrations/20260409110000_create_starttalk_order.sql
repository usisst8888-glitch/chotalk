-- starttalk_order: orderreader 전용 주문 메시지 테이블 (aktalk_atok과 동일 구조)
CREATE TABLE starttalk_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  team_name TEXT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  has_photo BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')
);

CREATE INDEX idx_starttalk_order_shop ON starttalk_order (shop_name);
CREATE INDEX idx_starttalk_order_received_at ON starttalk_order (received_at DESC);

ALTER TABLE starttalk_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON starttalk_order FOR ALL USING (true) WITH CHECK (true);
