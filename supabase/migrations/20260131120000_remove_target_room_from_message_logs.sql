-- message_logs에서 사용하지 않는 target_room 컬럼 삭제

ALTER TABLE message_logs DROP COLUMN IF EXISTS target_room;
