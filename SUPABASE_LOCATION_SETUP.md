# 🗄️ Supabase Database Setup Guide

This guide will help you set up the required database schema for the Fealty app's location and rankings features.

## 📋 Prerequisites

- Supabase project created
- Access to SQL Editor in Supabase Dashboard
- Environment variables configured in `.env`

---

## 🚀 Step 1: Add Location Columns to Users Table

Run this SQL in the **SQL Editor**:

```sql
-- Add location fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS home_country TEXT DEFAULT 'Netherlands',
ADD COLUMN IF NOT EXISTS home_city TEXT,
ADD COLUMN IF NOT EXISTS home_city_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS home_city_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location_update_count INTEGER DEFAULT 0;

-- Add indexes for faster location-based queries
CREATE INDEX IF NOT EXISTS users_home_country_idx ON public.users(home_country);
CREATE INDEX IF NOT EXISTS users_home_city_idx ON public.users(home_city);
CREATE INDEX IF NOT EXISTS users_location_idx ON public.users(home_country, home_city);

-- Add comment
COMMENT ON COLUMN public.users.home_country IS 'User home country for country-based leaderboards';
COMMENT ON COLUMN public.users.home_city IS 'User home city for local leaderboards';
COMMENT ON COLUMN public.users.home_city_lat IS 'Latitude of home city';
COMMENT ON COLUMN public.users.home_city_lng IS 'Longitude of home city';
```

**What this does:**
- Adds `home_country`, `home_city`, and coordinates to track user's home location
- Creates indexes for fast filtering by country/city
- Tracks when location was last updated

---

## 🗺️ Step 2: Add Location Columns to POIs Table

Run this SQL:

```sql
-- Add location metadata to POIs table
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS pois_city_idx ON public.pois(city);
CREATE INDEX IF NOT EXISTS pois_country_idx ON public.pois(country);
CREATE INDEX IF NOT EXISTS pois_location_idx ON public.pois(country, city);

-- Add GiST index for geographic queries (if not exists)
CREATE INDEX IF NOT EXISTS pois_location_gist_idx ON public.pois USING GIST (
  ll_to_earth(latitude, longitude)
);

-- Add comment
COMMENT ON COLUMN public.pois.city IS 'City where POI is located';
COMMENT ON COLUMN public.pois.country IS 'Country where POI is located';
```

**What this does:**
- Adds city and country columns to POIs for location-based filtering
- Creates indexes for efficient querying
- Adds geographic index for distance calculations

---

## 🔄 Step 3: Create Function to Auto-Populate POI Locations

This function will automatically geocode POIs when they're created:

```sql
-- Function to populate city/country for POIs using reverse geocoding
-- Note: This is a placeholder - actual implementation would call Nominatim API
-- For now, we'll just set country based on coordinates (rough approximation)

CREATE OR REPLACE FUNCTION public.populate_poi_location()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple country detection based on latitude/longitude bounds
  -- Netherlands: roughly 50.7-53.5°N, 3.3-7.2°E
  IF NEW.latitude BETWEEN 50.7 AND 53.5 AND NEW.longitude BETWEEN 3.3 AND 7.2 THEN
    NEW.country := 'Netherlands';
  -- Belgium: roughly 49.5-51.5°N, 2.5-6.4°E
  ELSIF NEW.latitude BETWEEN 49.5 AND 51.5 AND NEW.longitude BETWEEN 2.5 AND 6.4 THEN
    NEW.country := 'Belgium';
  -- Germany: roughly 47.3-55.1°N, 5.9-15.0°E
  ELSIF NEW.latitude BETWEEN 47.3 AND 55.1 AND NEW.longitude BETWEEN 5.9 AND 15.0 THEN
    NEW.country := 'Germany';
  -- Add more countries as needed
  ELSE
    NEW.country := 'Other';
  END IF;
  
  -- City would be populated via external API or manual entry
  -- For now, leave as NULL
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS populate_poi_location_trigger ON public.pois;
CREATE TRIGGER populate_poi_location_trigger
  BEFORE INSERT ON public.pois
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_poi_location();

-- Update existing POIs
UPDATE public.pois
SET country = CASE
  WHEN latitude BETWEEN 50.7 AND 53.5 AND longitude BETWEEN 3.3 AND 7.2 THEN 'Netherlands'
  WHEN latitude BETWEEN 49.5 AND 51.5 AND longitude BETWEEN 2.5 AND 6.4 THEN 'Belgium'
  WHEN latitude BETWEEN 47.3 AND 55.1 AND longitude BETWEEN 5.9 AND 15.0 THEN 'Germany'
  ELSE 'Other'
END
WHERE country IS NULL;
```

**What this does:**
- Automatically assigns country to POIs based on coordinates
- Updates existing POIs with country information
- Triggers on every new POI insert

---

## 📊 Step 4: Create Leaderboard Views

### Global Leaderboard by Minutes

