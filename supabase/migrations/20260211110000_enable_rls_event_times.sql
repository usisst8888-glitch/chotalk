-- event_times 테이블 RLS 활성화 (이전 마이그레이션에서 누락)
ALTER TABLE event_times ENABLE ROW LEVEL SECURITY;
