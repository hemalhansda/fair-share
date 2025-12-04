-- Quick fix for groups RLS policy
-- Run this SQL in your Supabase SQL Editor

-- Drop all existing group policies and create a simple one
DROP POLICY IF EXISTS "Users can view groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;

-- Create simple authenticated user policies for groups
CREATE POLICY "Authenticated users can manage groups" ON groups
  FOR ALL USING (auth.role() = 'authenticated');