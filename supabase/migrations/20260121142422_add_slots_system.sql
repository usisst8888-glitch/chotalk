-- users 테이블에 slot_count 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS slot_count INTEGER DEFAULT 3;

-- username에 unique 제약조건 추가
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- slots 테이블 생성
CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  girl_name VARCHAR(100) NOT NULL,
  chat_room_name VARCHAR(100) NOT NULL,
  kakao_id VARCHAR(100) NOT NULL DEFAULT 'test_kakao_id',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slots_user_id ON slots(user_id);
CREATE INDEX IF NOT EXISTS idx_slots_expires_at ON slots(expires_at);

-- slots 테이블 updated_at 트리거
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
