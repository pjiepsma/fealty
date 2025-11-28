// Core game mechanics
export const CLAIM_CONSTANTS = {
  ENTRY_DURATION: 10, // seconds (entry mode duration before capture starts)
  CLAIM_RADIUS: 50, // meters (detection radius around POI)
  MAX_CAPTURE_SECONDS: 60, // Maximum seconds per capture session
};

// Reward system
export const REWARD_SYSTEM = {
  MINUTE_BONUS_SECONDS: 10, // Bonus seconds for completing a full minute (60s + 10s = 70s total)
  // Future: BUDDY_MULTIPLIER for playing with friends
};

// Map styling
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

// POI Categories (Dutch-focused POIs)
export const POI_CATEGORIES = {
  park: { icon: '🌳', color: '#4CAF50', label: 'Park' },
  museum: { icon: '🎨', color: '#9C27B0', label: 'Museum' },
  historic: { icon: '🏛️', color: '#795548', label: 'Historisch' },
  church: { icon: '⛪', color: '#607D8B', label: 'Kerk' },
  monument: { icon: '🗿', color: '#9E9E9E', label: 'Monument' },
  other: { icon: '📍', color: '#757575', label: 'Overig' },
};

