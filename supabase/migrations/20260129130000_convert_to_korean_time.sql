-- 기존 UTC 데이터를 한국 시간(KST, +9시간)으로 변환

-- send_queue 테이블
UPDATE send_queue SET
  start_time = start_time + INTERVAL '9 hours',
  end_time = end_time + INTERVAL '9 hours',
  start_sent_at = start_sent_at + INTERVAL '9 hours',
  end_sent_at = end_sent_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE start_time IS NOT NULL OR created_at IS NOT NULL;

-- status_board 테이블
UPDATE status_board SET
  start_time = start_time + INTERVAL '9 hours',
  end_time = end_time + INTERVAL '9 hours',
  updated_at = updated_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE start_time IS NOT NULL OR created_at IS NOT NULL;

-- message_logs 테이블
UPDATE message_logs SET
  received_at = received_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE received_at IS NOT NULL OR created_at IS NOT NULL;

-- slots 테이블
UPDATE slots SET
  expires_at = expires_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours',
  updated_at = updated_at + INTERVAL '9 hours'
WHERE expires_at IS NOT NULL OR created_at IS NOT NULL;

-- users 테이블
UPDATE users SET
  created_at = created_at + INTERVAL '9 hours',
  updated_at = updated_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;

-- user_templates 테이블
UPDATE user_templates SET
  updated_at = updated_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;

-- custom_templates 테이블
UPDATE custom_templates SET
  updated_at = updated_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;

-- shop_closing_times 테이블
UPDATE shop_closing_times SET
  updated_at = updated_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;

-- kakao_invite_ids 테이블
UPDATE kakao_invite_ids SET
  updated_at = updated_at + INTERVAL '9 hours',
  created_at = created_at + INTERVAL '9 hours'
WHERE created_at IS NOT NULL;
