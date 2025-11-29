import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { POIService } from '@/services/poi.service';
import { POI } from '@/types';
import { calculateDistance } from '@/utils/distance';

/**
 * Custom hook to fetch and manage nearby POIs
 * Only re-fetches when user moves significantly (> 1km from last fetch)
 */
export function usePOIs(userLocation: Location.LocationObject | null, radiusMeters: number = 10000) {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!userLocation) return;

    // Only fetch if we haven't fetched yet, or user moved > 1km
    const shouldFetch = !lastFetchLocation.current || 
      calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        lastFetchLocation.current.lat,
        lastFetchLocation.current.lng
      ) > 1000; // 1km threshold

    if (shouldFetch) {
      loadNearbyPOIs();
    }
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
      
      // Save fetch location
      lastFetchLocation.current = {
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude,
      };
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
