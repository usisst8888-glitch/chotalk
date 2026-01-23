-- 만료된 슬롯 자동 비활성화 함수
-- 만료일이 2월 20일이면 2월 21일 00:00에 비활성화
-- (만료일 당일까지는 활성화 유지)
CREATE OR REPLACE FUNCTION deactivate_expired_slots()
RETURNS void AS $$
BEGIN
  UPDATE slots
  SET is_active = false
  WHERE is_active = true
    AND expires_at::date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- pg_cron 확장 활성화 (Supabase에서 이미 활성화되어 있을 수 있음)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매일 자정(00:00)에 만료된 슬롯 비활성화 실행
-- Supabase Dashboard > SQL Editor에서 직접 실행 필요:
-- SELECT cron.schedule('deactivate-expired-slots', '0 0 * * *', 'SELECT deactivate_expired_slots()');

-- 크론 작업 확인:
-- SELECT * FROM cron.job;

-- 크론 작업 삭제 (필요시):
-- SELECT cron.unschedule('deactivate-expired-slots');
