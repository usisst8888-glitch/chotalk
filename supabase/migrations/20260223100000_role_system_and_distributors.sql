-- 1) 기존 admin → superadmin
UPDATE users SET role = 'superadmin' WHERE role = 'admin';

-- 2) users 테이블 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR(200);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);

-- 3) 총판 설정 테이블
CREATE TABLE IF NOT EXISTS distributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  site_name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4f46e5',
  secondary_color VARCHAR(7) DEFAULT '#7c3aed',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
