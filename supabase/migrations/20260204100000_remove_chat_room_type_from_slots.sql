-- slots 테이블에서 chat_room_type 컬럼 삭제
ALTER TABLE slots DROP COLUMN IF EXISTS chat_room_type;
