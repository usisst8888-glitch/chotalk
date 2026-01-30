-- status_board에 지명 여부 컬럼 추가
-- ㅈㅁ 신호가 있으면 true, 없으면 false

ALTER TABLE status_board
  ADD COLUMN is_designated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN status_board.is_designated IS '지명 여부 (ㅈㅁ 신호)';
