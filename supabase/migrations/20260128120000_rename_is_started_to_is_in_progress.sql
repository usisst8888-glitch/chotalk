-- is_started를 is_in_progress로 변경 (진행중 여부)
ALTER TABLE status_board RENAME COLUMN is_started TO is_in_progress;

-- 인덱스 이름도 변경
ALTER INDEX IF EXISTS idx_status_board_is_started RENAME TO idx_status_board_is_in_progress;
