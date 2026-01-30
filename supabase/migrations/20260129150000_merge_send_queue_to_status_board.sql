-- send_queue 컬럼들을 status_board로 이동

-- status_board에 발송 관련 컬럼 추가
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'start' CHECK (trigger_type IN ('start', 'hourly', 'end'));
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS start_sent_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS hourly_count INTEGER DEFAULT 0;
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS end_sent_at TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN status_board.trigger_type IS '현재 상태: start(시작), hourly(1시간 경과), end(종료)';
COMMENT ON COLUMN status_board.start_sent_at IS '시작 메시지 발송 완료 시간';
COMMENT ON COLUMN status_board.hourly_count IS '1시간 메시지 발송 횟수';
COMMENT ON COLUMN status_board.end_sent_at IS '종료 메시지 발송 완료 시간';

-- send_queue 테이블 삭제
DROP TABLE IF EXISTS send_queue;
