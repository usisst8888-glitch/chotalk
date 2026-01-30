-- send_queue 테이블 구조 변경
-- 세션당 한 줄, trigger_type은 현재 상태, 각 단계별 발송 성공 추적

-- 기존 scheduled_at을 sent_at으로 변경하지 않고, 각 단계별 발송 추적 컬럼 추가
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS start_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS hourly_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS end_sent_at TIMESTAMP WITH TIME ZONE;

-- slot_id 추가 (세션 식별용)
ALTER TABLE send_queue ADD COLUMN IF NOT EXISTS slot_id UUID;

-- 기존 sent_at 컬럼 삭제 (개별 단계별로 추적하므로)
ALTER TABLE send_queue DROP COLUMN IF EXISTS sent_at;
ALTER TABLE send_queue DROP COLUMN IF EXISTS scheduled_at;

-- 유니크 인덱스: slot_id + room_number로 세션 식별
CREATE UNIQUE INDEX IF NOT EXISTS idx_send_queue_session ON send_queue(slot_id, room_number) WHERE slot_id IS NOT NULL AND room_number IS NOT NULL;

COMMENT ON COLUMN send_queue.trigger_type IS '현재 상태: start(시작), hourly(1시간 경과), end(종료)';
COMMENT ON COLUMN send_queue.start_sent_at IS '시작 메시지 발송 시간';
COMMENT ON COLUMN send_queue.hourly_sent_at IS '1시간 메시지 발송 시간';
COMMENT ON COLUMN send_queue.end_sent_at IS '종료 메시지 발송 시간';
