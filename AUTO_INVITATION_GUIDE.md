# Auto Group Invitation Feature - Test Guide

## Overview
When a user creates a group and adds members by email addresses, those emails are stored as "pending invitations." When someone signs up to fyrShare with an email that has pending invitations, they are automatically added to those groups.

## Test Scenario

### Step 1: Create a Group with Email Invitations
1. Login as `hemal.codework@gmail.com` (or any existing user)
2. Go to Groups page
3. Click "Add Group"
4. Enter group name: `Manali Trip`
5. Select type: `Trip`
6. In the "Invite by email" section, add: `pujashow6@gmail.com`
7. Click "Add" to add the email
8. Click "Create Group"

**What happens behind the scenes:**
- Group is created with `hemal.codework@gmail.com` as a member
- A placeholder user is created in `users` table for `pujashow6@gmail.com` (with `google_id` = null)
- The placeholder user is added to the "Manali Trip" group as a regular member
- Both real and placeholder users appear in the group members list

### Step 2: New User Signs Up
1. Logout from the current account
2. Sign up with `pujashow6@gmail.com` (using Google OAuth)

**What happens behind the scenes:**
- System finds the existing placeholder user for `pujashow6@gmail.com`
- Placeholder user is converted to a real user by updating with Google OAuth data
- No new user record is created - the existing placeholder is upgraded
- User is already a member of "Manali Trip" group (no additional membership needed)
- Success message shows: "Welcome! You've been automatically added to 1 group you were invited to."

### Step 3: Verify Auto-Addition
1. After signup, navigate to Groups page
2. The "Manali Trip" group should be visible
3. Click on the group to see group details
4. Both users should be listed as members

## Database Schema Added

### New Table: `pending_invitations`
```sql
CREATE TABLE pending_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, email)
);
```

## New Functions Added

1. `convertPlaceholderUser(userEmail, googleUserData)` - Converts placeholder users to real users
2. `createPendingInvitation(groupId, email, invitedBy)` - Creates pending invitations (fallback)
3. `getPendingInvitationsForEmail(email)` - Gets pending invitations (fallback)
4. `acceptPendingInvitations(userEmail, userUuid)` - Processes pending invitations (fallback)

## Modified Functions

1. `createGroup()` - Now creates placeholder users for email addresses instead of pending invitations
2. `createOrUpdateUser()` - Now checks for and converts placeholder users to real users
3. `handleGoogleCallback()` - Shows success message when users are auto-added to groups

## UI Changes

### AddGroupModal
- Added email invitation input field
- Users can now add members by email address
- Shows both existing users and email invitations in the member summary
- Email invitations are highlighted in amber color to distinguish from existing users

## Testing Notes

- The feature works both in development and production
- Email addresses are stored in lowercase for consistency
- Placeholder users are created immediately when adding email addresses to groups
- Placeholder users have `google_id = null` and appear in group member lists
- When someone signs up with a placeholder email, the placeholder is converted to a real user
- If placeholder creation fails, the system falls back to pending invitations
- The system gracefully handles conversion failures and maintains data integrity
- Users see groups immediately upon signup without any additional processing needed