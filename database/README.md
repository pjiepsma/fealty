# Dictaat Database Schema

This directory contains the complete Supabase database schema for the Dictaat app.

## Files

- `schema.sql` - Complete database schema with tables, functions, triggers, and policies

## Setup Instructions

1. **Create a Supabase project** at https://supabase.com
2. **Open the SQL Editor** in your Supabase dashboard
3. **Copy and paste** the contents of `schema.sql`
4. **Run the SQL** to create all tables, functions, and policies

## Database Features

### Tables
- **users** - Extends Supabase auth.users with profile data
- **pois** - Points of Interest with PostGIS spatial data
- **claims** - Claim records with time tracking
- **active_sessions** - Current claiming sessions
- **user_stats** - Cached user statistics
- **monthly_leaderboard** - Monthly ranking system

### Key Features
- **PostGIS Integration** - Advanced geospatial queries
- **Automatic Triggers** - Real-time stats and leaderboard updates
- **Row Level Security** - Secure data access policies
- **Performance Indexes** - Optimized for common queries

### Functions
- `nearby_pois()` - Find POIs within radius
- `poi_leaderboard()` - Get monthly POI rankings
- `update_user_stats()` - Maintain user statistics
- `cleanup_inactive_sessions()` - Database maintenance

### Sample Data
The schema includes a test POI (Coehoorn Park, Apeldoorn) for development.

## Environment Variables

Make sure to add these to your `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

After setting up the database:
1. Test the connection with your app
2. Implement user authentication
3. Create the map and POI claiming UI
4. Add leaderboard displays
