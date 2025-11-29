import * as Location from 'expo-location';
import { supabase } from './supabase';

interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  playerCount?: number;
  distance?: number;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

export class GeocodingService {
  /**
   * Get city from coordinates using Nominatim
   */
  static async getCityFromCoordinates(lat: number, lng: number): Promise<City | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'User-Agent': 'FealtyApp/1.0' } }
      );
      const data = await response.json();
      
      if (!data.address) return null;
      
      const city = data.address.city || 
                   data.address.town || 
                   data.address.village || 
                   data.address.municipality;
      
      const country = data.address.country;
      
      return {
        name: city,
        country: country,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Search cities by name using Nominatim
   */
  static async searchCities(query: string, countryCode?: string): Promise<City[]> {
    try {
      let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=20&addressdetails=1`;
      
      if (countryCode) {
        url += `&countrycodes=${countryCode.toLowerCase()}`;
      }
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'FealtyApp/1.0' }
      });
      const data = await response.json();
      
      return data
        .filter((item: any) => 
          item.type === 'city' || 
          item.type === 'town' || 
          item.type === 'village' ||
          item.type === 'municipality'
        )
        .map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          country: item.address?.country || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
    } catch (error) {
      console.error('Error searching cities:', error);
      return [];
    }
  }

  /**
   * Get popular cities from database with POI counts
   */
  static async getPopularCities(countryName?: string): Promise<City[]> {
    try {
      let query = supabase
        .from('pois')
        .select('city, country, latitude, longitude')
        .not('city', 'is', null);
      
      if (countryName) {
        query = query.eq('country', countryName);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Count POIs per city and get unique cities
      const cityMap = new Map<string, { city: City; count: number }>();
      
      data?.forEach((poi: any) => {
        const key = `${poi.city}-${poi.country}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, {
            city: {
              name: poi.city,
              country: poi.country,
              lat: poi.latitude,
              lng: poi.longitude,
            },
            count: 1,
          });
        } else {
          cityMap.get(key)!.count++;
        }
      });
      
      // Sort by POI count
      return Array.from(cityMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(item => ({
          ...item.city,
          playerCount: item.count, // Using POI count as proxy for now
        }));
    } catch (error) {
      console.error('Error getting popular cities:', error);
      return [];
    }
  }

  /**
   * Auto-detect user's current location and get city
   */
  static async autoDetectLocation(): Promise<City | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const city = await this.getCityFromCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );
      
      return city;
    } catch (error) {
      console.error('Error auto-detecting location:', error);
      return null;
    }
  }

  /**
   * Get country code from country name
   */
  static getCountryCode(country: string): string {
    const codes: Record<string, string> = {
      'Netherlands': 'nl',
      'Belgium': 'be',
      'Germany': 'de',
      'France': 'fr',
      'United Kingdom': 'gb',
      'Spain': 'es',
      'Italy': 'it',
      'Poland': 'pl',
      'Austria': 'at',
      'Denmark': 'dk',
      'Sweden': 'se',
      'Norway': 'no',
      'Finland': 'fi',
    };
    return codes[country] || '';
  }

  /**
   * Get popular countries (hardcoded for MVP)
   */
  static getPopularCountries(): Country[] {
    return [
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
      { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪' },
      { code: 'FR', name: 'France', flag: '🇫🇷' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
      { code: 'ES', name: 'Spain', flag: '🇪🇸' },
      { code: 'IT', name: 'Italy', flag: '🇮🇹' },
      { code: 'PL', name: 'Poland', flag: '🇵🇱' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹' },
      { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
      { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
      { code: 'NO', name: 'Norway', flag: '🇳🇴' },
      { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    ];
  }
}

export type { City, Country };

