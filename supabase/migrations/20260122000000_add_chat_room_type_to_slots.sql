-- slots 테이블에 chat_room_type 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS chat_room_type VARCHAR(20) DEFAULT 'group' CHECK (chat_room_type IN ('group', 'open'));

-- 기존 데이터에 기본값 설정
UPDATE slots SET chat_room_type = 'group' WHERE chat_room_type IS NULL;
