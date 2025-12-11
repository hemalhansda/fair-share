# Group Default Currency Feature

## Database Migration Required

You need to run the SQL migration to add the `default_currency` column to the `groups` table:

### Step 1: Run the SQL migration

**File:** `add_group_currency_column.sql`

```sql
-- Add default_currency column to groups table
-- This allows each group to have its own default currency

ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'USD';

-- Add comment to column for documentation
COMMENT ON COLUMN groups.default_currency IS 'Three-letter ISO 4217 currency code for group default (e.g., USD, INR, EUR)';
```

**How to run:**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL from `add_group_currency_column.sql`
5. Click **Run**

## What's Been Implemented

### 1. **Add Group Modal** (`AddGroupModal.jsx`)
- Added currency selector when creating a new group
- Default currency is set to USD
- Shows helpful text: "This will be the default currency for expenses in this group"

### 2. **Edit Group Modal** (`EditGroupModal.jsx`)
- Added currency selector when editing an existing group
- Displays current group's default currency
- Allows changing the default currency for the group

### 3. **Database Functions** (`database.js`)
- `createGroup`: Now saves `default_currency` field
- `updateGroup`: Now updates `default_currency` field
- `getUserGroups`: Now fetches `default_currency` field

### 4. **Add Expense Modal** (`AddExpenseModal.jsx`)
- Automatically sets the expense currency to the group's default currency when a group is selected
- Users can still manually change the currency if needed

## User Flow

### Creating a Group
1. User clicks "Create Group"
2. Fills in group name and type
3. **NEW:** Selects default currency (USD, INR, EUR, etc.)
4. Adds members
5. Creates group

### Adding an Expense to a Group
1. User clicks "Add Expense"
2. Selects a group
3. **AUTOMATIC:** Currency is pre-filled with the group's default currency
4. User can change currency if needed for this specific expense
5. Fills in other details and saves

### Editing a Group
1. User opens group details
2. Clicks "Edit Group"
3. **NEW:** Can change the default currency for the group
4. Updates other details
5. Saves changes

## Benefits

- **Consistency:** All expenses in a group default to the same currency
- **Convenience:** Users don't need to manually select currency for every expense
- **Flexibility:** Users can still override the currency for individual expenses if needed
- **Multi-currency support:** Different groups can have different default currencies (e.g., "India Trip" in INR, "Europe Trip" in EUR)

## Testing

After running the migration, test:
1. ✅ Create a new group with INR as default currency
2. ✅ Add an expense to that group - it should default to INR
3. ✅ Edit the group and change currency to EUR
4. ✅ Add another expense - it should now default to EUR
5. ✅ Verify existing groups default to USD
