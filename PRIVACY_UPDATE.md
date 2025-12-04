# Database Schema Updates Required

## 1. Privacy & Friendships Table

To implement proper user privacy and friend relationships, you need to create a `friendships` table in your Supabase database:

```sql
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure no duplicate friendships
  UNIQUE(user_id, friend_id)
);

-- Add indexes for better performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own friendships
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ) AND (user_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ) OR friend_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  )));

-- Policy: Users can create friendships involving themselves
CREATE POLICY "Users can create own friendships" ON friendships
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ) OR friend_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ));

-- Policy: Users can delete their own friendships
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ) OR friend_id IN (
    SELECT id FROM users WHERE google_id = auth.jwt() ->> 'sub'
  ));
```

## 2. Currency Support

Add currency support to expenses and user preferences:

```sql
-- Add currency column to expenses table
ALTER TABLE expenses 
ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Add preferred currency to users table
ALTER TABLE users 
ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD' NOT NULL;

-- Add index for currency queries
CREATE INDEX idx_expenses_currency ON expenses(currency);
CREATE INDEX idx_users_preferred_currency ON users(preferred_currency);
```

## Features Implemented

### Privacy & Security
1. **User Isolation**: Users now only see their own friends, groups, and expenses
2. **Friend Relationships**: Proper bidirectional friendship tracking
3. **Group Access Control**: Only group members can see group data
4. **Expense Privacy**: Only expenses where user is involved are visible
5. **Demo Mode Isolation**: Each user gets their own isolated demo data

### Currency Support
1. **Multi-Currency Expenses**: Each expense can be in any supported currency
2. **User Preferences**: Users can set their preferred display currency
3. **Automatic Conversion**: Expenses are converted to user's preferred currency for display
4. **Live Exchange Rates**: Uses real-time exchange rates from ExchangeRate-API
5. **20+ Currencies Supported**: USD, EUR, GBP, JPY, CNY, INR, THB, SGD, AUD, CAD, etc.
6. **Original Currency Display**: Shows both converted and original amounts
7. **Offline Fallback**: Cached rates and fallback rates for offline usage

## Security Features

- Row Level Security (RLS) policies protect data access
- Friend relationships are properly tracked in database
- No cross-user data leakage
- Demo mode creates user-specific isolated environments
- Currency conversion uses secure API with caching
- Exchange rate caching prevents API abuse