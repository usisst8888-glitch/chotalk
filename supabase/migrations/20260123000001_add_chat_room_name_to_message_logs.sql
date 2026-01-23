-- message_logs에 chat_room_name 컬럼 추가 (슬롯에 등록된 채팅방 이름)

ALTER TABLE message_logs
ADD COLUMN IF NOT EXISTS chat_room_name VARCHAR(255);
