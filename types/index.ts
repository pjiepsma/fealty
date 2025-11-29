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
  minutesEarned: number;
  month: string; // YYYY-MM format
}

export interface ActiveSession {
  id: string;
  poiId: string;
  userId: string;
  startTime: string;
  lastPing: string;
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isPremium: boolean;
  createdAt: string;
  home_country?: string;
  home_city?: string;
  home_city_lat?: number;
  home_city_lng?: number;
  location_updated_at?: string;
  stats: UserStats;
}

export interface UserStats {
  totalMinutes: number;
  totalPOIsClaimed: number;
  currentKingOf: number;
  longestStreak: number;
  currentStreak: number;
}

export interface MonthlyLeaderboard {
  month: string;
  rankings: {
    userId: string;
    username: string;
    totalMinutes: number;
    poisClaimed: number;
    kingCount: number;
  }[];
}
