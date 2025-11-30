import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Mapbox, {
  MapView,
  Camera,
  UserTrackingMode,
  LocationPuck,
  Images,
  Image,
} from '@rnmapbox/maps';
import { View } from 'react-native';
import { calculateDistance } from '@/utils/distance';
import { CLAIM_CONSTANTS } from '@/constants/config';
import { usePOIs } from '@/hooks/usePOIs';
import { useGameMechanics } from '@/hooks/useGameMechanics';
import { POIMarker } from '@/components/map/POIMarker';
import { MapControls } from '@/components/map/MapControls';
import { CaptureTimer } from '@/components/map/CaptureTimer';
import { RadiusCircle } from '@/components/map/RadiusCircle';
import { POIDrawer } from '@/components/map/POIDrawer';
import { POI } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ClaimService } from '@/services/claim.service';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';

const { CLAIM_RADIUS } = CLAIM_CONSTANTS;

// Set Mapbox token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [followMode, setFollowMode] = useState<UserTrackingMode>(UserTrackingMode.Follow);
  
  // Get navigation params
  const params = useLocalSearchParams<{ poiId?: string }>();
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  // Location tracking
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  // Load nearby POIs from OpenStreetMap
  const { pois, isLoadingPOIs, error: poisError } = usePOIs(userLocation, 10000);
  
  // Active POI tracking (the POI user is currently inside)
  const [activePOI, setActivePOI] = useState<POI | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState(false);
  const [distanceToActivePOI, setDistanceToActivePOI] = useState<number | null>(null);
  
  // Selected POI for drawer
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // State for POI navigation from Personal tab
  const [navigateToPOI, setNavigateToPOI] = useState<POI | null>(null);
  
  // Camera state for programmatic control
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number | null>(null);
  
  // Use game mechanics hook
  const saveClaimCallback = useCallback((secondsEarned: number) => {
    saveClaimToDatabase(secondsEarned);
  }, [activePOI, user]);
  
  const {
    entryProgress,
    isCaptureActive,
    captureSeconds,
    sessionSeconds,
    captureStartTime,
  } = useGameMechanics({
    isInsideRadius,
    activePOI,
    userId: user?.id,
    onSaveClaim: saveClaimCallback,
  });
  
  // Refs for capture start time (needed for saveClaimToDatabase)
  const captureStartTimeRef = useRef<Date | null>(captureStartTime);
  
  // Update ref when captureStartTime changes
  useEffect(() => {
    captureStartTimeRef.current = captureStartTime;
  }, [captureStartTime]);
  
  // ========================================
  // FLOW OVERVIEW:
  // 1. User enters radius → ENTRY MODE starts (10 seconds, yellow arc)
  // 2. Entry completes → CAPTURE MODE starts (timer 0:00 to 1:00)
  // 3. User leaves radius → Everything resets
  // ========================================
  
  const toggleFollowMode = () => {
    setFollowMode((current) => 
      current === UserTrackingMode.Follow 
        ? UserTrackingMode.FollowWithHeading 
        : UserTrackingMode.Follow
    );
  };

  // Save claim to Supabase
  const saveClaimToDatabase = async (secondsEarned: number) => {
    if (!user || !activePOI || !captureStartTimeRef.current) {
      console.log('⚠️ Cannot save claim: missing user, POI, or start time');
      return;
    }

    try {
      const endTime = new Date();
      await ClaimService.saveClaim(
        user.id,
        activePOI.id,
        activePOI, // Pass full POI object
        captureStartTimeRef.current,
        endTime,
        secondsEarned
      );
      console.log(`✅ Claim saved successfully: ${secondsEarned}s for ${activePOI.name}`);
      
      // Show success message
      Alert.alert(
        '🎉 Claim Saved!',
        `You earned ${secondsEarned} seconds at ${activePOI.name}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Failed to save claim:', error);
      
      // Parse error message
      let userMessage = 'Failed to save your claim. Please try again.';
      
      if (error.message?.includes('Daily limit reached')) {
        userMessage = `You've reached the daily limit (60 seconds) for ${activePOI.name}.\n\nCome back tomorrow!`;
      } else if (error.message?.includes('foreign key')) {
        userMessage = 'This location could not be saved. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      // Show error to user
      Alert.alert(
        '❌ Claim Failed',
        userMessage,
        [{ text: 'OK' }]
      );
    }
  };

  // Track user location and check distance to nearest POI
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      console.log('Starting location tracking...');

      // Get initial location
      try {
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        console.log('Initial location:', initialLocation.coords.latitude, initialLocation.coords.longitude);
        setUserLocation(initialLocation);
      } catch (error) {
        console.error('Error getting initial location:', error);
      }

      // Watch for position changes
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1, // Update every 1 meter
        },
        (location) => {
          console.log('Location update received:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            accuracy: location.coords.accuracy,
          });
          
          setUserLocation(location);
        }
      );

    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Fetch POI by ID when navigated from Personal tab
  useEffect(() => {
    if (params.poiId && !navigateToPOI) {
      fetchPOIById(params.poiId);
    }
  }, [params.poiId]);

  const fetchPOIById = async (poiId: string) => {
    try {
      const { data, error } = await supabase
        .from('pois')
        .select('*')
        .eq('id', poiId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Convert database POI to POI type
        const poi: POI = {
          id: data.id,
          name: data.name,
          coordinates: [data.longitude, data.latitude],
          latitude: data.latitude,
          longitude: data.longitude,
          type: data.type as any,
          category: data.category,
          createdAt: data.created_at,
        };
        
        setNavigateToPOI(poi);
        
        // Pan camera to POI by updating camera state
        setCameraCenter(poi.coordinates);
        setCameraZoom(16);
        
        // Open drawer after a short delay to allow camera animation
        setTimeout(() => {
          setSelectedPOI(poi);
          setIsDrawerOpen(true);
          // Clear navigation state after opening drawer
          setNavigateToPOI(null);
          // Reset camera control after animation
          setTimeout(() => {
            setCameraCenter(null);
            setCameraZoom(null);
          }, 1000);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching POI:', error);
    }
  };

  // Check if user is inside radius of any POI
  useEffect(() => {
    if (!userLocation || pois.length === 0) return;

    // Find nearest POI
    let nearestPOI: POI | null = null;
    let nearestDistance: number = Infinity;

    for (const poi of pois) {
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        poi.latitude,
        poi.longitude
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPOI = poi;
      }
    }

    if (nearestPOI && nearestDistance <= CLAIM_RADIUS) {
      // Inside radius of nearest POI
      if (activePOI?.id !== nearestPOI.id) {
        console.log(`✅ Entered ${nearestPOI.name} (${nearestDistance.toFixed(1)}m)`);
        setActivePOI(nearestPOI);
        setIsInsideRadius(true);
      }
      setDistanceToActivePOI(nearestDistance);
    } else {
      // Outside all POI radii
      if (isInsideRadius) {
        console.log('❌ Left all POI radii');
        setActivePOI(null);
        setIsInsideRadius(false);
        setDistanceToActivePOI(null);
      }
    }
  }, [userLocation, pois, activePOI, isInsideRadius]);
  
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MapView 
        style={styles.map}
        styleURL="mapbox://styles/mapbox/outdoors-v12"
        scaleBarEnabled={true}
        scaleBarPosition={{ top: insets.top + 10, left: 16 }}
        compassEnabled={false}
      >
        <Images>
          <Image name="topImage">
            <View
              style={{
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 12,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: 'black',
              }}
            />
          </Image>
          <Image name="castleIcon">
            <View style={styles.iconBackground}>
              <MaterialIcons name="castle" size={24} color="white" />
            </View>
          </Image>
        </Images>
        <Camera
          defaultSettings={{
            centerCoordinate: cameraCenter || [-77.036086, 38.910233],
            zoomLevel: cameraZoom || 14,
          }}
          centerCoordinate={cameraCenter || undefined}
          zoomLevel={cameraZoom || undefined}
          followUserLocation={!navigateToPOI && !cameraCenter}
          followUserMode={followMode}
          followZoomLevel={14}
          animationDuration={cameraCenter ? 1000 : 0}
        />
        <LocationPuck
          topImage="topImage"
          visible={true}
          scale={['interpolate', ['linear'], ['zoom'], 10, 0.8, 20, 2.0]}
          pulsing={{
            isEnabled: true,
            color: 'teal',
            radius: 30.0,
          }}
        />
        
        {/* Radius circle and entry arc */}
        {isInsideRadius && activePOI && (
          <RadiusCircle
            coordinates={activePOI.coordinates}
            entryProgress={entryProgress}
            isCaptureActive={isCaptureActive}
          />
        )}
        
        
        
        {/* Real POIs from OpenStreetMap */}
        {pois.map((poi) => (
          <POIMarker 
            key={poi.id} 
            poi={poi} 
            size={14}
            onSelect={() => {
              setSelectedPOI(poi);
              setIsDrawerOpen(true);
            }}
          />
        ))}
      </MapView>
      
      {/* Capture timer display */}
      <CaptureTimer
        captureSeconds={captureSeconds}
        isCaptureActive={isCaptureActive}
        topInset={insets.top}
      />
      
      {/* Status indicator */}
      {activePOI && distanceToActivePOI !== null && (
        <View style={[styles.statusIndicator, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.statusText}>
            {isInsideRadius ? `✅ Inside ${activePOI.name}` : `❌ Outside ${activePOI.name}`}
          </Text>
          <Text style={[styles.statusText, { fontSize: 12, marginTop: 4, opacity: 0.8 }]}>
            Distance: {distanceToActivePOI.toFixed(1)}m / {CLAIM_RADIUS}m
          </Text>
        </View>
      )}
      
      {/* Toggle follow mode button */}
      <MapControls
        followMode={followMode}
        onToggle={toggleFollowMode}
        topInset={insets.top}
      />
      
      {/* POI Drawer */}
      <POIDrawer
        poi={selectedPOI}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPOI(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  followButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    backgroundColor: '#8B4513', // Brown for castle
    borderRadius: 24,
    padding: 8,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
  },
  timerOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
