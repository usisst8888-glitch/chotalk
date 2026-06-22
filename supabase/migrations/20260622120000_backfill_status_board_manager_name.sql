-- 기존 status_board 레코드에 aktalk_chotok_managers의 manager_name 백필
-- 매칭 기준: shop_name + room_number
UPDATE status_board sb
SET manager_name = m.manager_name
FROM aktalk_chotok_managers m
WHERE sb.shop_name = m.shop_name
  AND sb.room_number = m.room_number;
