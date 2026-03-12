-- 아톡 테이블에 발송 여부 컬럼 추가
ALTER TABLE aktalk_atok ADD COLUMN is_sent BOOLEAN NOT NULL DEFAULT false;
