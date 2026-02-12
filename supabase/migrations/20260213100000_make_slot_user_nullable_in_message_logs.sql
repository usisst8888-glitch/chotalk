-- message_logs에서 slot_id, user_id를 nullable로 변경
-- 방번호만 있고 아가씨 매칭이 없는 메시지도 저장하기 위함

ALTER TABLE message_logs ALTER COLUMN slot_id DROP NOT NULL;
ALTER TABLE message_logs ALTER COLUMN user_id DROP NOT NULL;
