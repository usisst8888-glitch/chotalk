-- 카카오톡 발송 대기 큐 테이블
CREATE TABLE IF NOT EXISTS send_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_template_id UUID REFERENCES user_templates(id),
  target_room TEXT NOT NULL,
  kakao_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('start', 'end', 'hourly')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스: 발송 대기 조회용
CREATE INDEX IF NOT EXISTS idx_send_queue_pending ON send_queue(scheduled_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_send_queue_template ON send_queue(user_template_id);

COMMENT ON TABLE send_queue IS '카카오톡 발송 대기 큐';
COMMENT ON COLUMN send_queue.trigger_type IS 'start: 세션 시작, end: 세션 종료(ㄲ), hourly: 1시간마다';
COMMENT ON COLUMN send_queue.scheduled_at IS '발송 예정 시간';
COMMENT ON COLUMN send_queue.sent_at IS '실제 발송 시간 (NULL이면 미발송)';
