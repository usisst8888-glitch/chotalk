-- 상황판 테이블 (message_logs에서 정제된 현재 상황)
CREATE TABLE IF NOT EXISTS status_board (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  shop_name VARCHAR(100),           -- 가게명
  room_number VARCHAR(50) NOT NULL, -- 방번호
  girl_name VARCHAR(100) NOT NULL,  -- 아가씨이름
  is_started BOOLEAN DEFAULT FALSE, -- 스타트여부 (현재 진행 중인지)
  start_time TIMESTAMP WITH TIME ZONE, -- 스타트 시간
  end_time TIMESTAMP WITH TIME ZONE,   -- 끝나는 시간
  source_log_id UUID REFERENCES message_logs(id), -- 원본 메시지 로그 ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_status_board_slot_id ON status_board(slot_id);
CREATE INDEX IF NOT EXISTS idx_status_board_user_id ON status_board(user_id);
CREATE INDEX IF NOT EXISTS idx_status_board_girl_name ON status_board(girl_name);
CREATE INDEX IF NOT EXISTS idx_status_board_room_number ON status_board(room_number);
CREATE INDEX IF NOT EXISTS idx_status_board_is_started ON status_board(is_started);
CREATE INDEX IF NOT EXISTS idx_status_board_shop_name ON status_board(shop_name);
