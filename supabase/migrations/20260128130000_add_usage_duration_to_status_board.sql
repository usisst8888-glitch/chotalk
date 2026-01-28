-- 상황판 테이블에 이용시간 컬럼 추가
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS usage_duration INTEGER;

-- 컬럼 설명: ㄲ 앞에 있는 숫자 (이용시간, 분 단위)
COMMENT ON COLUMN status_board.usage_duration IS '이용시간 (ㄲ 앞의 숫자, 분 단위)';
