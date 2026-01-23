-- user_templates 테이블 수정: 여러 템플릿 지원 + 샘플 템플릿

-- 1. UNIQUE 제약 조건 제거 (user_id)
ALTER TABLE user_templates DROP CONSTRAINT IF EXISTS user_templates_user_id_key;

-- 2. 새 컬럼 추가
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS is_sample BOOLEAN DEFAULT FALSE;
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT FALSE;

-- 3. 기존 데이터에 기본값 설정
UPDATE user_templates SET name = '내 템플릿' WHERE name IS NULL;
UPDATE user_templates SET is_selected = true WHERE is_selected IS NULL;

-- 4. name NOT NULL 제약 조건 추가
ALTER TABLE user_templates ALTER COLUMN name SET NOT NULL;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_templates_is_selected ON user_templates(is_selected) WHERE is_selected = true;
