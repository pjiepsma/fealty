# Authentication Setup Guide

## ✅ Implementation Complete

Your Fealty app now has full authentication! Here's what's been implemented:

### 🔐 Features Implemented

1. **User Registration (Sign Up)**
   - Email + Password + Username
   - Automatic user profile creation
   - Email verification (optional via Supabase)

2. **User Login**
   - Email + Password authentication
   - Session management
   - Automatic redirect to map on success

3. **Auth Guards**
   - Protected routes (map, rankings, profile)
   - Automatic redirect to login if not authenticated
   - Loading state while checking auth

4. **User Profile**
   - Display username, email, and stats
   - Sign out functionality with confirmation
   - Stats display (minutes captured, POIs claimed, etc.)

5. **AuthProvider Context**
   - Global user state
   - Session management
   - Auto-refresh on auth state changes

---

## 🚀 How to Set Up Supabase

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New project"
5. Fill in:
   - **Name:** `fealty`
   - **Database Password:** (save this!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier is perfect to start

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. Copy these values:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Configure Environment Variables

1. Open your `.env` file (create if it doesn't exist)
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Set Up Database Schema

1. In Supabase dashboard, click "SQL Editor"
2. Click "New query"
3. Copy the contents of `database/schema.sql` and paste it
4. Click "Run" to create all tables

This will create:
- `users` table
- `user_stats` table
- `pois` table
- `claims` table
- `leaderboard` view

### Step 5: Configure Authentication

1. In Supabase dashboard, click "Authentication"
2. Click "Providers"
3. Make sure **Email** is enabled (it should be by default)
4. Optional: Configure email templates in "Email Templates"

#### Recommended Settings:

**For Development:**
- Disable "Confirm email" (in Settings → Auth → Email Auth)
- Set "Site URL" to your dev URL

**For Production:**
- Enable "Confirm email"
- Configure custom email templates
- Add your production URL to "Redirect URLs"

---

## 🧪 Testing the Authentication Flow

### Test Sign Up

1. Run your app: `npx expo start`
2. Click "Sign Up"
3. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Sign Up"
5. Check Supabase dashboard → Authentication → Users (you should see your user!)

### Test Login

1. Click "Login"
2. Enter the same credentials
3. You should be redirected to the Map screen

### Test Profile

1. Navigate to the "Profile" tab
2. You should see:
   - Your username
   - Your email
   - Your stats (all zeros initially)
3. Click "Sign Out"
4. Confirm sign out
5. You should be redirected to login

### Test Auth Guards

1. After signing out, try to navigate to map/rankings/profile
2. You should automatically be redirected to login

---

## 🔧 Troubleshooting

### "Invalid login credentials"
- Make sure you've run the database schema
- Check that email confirmation is disabled for development
- Verify your .env variables are correct

### "Failed to create user profile"
- Check that the `users` table exists
- Verify RLS (Row Level Security) policies are set correctly
- Check Supabase logs in Dashboard → Logs

### "Repository not found" (Supabase)
- Make sure you've entered the correct URL
- Check that your anon key is complete (it's very long!)
- Restart Expo: `npx expo start --clear`

### User stats not showing
- Run the database schema to create `user_stats` table
- The stats will be automatically created on first capture

---

## 📋 Next Steps

Now that authentication is set up, you can:

1. **Start Capturing POIs:** Walk to a location and test the capture flow
2. **Build Rankings:** Implement the leaderboard with real Supabase data
3. **Add Social Features:** Friends, teams, challenges
4. **Deploy:** Publish to App Store / Google Play

---

## 🔒 Security Notes

- ✅ `.env` is in `.gitignore` (never commit secrets!)
- ✅ Using Supabase RLS (Row Level Security)
- ✅ Passwords are hashed by Supabase Auth
- ✅ anon key is safe for client-side use
- ⚠️ Never commit your service_role key (we're not using it)

---

## 📱 Current Auth Flow

```
App Launch
    ↓
Check Auth Session
    ↓
┌─────────────┬─────────────┐
│  Logged In  │ Not Logged  │
│             │     In      │
└──────┬──────┴──────┬──────┘
       ↓             ↓
   Map Screen   Login Screen
       │             │
       │         Sign Up ←──┐
       │             │      │
       │         Success    │
       │             │      │
       └─────────────┤      │
                     ↓      │
              Profile Screen│
                     │      │
                Sign Out────┘
```

---

**Authentication is now fully implemented and ready to use! 🎉**

