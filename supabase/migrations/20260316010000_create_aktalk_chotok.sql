-- aktalk_chotok: 초톡 출근표 메시지 저장
CREATE TABLE IF NOT EXISTS aktalk_chotok (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL,
  room_name text NOT NULL,
  sender text,
  message text NOT NULL,
  data_changed boolean NOT NULL DEFAULT true,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aktalk_chotok_shop ON aktalk_chotok (shop_name);
