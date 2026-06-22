-- status_board에 manager_name 컬럼 추가
-- INSERT/UPDATE 시점에 aktalk_chotok_managers (shop_name + room_number) 조회로 채운다.
ALTER TABLE status_board
  ADD COLUMN IF NOT EXISTS manager_name text;

CREATE INDEX IF NOT EXISTS idx_status_board_manager_name
  ON status_board (manager_name);
