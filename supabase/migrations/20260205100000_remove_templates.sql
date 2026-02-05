-- 템플릿 관련 테이블 및 컬럼 제거

-- 1. message_logs 테이블에서 user_template_id 컬럼 제거
ALTER TABLE message_logs DROP COLUMN IF EXISTS user_template_id;

-- 2. status_board 테이블에서 user_template_id 컬럼 제거
ALTER TABLE status_board DROP COLUMN IF EXISTS user_template_id;

-- 3. slots 테이블에서 user_template_id 컬럼 제거 (존재하는 경우)
ALTER TABLE slots DROP COLUMN IF EXISTS user_template_id;

-- 4. user_templates 테이블 삭제 (CASCADE로 관련 외래키도 함께 제거)
DROP TABLE IF EXISTS user_templates CASCADE;

-- 5. custom_templates 테이블 삭제
DROP TABLE IF EXISTS custom_templates CASCADE;
