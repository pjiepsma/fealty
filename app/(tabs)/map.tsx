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
} from '@rnmapbox/maps';
import { View } from 'react-native';
import { usePOIs } from '@/hooks/usePOIs';
import { POIMarker } from '@/components/map/POIMarker';

// Set Mapbox token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!);

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [followMode, setFollowMode] = useState<UserTrackingMode>(UserTrackingMode.Follow);
  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  // Location tracking
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  // Load nearby POIs from OpenStreetMap
  const { pois, isLoadingPOIs, error: poisError } = usePOIs(userLocation, 10000);
  
  const toggleFollowMode = () => {
    setFollowMode((current) => 
      current === UserTrackingMode.Follow 
        ? UserTrackingMode.FollowWithHeading 
        : UserTrackingMode.Follow
    );
  };

  // Track user location
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
        
        {/* Real POIs from OpenStreetMap */}
        {pois.map((poi) => (
          <POIMarker key={poi.id} poi={poi} size={14} />
        ))}
      </MapView>
      
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
});
