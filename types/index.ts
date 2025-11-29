export interface POI {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  latitude: number;
  longitude: number;
  type: POIType;
  category: string;
  city?: string;
  country?: string;
  currentKing?: string;
  currentKingMinutes?: number;
  leaderboard?: LeaderboardEntry[];
  createdAt: string;
}

export type POIType =
  | 'park'
  | 'museum'
  | 'historic'
  | 'church'
  | 'monument'
  | 'other';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  minutes: number;
  rank: number;
}

export interface Claim {
  id: string;
  poiId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  minutesEarned: number; // Note: This actually stores seconds for now
  month: string; // YYYY-MM format
}

export interface User {
  id: string;
  username: string;
  email: string;
  isPremium: boolean;
  totalSeconds: number;
  totalPOIsClaimed: number;
  currentKingOf: number;
  longestStreak: number;
  currentStreak: number;
  lastActive?: string;
  home_country?: string;
  home_city?: string;
  home_city_lat?: number;
  home_city_lng?: number;
  location_updated_at?: string;
  location_update_count?: number;
  createdAt: string;
  updatedAt?: string;
}
