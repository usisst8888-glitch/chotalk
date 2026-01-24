-- sender_logs 테이블에 kakao_id, target_room 컬럼 추가
-- Python 스크립트가 해당 카카오 아이디로 타겟 방에 메시지 전송용

ALTER TABLE sender_logs ADD COLUMN IF NOT EXISTS kakao_id VARCHAR(100);
ALTER TABLE sender_logs ADD COLUMN IF NOT EXISTS target_room VARCHAR(200);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sender_logs_kakao_id ON sender_logs(kakao_id);
CREATE INDEX IF NOT EXISTS idx_sender_logs_target_room ON sender_logs(target_room);
