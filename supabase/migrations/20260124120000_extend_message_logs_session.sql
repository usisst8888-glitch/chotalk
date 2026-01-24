-- message_logs 테이블 확장 (세션 정보 추가)
-- 기존 테이블에 방번호, 시작/종료, 티켓 정보 추가

-- 방 번호 (파싱된)
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS room_number VARCHAR(50);

-- 시작/종료 구분
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS is_session_start BOOLEAN DEFAULT FALSE;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS is_session_end BOOLEAN DEFAULT FALSE;

-- 종료 메시지인 경우, 시작 메시지 참조
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS start_log_id UUID REFERENCES message_logs(id) ON DELETE SET NULL;

-- 티켓 정보 (종료시 계산됨)
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS half_tickets DECIMAL(3,1) DEFAULT 0;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS full_tickets DECIMAL(3,1) DEFAULT 0;

-- 차비 정보
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS has_fare BOOLEAN DEFAULT FALSE;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS fare_amount INTEGER DEFAULT 0;

-- 세션 시간 계산 (종료시 계산됨, 분 단위)
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_message_logs_room_number ON message_logs(room_number);
CREATE INDEX IF NOT EXISTS idx_message_logs_is_session_start ON message_logs(is_session_start);
CREATE INDEX IF NOT EXISTS idx_message_logs_is_session_end ON message_logs(is_session_end);
CREATE INDEX IF NOT EXISTS idx_message_logs_start_log_id ON message_logs(start_log_id);
