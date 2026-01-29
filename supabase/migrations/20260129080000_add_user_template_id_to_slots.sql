-- slots 테이블에 user_template_id 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS user_template_id UUID REFERENCES user_templates(id);

COMMENT ON COLUMN slots.user_template_id IS '사용자 템플릿 ID';
