-- message_logs 테이블 (초톡방에서 감지된 메시지 저장)

CREATE TABLE IF NOT EXISTS message_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_name VARCHAR(255) NOT NULL,           -- 초톡방 이름
  sender_name VARCHAR(100) NOT NULL,         -- 발신자 이름 (아가씨 닉네임)
  message TEXT NOT NULL,                     -- 메시지 전체 내용
  message_type VARCHAR(20) DEFAULT 'chotalk', -- 'chotalk' | 'dotalk'
  is_processed BOOLEAN DEFAULT FALSE,        -- 처리 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_message_logs_slot_id ON message_logs(slot_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sender_name ON message_logs(sender_name);
CREATE INDEX IF NOT EXISTS idx_message_logs_is_processed ON message_logs(is_processed);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
