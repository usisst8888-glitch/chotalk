-- 기존 단일 테이블 삭제
DROP TABLE IF EXISTS aktalk_messages;

-- 아톡 테이블 (team_name 포함)
CREATE TABLE aktalk_atok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  team_name TEXT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aktalk_atok_shop ON aktalk_atok (shop_name);
CREATE INDEX idx_aktalk_atok_received_at ON aktalk_atok (received_at DESC);

ALTER TABLE aktalk_atok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON aktalk_atok FOR ALL USING (true) WITH CHECK (true);

-- 공지방 테이블
CREATE TABLE aktalk_gongji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aktalk_gongji_shop ON aktalk_gongji (shop_name);
CREATE INDEX idx_aktalk_gongji_received_at ON aktalk_gongji (received_at DESC);

ALTER TABLE aktalk_gongji ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON aktalk_gongji FOR ALL USING (true) WITH CHECK (true);

-- 웨톡 테이블
CREATE TABLE aktalk_wetok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aktalk_wetok_shop ON aktalk_wetok (shop_name);
CREATE INDEX idx_aktalk_wetok_received_at ON aktalk_wetok (received_at DESC);

ALTER TABLE aktalk_wetok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON aktalk_wetok FOR ALL USING (true) WITH CHECK (true);

-- 초톡 테이블
CREATE TABLE aktalk_chotok (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aktalk_chotok_shop ON aktalk_chotok (shop_name);
CREATE INDEX idx_aktalk_chotok_received_at ON aktalk_chotok (received_at DESC);

ALTER TABLE aktalk_chotok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON aktalk_chotok FOR ALL USING (true) WITH CHECK (true);
