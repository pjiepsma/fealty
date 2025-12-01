import { Claim } from '@/types';
import { supabase } from './supabase';
import { getCurrentMonth } from '@/utils/date';
import { POIService } from './poi.service';

export class ClaimService {
  // Check if user is the king (has most seconds) of a POI
  static async isUserKingOfPOI(userId: string, poiId: string): Promise<boolean> {
    const { data: claims, error } = await supabase
      .from('claims')
      .select('user_id, seconds_earned')
      .eq('poi_id', poiId);

    if (error || !claims || claims.length === 0) {
      return false;
    }

    // Group by user and sum seconds
    const userSecondsMap = new Map<string, number>();
    claims.forEach((claim: any) => {
      const current = userSecondsMap.get(claim.user_id) || 0;
      userSecondsMap.set(claim.user_id, current + claim.seconds_earned);
    });

    // Find king (user with most seconds)
    let maxSeconds = 0;
    let kingUserId: string | null = null;
    userSecondsMap.forEach((seconds, uid) => {
      if (seconds > maxSeconds) {
        maxSeconds = seconds;
        kingUserId = uid;
      }
    });

    return kingUserId === userId;
  }

  // Check if user has already completed their daily claim for this POI
  static async getDailySecondsForPOI(userId: string, poiId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('claims')
      .select('seconds_earned')
      .eq('user_id', userId)
      .eq('poi_id', poiId)
      .gte('start_time', today.toISOString());

    if (error) {
      console.error('Error checking daily seconds:', error);
      return 0;
    }

    // Sum up all seconds earned today at this POI
    return data?.reduce((sum, claim) => sum + claim.seconds_earned, 0) || 0;
  }

  // Save a claim directly
  static async saveClaim(
    userId: string,
    poiId: string,
    poiData: any, // Full POI object to ensure it exists in DB
    startTime: Date,
    endTime: Date,
    secondsEarned: number
  ): Promise<Claim> {
    // Check daily limit (60 seconds max per POI per day)
    const dailySeconds = await this.getDailySecondsForPOI(userId, poiId);
    const remainingSeconds = 60 - dailySeconds;

    if (remainingSeconds <= 0) {
      throw new Error('Daily limit reached for this POI (60 seconds max)');
    }

    // Cap the seconds to the remaining allowed amount
    const cappedSeconds = Math.min(secondsEarned, remainingSeconds);
    
    if (cappedSeconds < secondsEarned) {
      console.log(`⚠️ Capping claim: ${secondsEarned}s → ${cappedSeconds}s (${dailySeconds}s already claimed today)`);
    }

    // Ensure POI exists in database first
    try {
      await POIService.getOrCreatePOI(poiData);
    } catch (error) {
      console.error('Failed to create POI:', error);
      // Continue anyway - the POI might already exist
    }

    const payload = {
      user_id: userId,
      poi_id: poiId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      seconds_earned: cappedSeconds, // Use capped seconds
      month: getCurrentMonth(),
    };

    console.log('💾 Saving claim:', JSON.stringify(payload, null, 2));

    const { data: claim, error } = await supabase
      .from('claims')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to save claim: ${error.message}`);
    }

    return {
      id: claim.id,
      userId: claim.user_id,
      poiId: claim.poi_id,
      startTime: claim.start_time,
      endTime: claim.end_time,
      minutesEarned: claim.seconds_earned, // Keep field name for compatibility, but stores seconds
      month: claim.month,
    };
  }
}
