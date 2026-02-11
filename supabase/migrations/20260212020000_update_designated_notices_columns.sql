-- room_number 컬럼 제거
ALTER TABLE designated_notices DROP COLUMN room_number;

-- 발송 성공 여부 컬럼 추가
ALTER TABLE designated_notices ADD COLUMN send_success BOOLEAN;
