-- Temporary fix: Disable RLS for development
-- Run this in Supabase SQL Editor for quick testing

-- Disable RLS on all tables temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable RLS later for production:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;