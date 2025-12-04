-- Run this SQL in your Supabase SQL Editor to fix the friend creation issue

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create a more flexible policy that allows:
-- 1. Users to insert their own profile (Google OAuth)
-- 2. Authenticated users to create friend records (without google_id)
CREATE POLICY "Users can create profiles" ON users
  FOR INSERT WITH CHECK (
    -- Allow users to create their own profile (Google OAuth flow)
    auth.uid() = id::uuid OR 
    -- Allow authenticated users to create friends (friends don't have google_id)
    (auth.uid() IS NOT NULL AND google_id IS NULL)
  );

-- Alternative: If the above doesn't work, you can temporarily disable RLS for testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable it later: ALTER TABLE users ENABLE ROW LEVEL SECURITY;