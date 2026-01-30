-- shop_closing_times를 event_times로 변경
-- 시작 시간과 종료 시간을 모두 관리

-- 새 테이블 생성
CREATE TABLE event_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL UNIQUE,
  start_time TIME NOT NULL DEFAULT '18:00',
  end_time TIME NOT NULL DEFAULT '23:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE event_times IS '가게별 이벤트 시간 관리';
COMMENT ON COLUMN event_times.start_time IS '이벤트 시작 시간';
COMMENT ON COLUMN event_times.end_time IS '이벤트 종료 시간';

-- 기존 데이터 마이그레이션 (closing_time을 end_time으로)
INSERT INTO event_times (id, shop_name, end_time, is_active, created_at, updated_at)
SELECT id, shop_name, closing_time, is_active, created_at, updated_at
FROM shop_closing_times;

-- 기존 테이블 삭제
DROP TABLE shop_closing_times;
