-- slots 테이블에 shop_name 컬럼 추가
-- 가게명: 도파민, 유앤미, 달토, 퍼펙트, 엘리트 등

ALTER TABLE slots ADD COLUMN IF NOT EXISTS shop_name VARCHAR(100);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_slots_shop_name ON slots(shop_name);
