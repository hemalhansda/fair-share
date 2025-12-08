-- Add pending invitations table to handle email-based group invitations
-- This allows users to be invited to groups before they sign up

CREATE TABLE pending_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, email) -- Prevent duplicate invitations to the same group
);

-- Enable RLS for pending invitations
ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending invitations
-- Group members can view pending invitations for their groups
CREATE POLICY "Group members can view pending invitations" ON pending_invitations
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Group creators can manage pending invitations
CREATE POLICY "Group creators can manage pending invitations" ON pending_invitations
  FOR ALL USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE created_by = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX idx_pending_invitations_email ON pending_invitations(email);
CREATE INDEX idx_pending_invitations_group_id ON pending_invitations(group_id);