-- status_board 테이블에 kakao_id와 target_room 컬럼 추가
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS kakao_id TEXT;
ALTER TABLE status_board ADD COLUMN IF NOT EXISTS target_room TEXT;

COMMENT ON COLUMN status_board.kakao_id IS '카카오 초대 ID';
COMMENT ON COLUMN status_board.target_room IS '타겟 채팅방 이름';
