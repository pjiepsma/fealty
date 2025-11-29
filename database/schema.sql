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
  minutes_earned INTEGER NOT NULL CHECK (minutes_earned >= 5 AND minutes_earned <= 60),
  month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS claims_user_id_idx ON public.claims(user_id);
CREATE INDEX IF NOT EXISTS claims_poi_id_idx ON public.claims(poi_id);
CREATE INDEX IF NOT EXISTS claims_month_idx ON public.claims(month);
CREATE INDEX IF NOT EXISTS claims_user_poi_month_idx ON public.claims(user_id, poi_id, month);

-- ==================================
-- ACTIVE SESSIONS TABLE
-- ==================================

CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  poi_id TEXT NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  last_ping TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure one active session per user
CREATE UNIQUE INDEX IF NOT EXISTS active_sessions_user_active_idx
  ON public.active_sessions(user_id)
  WHERE is_active = TRUE;

-- ==================================
-- USER STATS TABLE (Cached aggregations)
-- ==================================

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_minutes INTEGER DEFAULT 0,
  total_pois_claimed INTEGER DEFAULT 0,
  current_king_of INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================
-- MONTHLY LEADERBOARD TABLE (Materialized)
-- ==================================

CREATE TABLE IF NOT EXISTS public.monthly_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  pois_claimed INTEGER DEFAULT 0,
  king_count INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS monthly_leaderboard_month_idx ON public.monthly_leaderboard(month);
CREATE INDEX IF NOT EXISTS monthly_leaderboard_rank_idx ON public.monthly_leaderboard(month, rank);

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
    SUM(c.minutes_earned)::INTEGER as minutes,
    RANK() OVER (ORDER BY SUM(c.minutes_earned) DESC)::INTEGER as rank
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
CREATE OR REPLACE FUNCTION update_user_stats(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, total_minutes, total_pois_claimed, last_active)
  SELECT
    user_id_param,
    COALESCE(SUM(minutes_earned), 0),
    COUNT(DISTINCT poi_id),
    NOW()
  FROM public.claims
  WHERE user_id = user_id_param
  ON CONFLICT (user_id) DO UPDATE SET
    total_minutes = EXCLUDED.total_minutes,
    total_pois_claimed = EXCLUDED.total_pois_claimed,
    last_active = EXCLUDED.last_active,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- TRIGGERS
-- ==================================

-- Trigger to update user stats after claim
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_claim_insert
  AFTER INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_stats();

-- Trigger to update monthly leaderboard
CREATE OR REPLACE FUNCTION trigger_update_monthly_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.monthly_leaderboard (user_id, month, total_minutes, pois_claimed)
  SELECT
    NEW.user_id,
    NEW.month,
    SUM(minutes_earned),
    COUNT(DISTINCT poi_id)
  FROM public.claims
  WHERE user_id = NEW.user_id AND month = NEW.month
  GROUP BY user_id, month
  ON CONFLICT (user_id, month) DO UPDATE SET
    total_minutes = EXCLUDED.total_minutes,
    pois_claimed = EXCLUDED.pois_claimed,
    updated_at = NOW();

  -- Update ranks
  UPDATE public.monthly_leaderboard
  SET rank = subquery.new_rank
  FROM (
    SELECT
      user_id,
      RANK() OVER (ORDER BY total_minutes DESC) as new_rank
    FROM public.monthly_leaderboard
    WHERE month = NEW.month
  ) AS subquery
  WHERE monthly_leaderboard.user_id = subquery.user_id
    AND monthly_leaderboard.month = NEW.month;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_claim_insert_leaderboard
  AFTER INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_monthly_leaderboard();

-- ==================================
-- ROW LEVEL SECURITY (RLS)
-- ==================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;

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

-- Active sessions: users can manage their own
CREATE POLICY "Users can view their own sessions" ON public.active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON public.active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Stats and leaderboards: readable by all
CREATE POLICY "Stats are viewable by everyone" ON public.user_stats
  FOR SELECT USING (true);

CREATE POLICY "Leaderboards are viewable by everyone" ON public.monthly_leaderboard
  FOR SELECT USING (true);

-- ==================================
-- INDEXES FOR PERFORMANCE
-- ==================================

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS claims_user_month_poi_idx
  ON public.claims(user_id, month, poi_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS monthly_leaderboard_month_minutes_idx
  ON public.monthly_leaderboard(month, total_minutes DESC);

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

-- Function to clean up old inactive sessions (run daily)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.active_sessions
  WHERE is_active = FALSE
    AND created_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly leaderboard (run on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_leaderboard()
RETURNS VOID AS $$
BEGIN
  -- Archive previous month's data is already in claims table
  -- Just clear current rankings to start fresh
  UPDATE public.user_stats
  SET current_king_of = 0;
END;
$$ LANGUAGE plpgsql;
