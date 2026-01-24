-- 가게별 마감 시간 관리 테이블
CREATE TABLE shop_closing_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name VARCHAR(100) NOT NULL UNIQUE,
  closing_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 가게 데이터 삽입 (기본 마감시간 23:00)
INSERT INTO shop_closing_times (shop_name, closing_time) VALUES
  ('도파민', '23:00'),
  ('유앤미', '23:00'),
  ('달토', '23:00'),
  ('퍼펙트', '23:00'),
  ('엘리트', '23:00');
