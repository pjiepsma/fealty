import { Claim, ActiveSession } from '@/types';
import { supabase } from './supabase';
import { getCurrentMonth } from '@/utils/date';
import { CLAIM_CONSTANTS } from '@/constants/config';

export class ClaimService {
  // Start a claiming session
  static async startClaim(userId: string, poiId: string): Promise<ActiveSession> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('active_sessions')
      .insert([
        {
          user_id: userId,
          poi_id: poiId,
          start_time: now,
          last_ping: now,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start claim: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      poiId: data.poi_id,
      startTime: data.start_time,
      lastPing: data.last_ping,
      isActive: data.is_active,
    };
  }

  // Ping to keep session alive
  static async pingSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('active_sessions')
      .update({ last_ping: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to ping session: ${error.message}`);
    }
  }

  // End session and award minutes
  static async endClaim(sessionId: string): Promise<Claim> {
    // Get session
    const { data: session, error: fetchError } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      throw new Error('Session not found');
    }

    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const minutesEarned = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

    // Check if meets minimum duration
    if (minutesEarned < CLAIM_CONSTANTS.MIN_CLAIM_DURATION) {
      throw new Error(`Minimum claim duration is ${CLAIM_CONSTANTS.MIN_CLAIM_DURATION} minutes`);
    }

    // Check daily limit for this POI
    const dailyMinutes = await this.getDailyMinutes(session.user_id, session.poi_id);
    const allowedMinutes = Math.min(
      minutesEarned,
      CLAIM_CONSTANTS.MAX_DAILY_MINUTES_PER_POI - dailyMinutes
    );

    if (allowedMinutes <= 0) {
      throw new Error('Daily limit reached for this POI');
    }

    // Create claim record
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert([
        {
          user_id: session.user_id,
          poi_id: session.poi_id,
          start_time: session.start_time,
          end_time: endTime.toISOString(),
          minutes_earned: allowedMinutes,
          month: getCurrentMonth(),
        },
      ])
      .select()
      .single();

    if (claimError) {
      throw new Error(`Failed to create claim: ${claimError.message}`);
    }

    // Deactivate session
    await supabase
      .from('active_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    return {
      id: claim.id,
      userId: claim.user_id,
      poiId: claim.poi_id,
      startTime: claim.start_time,
      endTime: claim.end_time,
      minutesEarned: claim.minutes_earned,
      month: claim.month,
    };
  }

  // Get today's minutes for a user at a specific POI
  private static async getDailyMinutes(userId: string, poiId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('claims')
      .select('minutes_earned')
      .eq('user_id', userId)
      .eq('poi_id', poiId)
      .gte('start_time', today.toISOString());

    if (error) {
      console.error('Error fetching daily minutes:', error);
      return 0;
    }

    return data.reduce((sum, claim) => sum + claim.minutes_earned, 0);
  }
}
