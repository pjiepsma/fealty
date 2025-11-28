// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function isInRadius(
  userLat: number,
  userLng: number,
  poiLat: number,
  poiLng: number,
  radiusMeters: number = 50
): boolean {
  const distance = calculateDistance(userLat, userLng, poiLat, poiLng);
  return distance <= radiusMeters;
}

export function getDistanceToPOI(
  userLat: number,
  userLng: number,
  poiLat: number,
  poiLng: number
): number {
  return calculateDistance(userLat, userLng, poiLat, poiLng);
}