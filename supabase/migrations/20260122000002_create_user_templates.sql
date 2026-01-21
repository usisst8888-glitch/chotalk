-- user_templates 테이블 (사용자별 단일 발송 템플릿)

CREATE TABLE IF NOT EXISTS user_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);

-- 트리거
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON user_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
