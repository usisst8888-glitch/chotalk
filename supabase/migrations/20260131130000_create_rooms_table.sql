-- rooms 테이블 (방 상태 추적)
-- 방이 열리고 닫히는 것을 추적하여 신규방/기존방 판별에 사용

CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number VARCHAR(50) NOT NULL,
  shop_name VARCHAR(100) NOT NULL,
  room_start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,  -- 방이 열린 시간 (한국 시간)
  is_active BOOLEAN DEFAULT TRUE,                         -- 진행 중인지
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT get_korean_time()
);

-- 인덱스: 활성 방 조회용
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(room_number, shop_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rooms_shop_name ON rooms(shop_name);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);

COMMENT ON TABLE rooms IS '방 상태 추적 테이블 (신규방/기존방 판별용)';
COMMENT ON COLUMN rooms.room_start_time IS '방이 열린 시간 (첫 아가씨 시작 시간)';
COMMENT ON COLUMN rooms.is_active IS '방 진행 중 여부 (모든 아가씨 ㄲ 시 false)';
