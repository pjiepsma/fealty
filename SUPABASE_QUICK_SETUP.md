# 🚀 Quick Supabase Setup - Copy & Paste

Run these SQL commands **in order** in your Supabase SQL Editor.

---

## ✅ Step 1: Add Location Columns to Users

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS home_country TEXT DEFAULT 'Netherlands',
ADD COLUMN IF NOT EXISTS home_city TEXT,
ADD COLUMN IF NOT EXISTS home_city_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS home_city_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location_update_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS users_home_country_idx ON public.users(home_country);
CREATE INDEX IF NOT EXISTS users_home_city_idx ON public.users(home_city);
```

---

## ✅ Step 2: Add Location Columns to POIs

```sql
ALTER TABLE public.pois 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS pois_city_idx ON public.pois(city);
CREATE INDEX IF NOT EXISTS pois_country_idx ON public.pois(country);
```

---

## ✅ Step 3: Auto-Populate Countries for Existing POIs

```sql
UPDATE public.pois
SET country = CASE
  WHEN latitude BETWEEN 50.7 AND 53.5 AND longitude BETWEEN 3.3 AND 7.2 THEN 'Netherlands'
  WHEN latitude BETWEEN 49.5 AND 51.5 AND longitude BETWEEN 2.5 AND 6.4 THEN 'Belgium'
  WHEN latitude BETWEEN 47.3 AND 55.1 AND longitude BETWEEN 5.9 AND 15.0 THEN 'Germany'
  ELSE 'Other'
END
WHERE country IS NULL;
```

---

## ✅ Step 4: Create Leaderboard Functions

```sql
-- Global Leaderboard
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

-- Country Leaderboard Function
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

-- City Leaderboard Function
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

## ✅ Step 5: Verify Installation

```sql
-- Check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('home_country', 'home_city', 'home_city_lat', 'home_city_lng');

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_country_leaderboard', 'get_city_leaderboard');

-- Test (should work even if empty)
SELECT * FROM public.get_country_leaderboard('Netherlands', 10);
```

**Expected:**
- ✅ 4 columns in users table
- ✅ 2 functions created
- ✅ Query runs without error

---

## 🎉 Done!

Your database is ready for location-based features. Now test the app:

1. Open app → Profile → Edit Profile
2. Set Country → Netherlands
3. Set City → Amsterdam (or search your city)
4. Check Supabase: `SELECT username, home_country, home_city FROM users;`

Should see your data! ✨

