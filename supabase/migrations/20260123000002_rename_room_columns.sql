-- 컬럼명 변경: 헷갈리지 않게 명확한 이름으로 변경
-- source_room: 메시지 감지된 방 (초톡방)
-- target_room: 발송할 채팅방

-- slots 테이블: chat_room_name → target_room
ALTER TABLE slots RENAME COLUMN chat_room_name TO target_room;

-- message_logs 테이블: room_name → source_room
ALTER TABLE message_logs RENAME COLUMN room_name TO source_room;

-- message_logs 테이블: chat_room_name → target_room
ALTER TABLE message_logs RENAME COLUMN chat_room_name TO target_room;
