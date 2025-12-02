import { POI, Claim, LeaderboardEntry } from '@/types';
import { supabase } from './supabase';
import { getCurrentMonth } from '@/utils/date';

export class POIService {
  // Overpass API endpoints (fallback list)
  private static readonly OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
  ];

  // Fetch nearby POIs from OpenStreetMap via Overpass API with retry logic
  static async fetchNearbyPOIs(
    lat: number,
    lng: number,
    radius: number = 10000
  ): Promise<POI[]> {
    const query = `
      [out:json][timeout:25];
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

    // Try each endpoint with retries
    for (const endpoint of this.OVERPASS_ENDPOINTS) {
      try {
        const result = await this.fetchWithRetry(endpoint, query, 3);
        if (result.length > 0) {
          return result;
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}, trying next...`);
        continue;
      }
    }

    console.error('All Overpass API endpoints failed');
    return [];
  }

  // Fetch with retry logic for 504/timeout errors
  private static async fetchWithRetry(
    endpoint: string,
    query: string,
    maxRetries: number = 3
  ): Promise<POI[]> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(
          `${endpoint}?data=${encodeURIComponent(query)}`,
          {
            headers: {
              'User-Agent': 'FealtyApp/1.0',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Handle 504 Gateway Timeout with retry
        if (response.status === 504) {
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
            console.warn(`Overpass API 504 timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            console.error('Overpass API 504 timeout after all retries');
            return [];
          }
        }

        if (!response.ok) {
          console.error('Overpass API error:', response.status, response.statusText);
          return [];
        }

        const data = await response.json();

        if (!data.elements || !Array.isArray(data.elements)) {
          console.warn('Invalid response format from Overpass API');
          return [];
        }

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
      } catch (error: any) {
        // Handle abort (timeout)
        if (error.name === 'AbortError') {
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000;
            console.warn(`Request timeout, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            console.error('Request timeout after all retries');
            return [];
          }
        }

        // Other errors
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000;
          console.warn(`Error fetching POIs, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          console.error('Error fetching POIs after all retries:', error);
          return [];
        }
      }
    }

    return [];
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

    // Create new POI - map to database column names
    const { data: newPOI, error: createError } = await supabase
      .from('pois')
      .insert([{
        id: poiData.id,
        name: poiData.name,
        latitude: poiData.latitude,
        longitude: poiData.longitude,
        type: poiData.type,
        category: poiData.category,
        coordinates: `POINT(${poiData.longitude} ${poiData.latitude})`, // PostGIS format
      }])
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
