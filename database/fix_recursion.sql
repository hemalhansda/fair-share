-- Fix infinite recursion in RLS policies
-- Run this SQL in your Supabase SQL Editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage memberships" ON group_members;

-- Create simpler, non-recursive policies for group_members
CREATE POLICY "Users can view memberships they're part of" ON group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create group memberships" ON group_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own memberships" ON group_members
  FOR DELETE USING (user_id = auth.uid());

-- Also fix the groups policy to avoid recursion
DROP POLICY IF EXISTS "Users can view their groups" ON groups;

CREATE POLICY "Users can view groups" ON groups
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix expense_splits policies to avoid recursion
DROP POLICY IF EXISTS "Users can view related expense splits" ON expense_splits;
DROP POLICY IF EXISTS "Expense payers can manage splits" ON expense_splits;

-- Create simpler policies for expense_splits
CREATE POLICY "Users can view expense splits" ON expense_splits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create expense splits" ON expense_splits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update expense splits" ON expense_splits
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete expense splits" ON expense_splits
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also simplify expenses policies
DROP POLICY IF EXISTS "Users can view related expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Expense payers can update their expenses" ON expenses;

CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create expenses" ON expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update expenses" ON expenses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete expenses" ON expenses
  FOR DELETE USING (auth.role() = 'authenticated');