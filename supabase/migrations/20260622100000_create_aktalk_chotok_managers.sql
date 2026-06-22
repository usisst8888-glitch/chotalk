-- aktalk_chotok_managers: 초톡에서 파싱된 (가게 → 방번호 → 담당자) 매핑
-- 초톡이 새로 올 때마다 해당 shop_name 전체를 덮어쓴다 (현재 스냅샷).
CREATE TABLE IF NOT EXISTS aktalk_chotok_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name text NOT NULL,
  room_number text NOT NULL,
  manager_name text NOT NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aktalk_chotok_managers_unique
  ON aktalk_chotok_managers (shop_name, room_number);

CREATE INDEX IF NOT EXISTS idx_aktalk_chotok_managers_shop
  ON aktalk_chotok_managers (shop_name);
