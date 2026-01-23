-- custom_templates 테이블 (유저가 직접 만든 커스텀 템플릿)

CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,                -- 템플릿 이름
  template TEXT NOT NULL,                    -- 템플릿 내용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON custom_templates(user_id);

-- 트리거
CREATE TRIGGER update_custom_templates_updated_at
  BEFORE UPDATE ON custom_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
