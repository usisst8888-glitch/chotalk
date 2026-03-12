-- aktalk_gongji를 층별 담당자 상태 테이블로 재구성
DROP TABLE IF EXISTS aktalk_gongji;

CREATE TABLE aktalk_gongji (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  floor INT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aktalk_gongji_shop ON aktalk_gongji (shop_name);
CREATE INDEX idx_aktalk_gongji_shop_floor ON aktalk_gongji (shop_name, floor);

ALTER TABLE aktalk_gongji ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON aktalk_gongji FOR ALL USING (true) WITH CHECK (true);
