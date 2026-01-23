-- Add role column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
