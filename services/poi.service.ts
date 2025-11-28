import { POI, Claim, LeaderboardEntry } from '@/types';
import { supabase } from './supabase';
import { getCurrentMonth } from '@/utils/date';

export class POIService {
  // Fetch nearby POIs from OpenStreetMap via Overpass API
  static async fetchNearbyPOIs(
    lat: number,
    lng: number,
    radius: number = 10000
  ): Promise<POI[]> {
    const query = `
      [out:json];
      (
        node["leisure"="park"](around:${radius},${lat},${lng});
        way["leisure"="park"](around:${radius},${lat},${lng});
        node["leisure"="garden"](around:${radius},${lat},${lng});
        way["leisure"="garden"](around:${radius},${lat},${lng});
        node["historic"](around:${radius},${lat},${lng});
        node["amenity"="place_of_worship"](around:${radius},${lat},${lng});
        node["tourism"="museum"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    try {
      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      return data.elements
        .filter((poi: any) => poi.tags?.name) // Only POIs with names
        .map((poi: any) => {
          // For ways (polygons), use center coordinates
          const lat = poi.lat || poi.center?.lat;
          const lon = poi.lon || poi.center?.lon;
          
          return {
            id: `osm_${poi.id}`,
            name: poi.tags.name,
            coordinates: [lon, lat],
            latitude: lat,
            longitude: lon,
            type: this.detectPOIType(poi.tags),
            category: poi.tags.tourism || poi.tags.amenity || poi.tags.leisure || 'other',
            createdAt: new Date().toISOString(),
          };
        });
    } catch (error) {
      console.error('Error fetching POIs:', error);
      return [];
    }
  }

  private static detectPOIType(tags: any): string {
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'park';
    if (tags.tourism === 'museum') return 'museum';
    if (tags.historic) return 'historic';
    if (tags.amenity === 'place_of_worship') return 'church';
    return 'other';
  }

  // Get or create POI in database (lazy loading)
  static async getOrCreatePOI(poiData: POI): Promise<POI> {
    // Check if POI exists
    const { data: existingPOI, error: fetchError } = await supabase
      .from('pois')
      .select('*')
      .eq('id', poiData.id)
      .single();

    if (existingPOI) {
      return existingPOI;
    }

    // Create new POI
    const { data: newPOI, error: createError } = await supabase
      .from('pois')
      .insert([poiData])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create POI: ${createError.message}`);
    }

    return newPOI;
  }

  // Get leaderboard for a specific POI
  static async getPOILeaderboard(poiId: string): Promise<LeaderboardEntry[]> {
    const month = getCurrentMonth();

    const { data, error } = await supabase
      .from('claims')
      .select(`
        userId:user_id,
        minutes:minutes_earned,
        users:user_id (
          username
        )
      `)
      .eq('poi_id', poiId)
      .eq('month', month);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    // Aggregate minutes per user
    const userMinutes = data.reduce((acc: any, claim: any) => {
      const userId = claim.userId;
      const username = claim.users?.username || 'Unknown';

      if (!acc[userId]) {
        acc[userId] = { userId, username, minutes: 0 };
      }
      acc[userId].minutes += claim.minutes;
      return acc;
    }, {});

    // Sort and add ranks
    return Object.values(userMinutes)
      .sort((a: any, b: any) => b.minutes - a.minutes)
      .map((entry: any, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }
}
