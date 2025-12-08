-- Migration script to support placeholder users
-- This script ensures the database can handle the new placeholder user approach

-- The existing schema already supports this approach since:
-- 1. users.google_id can be NULL (for placeholder users)
-- 2. RLS policies allow creating users with NULL google_id
-- 3. group_members table can reference placeholder users

-- However, we should add an index to optimize lookups for placeholder users
CREATE INDEX IF NOT EXISTS idx_users_email_null_google_id ON users(email) WHERE google_id IS NULL;

-- Optional: Add a constraint to ensure placeholder users have valid email addresses
-- ALTER TABLE users ADD CONSTRAINT valid_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

-- The pending_invitations table is still useful as a fallback mechanism
-- No changes needed to existing pending_invitations functionality