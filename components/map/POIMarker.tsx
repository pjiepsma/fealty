import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PointAnnotation, Callout } from '@rnmapbox/maps';
import { POI } from '@/types';
import { POI_CATEGORIES } from '@/constants/config';
import {
  generateCastleIcon,
  generateWindmillIcon,
  generateMuseumIcon,
  generateParkIcon,
  generateChurchIcon,
  generateMonumentIcon,
} from '@/utils/mapIcons';

interface POIMarkerProps {
  poi: POI;
  size?: number;
}

/**
 * Get the appropriate icon generator function based on POI type
 */
function getIconGenerator(type: string) {
  switch (type) {
    case 'castle':
      return generateCastleIcon;
    case 'windmill':
      return generateWindmillIcon;
    case 'museum':
      return generateMuseumIcon;
    case 'park':
      return generateParkIcon;
    case 'church':
      return generateChurchIcon;
    case 'monument':
    case 'historic':
      return generateMonumentIcon;
    case 'attraction':
      return generateCastleIcon; // Default to castle for attractions
    default:
      return generateCastleIcon;
  }
}

/**
 * Render POI Icon as a View component
 */
function POIIcon({ type, size }: { type: string; size: number }) {
  const category = POI_CATEGORIES[type as keyof typeof POI_CATEGORIES] || POI_CATEGORIES.other;
  
  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          backgroundColor: category.color,
          borderRadius: size / 2,
        },
      ]}
    />
  );
}

/**
 * POI Marker Component
 * Renders a single POI on the map with appropriate icon, colors, and callout
 */
export function POIMarker({ poi, size = 20 }: POIMarkerProps) {
  return (
    <PointAnnotation
      key={poi.id}
      id={`poi-${poi.id}`}
      coordinate={poi.coordinates}
      onSelected={() => {
        console.log('✅ POI Selected:', poi.name);
      }}
    >
      <POIIcon type={poi.type} size={size} />
      <Callout title={poi.name} />
    </PointAnnotation>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    borderWidth: 2,
    borderColor: '#000',
  },
});

