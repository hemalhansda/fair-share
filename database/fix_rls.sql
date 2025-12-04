-- Run this SQL in your Supabase SQL Editor to fix the RLS issue
-- This is a more permissive approach for development

-- First, drop the existing policy
DROP POLICY IF EXISTS "Users can create profiles" ON users;

-- Option 1: More permissive policy (recommended for development)
CREATE POLICY "Allow authenticated user operations" ON users
  FOR INSERT WITH CHECK (
    -- Allow if user is authenticated (any authenticated user can create friends)
    auth.role() = 'authenticated'
  );

-- Option 2: If Option 1 doesn't work, temporarily disable RLS for users table
-- Uncomment the lines below if you want to disable RLS temporarily:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Option 3: Create a separate friends table (most secure approach)
-- This would be the best long-term solution but requires more changes