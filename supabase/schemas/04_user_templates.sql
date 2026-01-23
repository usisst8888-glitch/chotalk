-- user_templates 테이블 (유저당 하나의 선택된 템플릿만 저장)

CREATE TABLE IF NOT EXISTS user_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,  -- 유저당 하나만!
  template TEXT NOT NULL,                    -- 선택된 템플릿 내용
  source_type VARCHAR(20) NOT NULL DEFAULT 'sample',  -- 'sample' 또는 'custom'
  source_id UUID,                            -- custom_templates의 id (custom인 경우)
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
