-- message_logs에 user_template_id 컬럼 추가

ALTER TABLE message_logs
ADD COLUMN IF NOT EXISTS user_template_id UUID REFERENCES user_templates(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_message_logs_user_template_id ON message_logs(user_template_id);