```sql
-- Global leaderboard by total minutes captured
CREATE OR REPLACE VIEW public.leaderboard_global_minutes AS
SELECT 
  u.id,
  u.username,
  COALESCE(s.total_minutes, 0) as minutes,
  ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_minutes, 0) DESC) as rank
FROM public.users u
LEFT JOIN public.user_stats s ON u.id = s.user_id
WHERE COALESCE(s.total_minutes, 0) > 0
ORDER BY minutes DESC
LIMIT 100;
```

### Country Leaderboard

```sql
-- Country-specific leaderboard
CREATE OR REPLACE FUNCTION public.get_country_leaderboard(
  country_name TEXT,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  minutes INTEGER,
  rank BIGINT
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    u.id as user_id,
    u.username,
    COALESCE(s.total_minutes, 0) as minutes,
    ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_minutes, 0) DESC) as rank
  FROM public.users u
  LEFT JOIN public.user_stats s ON u.id = s.user_id
  WHERE u.home_country = country_name
    AND COALESCE(s.total_minutes, 0) > 0
  ORDER BY minutes DESC
  LIMIT limit_count;
$$;
```

### City Leaderboard

```sql
-- City-specific leaderboard
CREATE OR REPLACE FUNCTION public.get_city_leaderboard(
  city_name TEXT,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  minutes INTEGER,
  rank BIGINT
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    u.id as user_id,
    u.username,
    COALESCE(s.total_minutes, 0) as minutes,
    ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_minutes, 0) DESC) as rank
  FROM public.users u
  LEFT JOIN public.user_stats s ON u.id = s.user_id
  WHERE u.home_city = city_name
    AND COALESCE(s.total_minutes, 0) > 0
  ORDER BY minutes DESC
  LIMIT limit_count;
$$;
```

---

## 🔒 Step 5: Update Row Level Security Policies

```sql
-- Allow users to update their own location
CREATE POLICY "Users can update own location" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Only allow updating location fields
    (
      home_country IS NOT DISTINCT FROM OLD.home_country OR
      home_city IS NOT DISTINCT FROM OLD.home_city OR
      home_city_lat IS NOT DISTINCT FROM OLD.home_city_lat OR
      home_city_lng IS NOT DISTINCT FROM OLD.home_city_lng OR
      location_updated_at IS NOT DISTINCT FROM OLD.location_updated_at OR
      location_update_count IS NOT DISTINCT FROM OLD.location_update_count
    )
  );

-- Allow reading POI locations (needed for city search)
CREATE POLICY "POI locations are public" ON public.pois
  FOR SELECT
  USING (true);
```

---

## ✅ Step 6: Verify Installation

Run these queries to verify everything is set up correctly:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('home_country', 'home_city', 'home_city_lat', 'home_city_lng');

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'pois')
  AND indexname LIKE '%location%';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_country_leaderboard', 'get_city_leaderboard', 'populate_poi_location');

-- Test leaderboard function
SELECT * FROM public.get_country_leaderboard('Netherlands', 10);
```

Expected output:
- ✅ 6 columns added to users table
- ✅ 4-5 indexes created
- ✅ 3 functions created
- ✅ Leaderboard returns data (or empty if no users yet)

---

## 🧪 Step 7: Test Data (Optional)

If you want to test with sample data:

```sql
-- Update test user with location
UPDATE public.users
SET 
  home_country = 'Netherlands',
  home_city = 'Amsterdam',
  home_city_lat = 52.3676,
  home_city_lng = 4.9041,
  location_updated_at = NOW()
WHERE email = 'your-test-email@example.com';

-- Update some POIs with cities
UPDATE public.pois
SET city = 'Amsterdam'
WHERE country = 'Netherlands'
  AND latitude BETWEEN 52.3 AND 52.4
  AND longitude BETWEEN 4.8 AND 5.0
LIMIT 10;

-- Verify
SELECT username, home_country, home_city 
FROM public.users 
WHERE home_city IS NOT NULL;

SELECT name, city, country 
FROM public.pois 
WHERE city IS NOT NULL 
LIMIT 5;
```

---

## 🎯 Next Steps

1. **Run all SQL scripts** in order in your Supabase SQL Editor
2. **Test the app** - Go to Edit Profile → Select Country/City
3. **Verify data** - Check if location updates in the database
4. **Enable Rankings** - Once location data is populated, rankings will work

---

## 🐛 Troubleshooting

### Error: "column already exists"
- This is OK! It means the column was already added
- Continue with the next steps

### Error: "permission denied"
- Make sure you're running SQL as the service role
- Check RLS policies are correctly set up

### Country/City not saving
- Check browser console for errors
- Verify the `users` table has update permissions
- Check if the RLS policy "Users can update own location" exists

### Leaderboard shows no data
- Make sure users have `stats->>'total_minutes_captured'` > 0
- Verify users have set their home_country
- Check if the functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%leaderboard%';`

---

## 📚 Additional Resources

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostGIS Functions](https://postgis.net/docs/reference.html) (for advanced location queries)

---

## ✨ Summary

After completing this setup, you'll have:

- ✅ User location storage (country + city + coordinates)
- ✅ POI location metadata (city + country)
- ✅ Leaderboard functions (global, country, city)
- ✅ Automatic country detection for POIs
- ✅ Proper security policies

Your app is now ready for location-based rankings! 🎉

