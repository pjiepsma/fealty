import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
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
  PointAnnotation,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
  Callout,
} from '@rnmapbox/maps';
import { View } from 'react-native';
import { calculateDistance } from '@/utils/distance';
import { generateCirclePolygon, generateProgressArc, generateCastleIcon } from '@/utils/mapIcons';
import { CLAIM_CONSTANTS, REWARD_SYSTEM } from '@/constants/config';
import { usePOIs } from '@/hooks/usePOIs';
import { POIMarker } from '@/components/map/POIMarker';
import { POICallout } from '@/components/map/POICallout';

const { ENTRY_DURATION, CLAIM_RADIUS } = CLAIM_CONSTANTS;
const { MINUTE_BONUS_SECONDS } = REWARD_SYSTEM;

// Set Mapbox token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

// Mock POI location (Amersfoort area)
// Mock POI location (Amersfoort area)
const MARKER_LAT = 52.1992252;
const MARKER_LNG = 5.9272742;
const RADIUS_METERS = CLAIM_RADIUS;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [followMode, setFollowMode] = useState<UserTrackingMode>(UserTrackingMode.Follow);
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  // Location & radius detection
  const [isInsideRadius, setIsInsideRadius] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distanceToMarker, setDistanceToMarker] = useState<number | null>(null);
  
  // Load nearby POIs from OpenStreetMap
  const { pois, isLoadingPOIs, error: poisError } = usePOIs(userLocation, 10000);
  
  // Border animation (pulsing effect when inside radius)
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const [animatedBorderWidth, setAnimatedBorderWidth] = useState(2);
  
  // Phase 1: ENTRY MODE (0-10 seconds)
  // Yellow progress bar when user enters radius
  const [entryProgress, setEntryProgress] = useState(0); // 0 to 1
  const entryAnimationRef = useRef<number | null>(null);
  
  // Phase 2: CAPTURE MODE (starts after entry completes)
  // Counts up from 0:00 to 1:00 (60 seconds max)
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [captureSeconds, setCaptureSeconds] = useState(0);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Captured time tracking (for backend)
  const [totalCapturedSeconds, setTotalCapturedSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0); // Seconds in current capture session (includes bonuses)
  
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

  // ========================================
  // PHASE 1: ENTRY MODE (10 seconds)
  // Yellow arc animation when entering radius
  // ========================================
  useEffect(() => {
    if (isInsideRadius && !isCaptureActive && entryProgress === 0) {
      console.log('🚪 ENTRY MODE started (10 seconds)...');
      
      const startTime = Date.now();
      const duration = ENTRY_DURATION * 1000; // 10 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setEntryProgress(progress);
        
        if (progress < 1) {
          entryAnimationRef.current = requestAnimationFrame(animate);
        } else {
          // Entry complete → start capture mode
          console.log('✅ ENTRY complete → Starting CAPTURE mode');
          setEntryProgress(1);
          setIsCaptureActive(true);
          entryAnimationRef.current = null;
        }
      };
      
      entryAnimationRef.current = requestAnimationFrame(animate);
    } else if (!isInsideRadius) {
      // User left radius → reset everything
      console.log('❌ Left radius → Resetting all modes');
      setEntryProgress(0);
      setIsCaptureActive(false);
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
        entryAnimationRef.current = null;
      }
    }
    
    // NO cleanup function - let animation run to completion
  }, [isInsideRadius]);
  
  // ========================================
  // PHASE 2: CAPTURE MODE (starts after entry completes)
  // Timer counts from 0:00 to 1:00 (60 seconds max)
  // ========================================
  useEffect(() => {
    if (isCaptureActive && !captureIntervalRef.current) {
      console.log('🎯 CAPTURE MODE started');
      
      setCaptureSeconds(0);
      setSessionSeconds(0); // Reset session seconds
      
      // Start capture timer (updates every second)
      captureIntervalRef.current = setInterval(() => {
        setCaptureSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Add 1 second to session
          let bonusSeconds = 0;
          
          // Check if we just completed a full minute
          if (newSeconds % 60 === 0) {
            bonusSeconds = MINUTE_BONUS_SECONDS;
            console.log(`🎉 MINUTE BONUS! +${MINUTE_BONUS_SECONDS} seconds`);
          }
          
          // Update session seconds (real time + bonuses)
          setSessionSeconds((prevSeconds) => {
            const newSessionSeconds = prevSeconds + 1 + bonusSeconds;
            if (bonusSeconds > 0) {
              console.log(`⏱️ Session: ${newSeconds}s captured = ${newSessionSeconds}s earned (${Math.floor(newSeconds / 60)} minute bonus)`);
            }
            return newSessionSeconds;
          });
          
          // Stop at 60 seconds (1 minute)
          if (newSeconds >= 60) {
            if (captureIntervalRef.current) {
              clearInterval(captureIntervalRef.current);
              captureIntervalRef.current = null;
            }
            console.log('✅ CAPTURE complete at 1:00');
            return 60;
          }
          
          return newSeconds;
        });
      }, 1000);
    } else if (!isCaptureActive && captureIntervalRef.current) {
      // Stop capture and save seconds
      console.log('⏹️ CAPTURE MODE stopped');
      
      // Save session seconds to total
      if (sessionSeconds > 0) {
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + sessionSeconds;
          console.log(`💾 Saved ${sessionSeconds}s this session. Total: ${newTotal}s`);
          return newTotal;
        });
      }
      
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      setCaptureSeconds(0);
      setSessionSeconds(0);
    }
    
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [isCaptureActive]);
  
  // ========================================
  // CLEANUP: Stop capture and save time when leaving radius
  // ========================================
  useEffect(() => {
    if (!isInsideRadius && isCaptureActive) {
      console.log('❌ Left radius during CAPTURE mode');
      
      // Save the session seconds
      if (sessionSeconds > 0) {
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + sessionSeconds;
          console.log(`💾 Session ended: +${sessionSeconds}s`);
          console.log(`⏱️ Total captured: ${newTotal}s`);
          return newTotal;
        });
      }
      
      // Stop capture mode
      setIsCaptureActive(false);
    }
  }, [isInsideRadius, isCaptureActive, sessionSeconds]);




  // Track user location and check if inside radius
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
        
        const initialDistance = calculateDistance(
          initialLocation.coords.latitude,
          initialLocation.coords.longitude,
          MARKER_LAT,
          MARKER_LNG
        );
        setDistanceToMarker(initialDistance);
        setIsInsideRadius(initialDistance <= RADIUS_METERS);
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
          
          // Calculate distance
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            MARKER_LAT,
            MARKER_LNG
          );
          
          console.log(`Distance: ${distance.toFixed(2)}m, Radius: ${RADIUS_METERS}m`);
          
          setDistanceToMarker(distance);
          
          // Check if user is inside the radius
          const inside = distance <= RADIUS_METERS;
          
          setIsInsideRadius((prev) => {
            if (prev !== inside) {
              console.log(`✅ Radius status changed: ${inside ? 'INSIDE' : 'OUTSIDE'}`);
            }
            return inside;
          });
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
  
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MapView 
        style={styles.map}
        scaleBarEnabled={true}
        scaleBarPosition={{ top: insets.top + 10, left: 16 }}
        compassEnabled={true}
        compassPosition={{ top: insets.top + 10, right: 16 }}
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
            centerCoordinate: [-77.036086, 38.910233],
            zoomLevel: 14,
          }}
          followUserLocation={true}
          followUserMode={followMode}
          followZoomLevel={14}
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
        
        {/* Radius circle - only visible when inside */}
        {isInsideRadius && (
          <ShapeSource
            id="radius-circle"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: generateCirclePolygon(MARKER_LNG, MARKER_LAT, RADIUS_METERS),
              },
              properties: {},
            }}
          >
            <FillLayer
              id="radius-circle-fill"
              style={{
                fillColor: 'rgba(0, 255, 0, 0.2)', // Green fill
              }}
            />
            <LineLayer
              id="radius-circle-stroke"
              style={{
                lineColor: '#00ff00', // Green border
                lineWidth: animatedBorderWidth, // Pulsing animation
              }}
            />
          </ShapeSource>
        )}
        
        {/* Entry arc - Phase 1 (yellow, 0-10 seconds) */}
        {isInsideRadius && entryProgress > 0 && entryProgress < 1 && (
          <ShapeSource
            id="entry-arc"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: generateProgressArc(MARKER_LNG, MARKER_LAT, RADIUS_METERS, entryProgress),
              },
              properties: {},
            }}
          >
            <LineLayer
              id="entry-arc-stroke"
              style={{
                lineColor: '#ffff00',
                lineWidth: 6,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}
        
        
        
        {/* Real POIs from OpenStreetMap */}
        {pois.map((poi) => (
          <POIMarker key={poi.id} poi={poi} size={14} />
        ))}
        
        {/* Mock POI Marker with Callout */}
        <PointAnnotation
          id="mock-poi"
          coordinate={[MARKER_LNG, MARKER_LAT]}
          onSelected={() => {
            console.log('✅ Mock POI Selected');
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              backgroundColor: '#8B4513',
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#000',
            }}
          />
          <Callout title="Mock POI" containerStyle={{ backgroundColor: '#2a2a2a', padding: 0 }}>
            <POICallout poiId="mock-poi-test" poiName="Test Location" />
          </Callout>
        </PointAnnotation>
      </MapView>
      
      {/* Capture timer display - Phase 2 (shows when capturing) */}
      {isCaptureActive && (
        <View style={[styles.timerOverlay, { top: insets.top + 60 }]}>
          <Text style={styles.timerText}>
            {Math.floor(captureSeconds / 60)}:{(captureSeconds % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      )}
      
      {/* Status indicator */}
      {userLocation && distanceToMarker !== null && (
        <View style={[styles.statusIndicator, { bottom: insets.bottom + 20 }]}>
          <Text style={styles.statusText}>
            {isInsideRadius ? `✅ Inside ${RADIUS_METERS}m radius` : `❌ Outside ${RADIUS_METERS}m radius`}
          </Text>
          <Text style={[styles.statusText, { fontSize: 12, marginTop: 4, opacity: 0.8 }]}>
            Distance: {distanceToMarker.toFixed(1)}m
          </Text>
        </View>
      )}
      
      {/* Toggle follow mode button */}
      <TouchableOpacity 
        style={[styles.followButton, { top: insets.top + 10, right: 16 }]}
        onPress={toggleFollowMode}
      >
        <MaterialIcons 
          name={followMode === UserTrackingMode.FollowWithHeading ? "navigation" : "my-location"} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>
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
