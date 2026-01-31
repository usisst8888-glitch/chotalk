-- status_board에 이벤트 관련 컬럼 추가

-- 이벤트 개수 (종료 시 계산됨)
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS event_count DECIMAL(3,1) DEFAULT 0;

COMMENT ON COLUMN status_board.event_count IS '이벤트 적용 개수 (usage_duration 중 이벤트 시간대에 해당하는 부분)';
