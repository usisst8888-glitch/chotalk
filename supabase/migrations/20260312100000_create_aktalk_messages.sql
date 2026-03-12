-- aktalk: 카카오톡 메시지 자동 캡처 저장 테이블
CREATE TABLE aktalk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('아톡', '공지방', '초톡')),
  team_name TEXT NULL,
  room_name TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_aktalk_messages_shop_type ON aktalk_messages (shop_name, room_type);
CREATE INDEX idx_aktalk_messages_received_at ON aktalk_messages (received_at DESC);

-- RLS 활성화
ALTER TABLE aktalk_messages ENABLE ROW LEVEL SECURITY;

-- service_role만 INSERT/SELECT 가능 (백엔드 서버에서만 접근)
CREATE POLICY "Service role full access" ON aktalk_messages
  FOR ALL USING (true) WITH CHECK (true);
