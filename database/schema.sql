-- ==================================
-- Dictaat App - Supabase Database Schema
-- ==================================
-- Run these SQL queries in your Supabase SQL Editor

-- Enable PostGIS extension for geo-queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==================================
-- USERS TABLE (extends Supabase auth.users)
-- ==================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  total_seconds INTEGER DEFAULT 0,
  total_pois_claimed INTEGER DEFAULT 0,
  current_king_of INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  home_country TEXT,
  home_city TEXT,
  home_city_lat DOUBLE PRECISION,
  home_city_lng DOUBLE PRECISION,
  location_updated_at TIMESTAMPTZ,
  location_update_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================
-- POIS TABLE
-- ==================================

CREATE TABLE IF NOT EXISTS public.pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates GEOMETRY(POINT, 4326) NOT NULL, -- PostGIS geometry point
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for geo-queries
CREATE INDEX IF NOT EXISTS pois_coordinates_idx ON public.pois USING GIST(coordinates);

-- ==================================
-- CLAIMS TABLE
-- ==================================

CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  poi_id TEXT NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  seconds_earned INTEGER NOT NULL CHECK (seconds_earned > 0),
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS claims_user_id_idx ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS claims_poi_id_idx ON public.claims(poi_id);
CREATE INDEX IF NOT EXISTS claims_month_idx ON public.claims(month);
CREATE INDEX IF NOT EXISTS claims_user_poi_month_idx ON public.claims(user_id, poi_id, month);

-- ==================================
-- ACTIVE SESSIONS TABLE (REMOVED - Not used)
-- ==================================
-- This table was removed as we now use direct claim submission

-- ==================================
-- USER STATS (REMOVED - Merged into users table)
-- ==================================

-- ==================================
-- MONTHLY LEADERBOARD (REMOVED - Query claims directly)
-- ==================================

-- ==================================
-- FUNCTIONS
-- ==================================

-- Function to get nearby POIs
CREATE OR REPLACE FUNCTION nearby_pois(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  type TEXT,
  category TEXT,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.latitude,
    p.longitude,
    p.type,
    p.category,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      ST_SetSRID(p.coordinates, 4326)::geography
    ) as distance_meters
  FROM public.pois p
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    ST_SetSRID(p.coordinates, 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get POI leaderboard
CREATE OR REPLACE FUNCTION poi_leaderboard(
  poi_id_param TEXT,
  month_param TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  minutes INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.user_id,
    u.username,
    SUM(c.seconds_earned)::INTEGER as seconds,
    RANK() OVER (ORDER BY SUM(c.seconds_earned) DESC)::INTEGER as rank
  FROM public.claims c
  JOIN public.users u ON c.user_id = u.id
  WHERE c.poi_id = poi_id_param
    AND c.month = month_param
  GROUP BY c.user_id, u.username
  ORDER BY minutes DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats (called after claim)
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    total_seconds = (
      SELECT COALESCE(SUM(seconds_earned), 0)
      FROM public.claims
      WHERE user_id = NEW.user_id
    ),
    total_pois_claimed = (
      SELECT COUNT(DISTINCT poi_id)
      FROM public.claims
      WHERE user_id = NEW.user_id
    ),
    last_active = NOW(),
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- TRIGGERS
-- ==================================

-- Trigger to update user stats after claim
CREATE TRIGGER after_claim_insert
  AFTER INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- ==================================
-- ROW LEVEL SECURITY (RLS)
-- ==================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Users: users can read all, insert their own during signup, update only their own
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- POIs: everyone can read, only authenticated can create
CREATE POLICY "POIs are viewable by everyone" ON public.pois
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create POIs" ON public.pois
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Claims: users can create their own, read all
CREATE POLICY "Claims are viewable by everyone" ON public.claims
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own claims" ON public.claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================================
-- INDEXES FOR PERFORMANCE
-- ==================================

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS claims_user_month_poi_idx
  ON public.claims(user_id, month, poi_id);

-- ==================================
-- SAMPLE DATA (Optional - for testing)
-- ==================================

-- Insert a test POI (Coehoorn Park, Apeldoorn)
INSERT INTO public.pois (id, name, coordinates, latitude, longitude, type, category)
VALUES (
  'osm_test_1',
  'Coehoorn Park',
  ST_SetSRID(ST_MakePoint(5.9699, 52.2115), 4326),
  52.2115,
  5.9699,
  'park',
  'leisure'
) ON CONFLICT DO NOTHING;

-- ==================================
-- MAINTENANCE FUNCTIONS
-- ==================================

-- ==================================
-- UTILITY FUNCTIONS (REMOVED - No longer needed)
-- ==================================
