-- ㅈㅁ(지명) 섹션 파싱 결과 저장 테이블
-- 게시판 메시지의 ㅈㅁ 구분선 아래 아가씨 목록을 저장
-- sent_at NULL = 미발송, 발송 후 타임스탬프 기록

CREATE TABLE designated_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  shop_name VARCHAR(100),
  girl_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(50),
  kakao_id VARCHAR(100),
  target_room VARCHAR(100),
  source_log_id UUID REFERENCES message_logs(id),
  sent_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 미발송 레코드 빠른 조회 + 중복 방지용
CREATE INDEX idx_designated_notices_unsent ON designated_notices(slot_id) WHERE sent_at IS NULL;

-- RLS 활성화 (service_role 키는 RLS 무시)
ALTER TABLE designated_notices ENABLE ROW LEVEL SECURITY;
