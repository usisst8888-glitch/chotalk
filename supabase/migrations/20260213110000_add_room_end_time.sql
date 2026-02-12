-- rooms 테이블에 room_end_time 컬럼 추가
-- 방 종료 시 checkAndCloseRoom에서 기록

ALTER TABLE rooms ADD COLUMN room_end_time TIMESTAMP WITHOUT TIME ZONE;
