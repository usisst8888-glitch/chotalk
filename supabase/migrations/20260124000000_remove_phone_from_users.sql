-- Remove phone column from users table

-- Drop the index first
DROP INDEX IF EXISTS idx_users_phone;

-- Remove the phone column
ALTER TABLE users DROP COLUMN IF EXISTS phone;

-- Add username index if not exists
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
