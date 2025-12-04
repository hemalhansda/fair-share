# FairShare Database Setup Guide

This project uses **Supabase** as a free PostgreSQL database with real-time capabilities and built-in authentication.

## Quick Setup

### 1. Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Set Up Database Schema
1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `database/schema.sql`
3. Run the SQL to create all tables and policies

### 3. Configure Environment Variables
1. In your Supabase project dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public key**
3. Update your `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GOOGLE_CLIENT_ID=372713663318-11ob025d5sp4j0l6ec8kebpmhm9fldt9.apps.googleusercontent.com
```

### 4. Enable Google Authentication (Optional)
1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable Google OAuth
3. Add your Google Client ID and Secret
4. Add your domain to authorized domains

## Database Schema

The app uses 5 main tables:

- **users**: Store user profiles from Google OAuth
- **groups**: Expense groups (trips, apartments, etc.)
- **group_members**: Junction table for group memberships
- **expenses**: Individual expense records
- **expense_splits**: How expenses are split between users

## Features

✅ **Free Tier Limits:**
- 500MB database storage
- 2GB bandwidth per month
- Up to 50,000 monthly active users
- Real-time subscriptions

✅ **Automatic Features:**
- Row Level Security (RLS) policies
- User authentication integration
- Real-time data synchronization
- Automatic timestamps

## Demo Mode

If no database is configured, the app automatically runs in **Demo Mode** with sample data. This means:

- No database connection required for testing
- Sample users, groups, and expenses are loaded
- All data is stored locally (resets on page refresh)
- Perfect for development and demonstrations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will detect if database is configured
# If not, it runs in demo mode automatically
```

## Production Deployment

For production, make sure to:

1. Set up your Supabase project
2. Configure environment variables
3. Enable RLS policies (already included in schema)
4. Set up proper domain authentication

## Troubleshooting

**App shows demo data even with database configured:**
- Check your `.env` file has correct Supabase credentials
- Verify the credentials in Supabase dashboard
- Check browser console for connection errors

**Database connection errors:**
- Verify your Supabase project is active
- Check the Project URL format: `https://xxxxx.supabase.co`
- Ensure the anon key is correct (starts with `eyJ`)

**RLS Policy errors:**
- Make sure you ran the complete schema.sql
- Verify authentication is working
- Check Supabase logs in the dashboard