-- ㅈ.ㅁ 지명 이력 테이블 (사라진 지명은 여기로 이동)
CREATE TABLE designated_notices_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  shop_name VARCHAR(100),
  girl_name VARCHAR(100) NOT NULL,
  kakao_id VARCHAR(100),
  target_room VARCHAR(100),
  source_log_id UUID REFERENCES message_logs(id),
  sent_at TIMESTAMP WITHOUT TIME ZONE,
  send_success BOOLEAN,
  created_at TIMESTAMP WITHOUT TIME ZONE,
  moved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

ALTER TABLE designated_notices_history ENABLE ROW LEVEL SECURITY;
