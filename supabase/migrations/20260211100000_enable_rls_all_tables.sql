-- ========================================
-- 모든 테이블에 Row Level Security (RLS) 활성화
-- 서버는 service_role 키를 사용하므로 RLS를 무시함
-- anon 키로 직접 접근 시 모든 작업이 차단됨
-- ========================================

-- 1. users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. slots
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- 3. message_logs
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- 4. status_board
ALTER TABLE status_board ENABLE ROW LEVEL SECURITY;

-- 5. status_board_history
ALTER TABLE status_board_history ENABLE ROW LEVEL SECURITY;

-- 6. rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 7. kakao_invite_ids
ALTER TABLE kakao_invite_ids ENABLE ROW LEVEL SECURITY;

-- 8. slot_extension_requests
ALTER TABLE slot_extension_requests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS 정책 없이 ENABLE만 하면 기본적으로 모든 접근 차단
-- service_role 키는 RLS를 무시하므로 앱 동작에 영향 없음
-- ========================================
