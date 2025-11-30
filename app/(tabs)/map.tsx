import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Mapbox, {
  MapView,
  Camera,
  UserTrackingMode,
  LocationPuck,
  Images,
  Image,
} from '@rnmapbox/maps';
import { calculateDistance } from '@/utils/distance';
import { CLAIM_CONSTANTS } from '@/constants/config';

const { CLAIM_RADIUS } = CLAIM_CONSTANTS;
import { usePOIs } from '@/hooks/usePOIs';
import { useGameMechanics } from '@/hooks/useGameMechanics';
import { POIMarker } from '@/components/map/POIMarker';
import { MapControls } from '@/components/map/MapControls';
import { CaptureTimer } from '@/components/map/CaptureTimer';
import { RadiusCircle } from '@/components/map/RadiusCircle';
import { POI } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ClaimService } from '@/services/claim.service';

// Set Mapbox token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [followMode, setFollowMode] = useState<UserTrackingMode>(UserTrackingMode.Follow);
  
  // ========================================
  // LOCATION & POI TRACKING
  // ========================================
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const { pois } = usePOIs(userLocation, 10000);
  
  // Active POI tracking
  const [activePOI, setActivePOI] = useState<POI | null>(null);
  const [isInsideRadius, setIsInsideRadius] = useState(false);
  const [distanceToActivePOI, setDistanceToActivePOI] = useState<number | null>(null);
  
  // ========================================
  // GAME MECHANICS
  // ========================================
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
  });

  // ========================================
  // LOCATION TRACKING
  // ========================================
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      // Get initial location
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation(initialLocation);
      console.log('Initial location:', initialLocation.coords);

      // Watch location updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          setUserLocation(location);
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // ========================================
  // POI DISTANCE CALCULATION
  // ========================================
  useEffect(() => {
    if (!userLocation || pois.length === 0) {
      setActivePOI(null);
      setIsInsideRadius(false);
      setDistanceToActivePOI(null);
      return;
    }

    // Find nearest POI
    let nearestPOI: POI | null = null;
    let minDistance = Infinity;

    pois.forEach((poi) => {
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        poi.latitude,
        poi.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPOI = poi;
      }
    });

    if (nearestPOI && minDistance <= CLAIM_RADIUS) {
      setActivePOI(nearestPOI);
      setIsInsideRadius(true);
      setDistanceToActivePOI(minDistance);
    } else {
      setActivePOI(null);
      setIsInsideRadius(false);
      setDistanceToActivePOI(null);
    }
  }, [userLocation, pois]);

  // ========================================
  // SAVE CLAIM WHEN COMPLETE
  // ========================================
  useEffect(() => {
    if (captureSeconds >= 60 && sessionSeconds > 0 && activePOI && captureStartTime) {
      saveClaimToDatabase(sessionSeconds);
    }
  }, [captureSeconds, sessionSeconds, activePOI, captureStartTime]);

  // ========================================
  // SAVE CLAIM TO DATABASE
  // ========================================
  const saveClaimToDatabase = async (secondsEarned: number) => {
    if (!user || !activePOI || !captureStartTime) {
      console.log('⚠️ Cannot save claim: missing user, POI, or start time');
      return;
    }

    try {
      const endTime = new Date();
      await ClaimService.saveClaim(
        user.id,
        activePOI.id,
        activePOI,
        captureStartTime,
        endTime,
        secondsEarned
      );
      console.log(`✅ Claim saved successfully: ${secondsEarned}s for ${activePOI.name}`);
      
      Alert.alert(
        '🎉 Claim Saved!',
        `You earned ${secondsEarned} seconds at ${activePOI.name}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Failed to save claim:', error);
      
      let userMessage = 'Failed to save your claim. Please try again.';
      
      if (error.message?.includes('Daily limit reached')) {
        userMessage = `You've reached the daily limit (60 seconds) for ${activePOI.name}.\n\nCome back tomorrow!`;
      } else if (error.message?.includes('foreign key')) {
        userMessage = 'This location could not be saved. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      Alert.alert('❌ Claim Failed', userMessage, [{ text: 'OK' }]);
    }
  };

  // ========================================
  // TOGGLE FOLLOW MODE
  // ========================================
  const toggleFollowMode = () => {
    setFollowMode((prev) =>
      prev === UserTrackingMode.FollowWithHeading
        ? UserTrackingMode.Follow
        : UserTrackingMode.FollowWithHeading
    );
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        scaleBarEnabled={true}
        scaleBarPosition={{ bottom: insets.bottom + 60, left: 8 }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={true}
      >
        <Camera
          followUserLocation={true}
          followUserMode={followMode}
          followZoomLevel={17}
          animationMode="easeTo"
          animationDuration={200}
        />

        {/* User location puck */}
        <Images>
          <Image name="customLocationIcon">
            <View style={styles.locationIcon} />
          </Image>
        </Images>

        <LocationPuck
          topImage="customLocationIcon"
          visible={true}
          pulsing={{ isEnabled: true, color: '#007AFF', radius: 100 }}
        />

        {/* Radius circle and entry arc */}
        {activePOI && (
          <RadiusCircle
            coordinates={activePOI.coordinates}
            entryProgress={entryProgress}
            isCaptureActive={isCaptureActive}
          />
        )}

        {/* POI markers */}
        {pois.map((poi) => (
          <POIMarker key={poi.id} poi={poi} />
        ))}
      </MapView>

      {/* Map controls */}
      <MapControls
        followUserMode={followMode}
        onToggleFollowMode={toggleFollowMode}
        topInset={insets.top}
      />

      {/* Capture timer */}
      <CaptureTimer
        captureSeconds={captureSeconds}
        isCaptureActive={isCaptureActive}
        topInset={insets.top}
      />

      {/* Status indicator */}
      {activePOI && distanceToActivePOI !== null && (
        <View style={[styles.statusIndicator, { top: insets.top + 120 }]}>
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isInsideRadius ? '#4CAF50' : '#FF9800' },
                ]}
              />
              <View style={styles.statusText}>
                <View style={styles.poiNameRow}>
                  <View style={styles.poiIcon}>{/* Icon can be added here */}</View>
                  <View style={styles.textContainer}>
                    <Text style={styles.poiNameText}>{activePOI.name}</Text>
                    <Text style={styles.distanceText}>
                      {distanceToActivePOI.toFixed(1)}m away
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  locationIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF',
    transform: [{ rotate: '180deg' }],
  },
  statusIndicator: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 150,
  },
  statusContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    flex: 1,
  },
  poiNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poiIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  poiNameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  distanceText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
});
