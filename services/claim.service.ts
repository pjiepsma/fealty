import { Claim } from '@/types';
import { supabase } from './supabase';
import { getCurrentMonth } from '@/utils/date';

export class ClaimService {
  // Save a claim directly
  static async saveClaim(
    userId: string,
    poiId: string,
    startTime: Date,
    endTime: Date,
    secondsEarned: number
  ): Promise<Claim> {
    const { data: claim, error } = await supabase
      .from('claims')
      .insert([
        {
          user_id: userId,
          poi_id: poiId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          seconds_earned: secondsEarned,
          month: getCurrentMonth(),
        },
      ])
      .select()
      .single();

    if (error) {
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
