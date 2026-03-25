-- 담당웨이터 테이블 (공지방 메시지에서 방번호별 웨이터 추출)
CREATE TABLE IF NOT EXISTS waiter_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  waiter_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  UNIQUE(shop_name, room_number)
);

CREATE INDEX IF NOT EXISTS idx_waiter_assignments_shop_name ON waiter_assignments(shop_name);
CREATE INDEX IF NOT EXISTS idx_waiter_assignments_room_number ON waiter_assignments(room_number);
