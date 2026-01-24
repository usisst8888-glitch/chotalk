-- sessions 테이블 (티켓 계산 및 정산용)
-- message_logs와 분리하여 관리

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 방 정보
  room_number VARCHAR(50) NOT NULL,
  girl_name VARCHAR(100),

  -- 시간 정보
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,

  -- 티켓 정보
  half_tickets DECIMAL(3,1) DEFAULT 0,
  full_tickets DECIMAL(3,1) DEFAULT 0,

  -- 차비 정보
  has_fare BOOLEAN DEFAULT FALSE,
  fare_amount INTEGER DEFAULT 0,

  -- 상태
  is_completed BOOLEAN DEFAULT FALSE,    -- 세션 완료 여부 (ㄲ 수신)
  is_settled BOOLEAN DEFAULT FALSE,      -- 정산 완료 여부

  -- message_logs 참조 (원본 로그)
  start_log_id UUID REFERENCES message_logs(id) ON DELETE SET NULL,
  end_log_id UUID REFERENCES message_logs(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_slot_id ON sessions(slot_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_room_number ON sessions(room_number);
CREATE INDEX IF NOT EXISTS idx_sessions_is_completed ON sessions(is_completed);
CREATE INDEX IF NOT EXISTS idx_sessions_is_settled ON sessions(is_settled);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
