import React from 'react';
import { ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
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
 * POI Marker Component
 * Renders a single POI on the map with appropriate icon and colors
 */
export function POIMarker({ poi, size = 14 }: POIMarkerProps) {
  const iconGenerator = getIconGenerator(poi.type);
  const category = POI_CATEGORIES[poi.type as keyof typeof POI_CATEGORIES] || POI_CATEGORIES.other;

  return (
    <ShapeSource
      key={poi.id}
      id={`poi-${poi.id}`}
      shape={{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [iconGenerator(poi.coordinates[0], poi.coordinates[1], size)],
        },
        properties: {
          name: poi.name,
          type: poi.type,
          id: poi.id,
        },
      }}
    >
      <FillLayer
        id={`poi-fill-${poi.id}`}
        style={{
          fillColor: category.color,
        }}
      />
      <LineLayer
        id={`poi-stroke-${poi.id}`}
        style={{
          lineColor: '#000000',
          lineWidth: 2,
        }}
      />
    </ShapeSource>
  );
}

