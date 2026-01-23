-- 템플릿 테이블 구조 변경
-- 기존: user_templates에 샘플+커스텀 모두 저장
-- 변경: 샘플은 코드에서만, custom_templates에 커스텀 저장, user_templates는 선택된 템플릿만

-- 1. custom_templates 테이블 생성
CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON custom_templates(user_id);

-- 2. 기존 user_templates에서 커스텀 템플릿(is_sample = false)을 custom_templates로 이동
INSERT INTO custom_templates (id, user_id, name, template, created_at, updated_at)
SELECT id, user_id, COALESCE(name, '내 템플릿'), template, created_at, updated_at
FROM user_templates
WHERE is_sample = false
ON CONFLICT DO NOTHING;

-- 3. user_templates 테이블 재구성
-- 기존 데이터 백업
CREATE TABLE IF NOT EXISTS user_templates_backup AS SELECT * FROM user_templates;

-- 테이블 삭제 후 재생성
DROP TABLE IF EXISTS user_templates CASCADE;

CREATE TABLE user_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  template TEXT NOT NULL,
  source_type VARCHAR(20) NOT NULL DEFAULT 'sample',
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON user_templates(user_id);

-- 4. 기존에 선택되어 있던 템플릿이 있으면 복원 (is_selected = true 였던 것)
INSERT INTO user_templates (user_id, template, source_type, source_id, created_at)
SELECT
  user_id,
  template,
  CASE WHEN is_sample THEN 'sample' ELSE 'custom' END,
  CASE WHEN is_sample THEN NULL ELSE id END,
  created_at
FROM user_templates_backup
WHERE is_selected = true
ON CONFLICT (user_id) DO NOTHING;

-- 백업 테이블 삭제 (선택적)
-- DROP TABLE IF EXISTS user_templates_backup;
