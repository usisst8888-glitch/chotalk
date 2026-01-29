-- status_board 테이블에 user_template_id 컬럼 추가
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS user_template_id UUID REFERENCES user_templates(id);

COMMENT ON COLUMN status_board.user_template_id IS '사용자 템플릿 ID';
