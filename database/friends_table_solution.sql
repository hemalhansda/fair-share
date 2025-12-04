-- Alternative approach: Create a separate friends table
-- This is the most secure and scalable solution

-- Create a friends table for non-authenticated users
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on friends table
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own friends
CREATE POLICY "Users can manage their friends" ON friends
  FOR ALL USING (created_by = auth.uid());

-- Create a view that combines users and friends for easy querying
CREATE OR REPLACE VIEW all_contacts AS
SELECT 
  id,
  name,
  email,
  avatar,
  picture,
  'user'::text as type,
  google_id,
  created_at,
  updated_at
FROM users
UNION ALL
SELECT 
  id,
  name,
  email,
  avatar,
  null as picture,
  'friend'::text as type,
  null as google_id,
  created_at,
  updated_at
FROM friends;