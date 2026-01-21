-- slots 테이블

CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  girl_name VARCHAR(100) NOT NULL,
  chat_room_name VARCHAR(100) NOT NULL,
  kakao_id VARCHAR(100) NOT NULL DEFAULT 'test_kakao_id',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_slots_user_id ON slots(user_id);
CREATE INDEX IF NOT EXISTS idx_slots_expires_at ON slots(expires_at);

-- 트리거
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
