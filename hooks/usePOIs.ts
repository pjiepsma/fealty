import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { POIService } from '@/services/poi.service';
import { POI } from '@/types';

/**
 * Custom hook to fetch and manage nearby POIs
 */
export function usePOIs(userLocation: Location.LocationObject | null, radiusMeters: number = 10000) {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    loadNearbyPOIs();
  }, [userLocation?.coords.latitude, userLocation?.coords.longitude]);

  const loadNearbyPOIs = async () => {
    if (!userLocation) return;

    setIsLoadingPOIs(true);
    setError(null);
    console.log('📍 Loading nearby POIs...');

    try {
      const nearbyPOIs = await POIService.fetchNearbyPOIs(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        radiusMeters
      );

      console.log(`✅ Loaded ${nearbyPOIs.length} POIs`);
      setPois(nearbyPOIs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load POIs';
      console.error('Error loading POIs:', err);
      setError(errorMessage);
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  const refreshPOIs = () => {
    loadNearbyPOIs();
  };

  return {
    pois,
    isLoadingPOIs,
    error,
    refreshPOIs,
  };
}

