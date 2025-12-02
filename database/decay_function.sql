-- ==================================
-- DAILY DECAY FUNCTION
-- ==================================
-- This function reduces all users' seconds_earned by 10% daily at midnight
-- This keeps locations dynamic and prevents inactive players from holding POIs forever

CREATE OR REPLACE FUNCTION daily_decay()
RETURNS void AS $$
BEGIN
  -- Update all claims: reduce seconds_earned by 10% (rounded down, minimum 1)
  UPDATE public.claims
  SET seconds_earned = GREATEST(1, FLOOR(seconds_earned * 0.9))
  WHERE seconds_earned > 1; -- Only decay claims with more than 1 second
  
  -- Log the decay operation
  RAISE NOTICE 'Daily decay applied: all claims reduced by 10%%';
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- SETUP CRON JOB (Supabase pg_cron extension)
-- ==================================
-- To schedule this function to run daily at midnight, run this in Supabase SQL Editor:

-- First, enable pg_cron extension (if not already enabled):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then schedule the daily decay function:
-- SELECT cron.schedule(
--   'daily-decay',           -- job name
--   '0 0 * * *',            -- cron expression: every day at midnight (00:00 UTC)
--   $$SELECT daily_decay();$$ -- function to execute
-- );

-- To check if the job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'daily-decay';

-- To unschedule the job:
-- SELECT cron.unschedule('daily-decay');


