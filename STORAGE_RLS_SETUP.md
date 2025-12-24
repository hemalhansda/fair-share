# Supabase Storage RLS Policy Setup

## Issue
Getting `403 Unauthorized` error when uploading profile pictures:
```
{
    "statusCode": "403",
    "error": "Unauthorized",
    "message": "new row violates row-level security policy"
}
```

## Solution: Update Storage RLS Policies

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com/
   - Select your project (`fair-share`)

2. **Open Storage Settings**
   - Click on **Storage** in the left sidebar
   - Click on your bucket: **expense-files**
   - Go to **Policies** tab

3. **Add Upload Policy for Profile Pictures**

   Click **New Policy** → **For full customization** → Create policy with these details:

   **Policy Name:** `Allow authenticated users to upload profile pictures`
   
   **Allowed Operation:** `INSERT`
   
   **Target Roles:** `authenticated`
   
   **WITH CHECK expression:**
   ```sql
   (bucket_id = 'expense-files'::text AND 
    (storage.foldername(name))[1] = 'profile-pictures'::text AND
    auth.uid()::text = (storage.foldername(name))[2])
   ```

   This policy allows authenticated users to upload to their own profile-pictures folder.

4. **Add Upload Policy for Expense Receipts** (if not already exists)

   **Policy Name:** `Allow authenticated users to upload expense receipts`
   
   **Allowed Operation:** `INSERT`
   
   **Target Roles:** `authenticated`
   
   **WITH CHECK expression:**
   ```sql
   (bucket_id = 'expense-files'::text AND 
    (storage.foldername(name))[1] = 'expense-receipts'::text)
   ```

5. **Add Read Policy for All Files**

   **Policy Name:** `Allow authenticated users to read all files`
   
   **Allowed Operation:** `SELECT`
   
   **Target Roles:** `authenticated`
   
   **WITH CHECK expression:**
   ```sql
   bucket_id = 'expense-files'::text
   ```

6. **Add Update Policy** (Optional - for updating profile pictures)

   **Policy Name:** `Allow users to update their own profile pictures`
   
   **Allowed Operation:** `UPDATE`
   
   **Target Roles:** `authenticated`
   
   **WITH CHECK expression:**
   ```sql
   (bucket_id = 'expense-files'::text AND 
    (storage.foldername(name))[1] = 'profile-pictures'::text AND
    auth.uid()::text = (storage.foldername(name))[2])
   ```

7. **Add Delete Policy** (Optional - for deleting old profile pictures)

   **Policy Name:** `Allow users to delete their own profile pictures`
   
   **Allowed Operation:** `DELETE`
   
   **Target Roles:** `authenticated`
   
   **USING expression:**
   ```sql
   (bucket_id = 'expense-files'::text AND 
    (storage.foldername(name))[1] = 'profile-pictures'::text AND
    auth.uid()::text = (storage.foldername(name))[2])
   ```

### Option 2: Using SQL (Advanced)

Run this SQL in the **SQL Editor** in Supabase Dashboard:

```sql
-- Policy for uploading profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-files' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy for uploading expense receipts
CREATE POLICY "Allow authenticated users to upload expense receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-files' AND
  (storage.foldername(name))[1] = 'expense-receipts'
);

-- Policy for reading all files
CREATE POLICY "Allow authenticated users to read all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-files');

-- Policy for updating profile pictures
CREATE POLICY "Allow users to update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expense-files' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'expense-files' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy for deleting profile pictures
CREATE POLICY "Allow users to delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'expense-files' AND
  (storage.foldername(name))[1] = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

### Option 3: Temporary - Make Bucket Public (NOT Recommended for Production)

⚠️ **Only use this for testing. Not secure for production!**

1. Go to Storage → expense-files
2. Click **Configuration**
3. Toggle **Public bucket** to ON

**Note:** This makes ALL files publicly accessible. Use proper RLS policies for production.

## Verification

After setting up policies:

1. **Test Upload**
   - Try uploading a profile picture again
   - Should work without 403 error

2. **Check Logs**
   - Go to Supabase Dashboard → Logs → Storage
   - Verify successful uploads

3. **Test Access**
   - View your profile picture in the app
   - Image should display correctly

## Fallback Behavior

The app is already configured to fallback to base64 encoding if Storage upload fails:

✅ **Automatic Fallback** - If RLS policies aren't set up yet, profile pictures will be stored as base64 in the database (limited to 2MB)

However, for better performance and scalability, **setup proper RLS policies** as shown above.

## Folder Structure

Your storage bucket will have this structure:

```
expense-files/
├── expense-receipts/
│   ├── expense_123_timestamp.jpg
│   ├── expense_456_timestamp.png
│   └── ...
└── profile-pictures/
    ├── user_id_1_timestamp.jpg
    ├── user_id_2_timestamp.png
    └── ...
```

## Security Notes

1. **User Isolation**: Profile pictures are stored in folders named after user IDs
2. **Authentication Required**: Only authenticated users can upload
3. **Own Files Only**: Users can only upload to their own profile-pictures folder
4. **Read Access**: Authenticated users can read all files (needed for viewing other users' profiles)

## Troubleshooting

### Still getting 403 errors?

1. **Check if policies are enabled**
   - Storage → expense-files → Policies
   - Make sure policies are active (not disabled)

2. **Verify user is authenticated**
   - Check if `auth.uid()` is not null
   - User should be logged in via Supabase Auth

3. **Check folder structure**
   - Profile pictures must be in `profile-pictures/{userId}/` format
   - The app automatically creates this structure

4. **Review policy conditions**
   - Make sure the SQL expressions are correct
   - Test policies in Supabase dashboard

### Alternative: Skip Storage for Now

If you want to bypass Storage issues temporarily:

The app will automatically use base64 storage as a fallback. This works but:
- ❌ Limited to 2MB images
- ❌ Increases database size
- ❌ Slower performance
- ✅ But it works without any setup!

**For production, setup proper RLS policies.**

---

## Summary

✅ **Quick Fix**: The app now has better fallback handling and will work with base64
✅ **Proper Fix**: Set up RLS policies as shown above for best performance
✅ **Either way**: Your users can upload profile pictures!
