import React from 'react';
import { ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
import { generateCirclePolygon, generateProgressArc } from '@/utils/mapIcons';
import { CLAIM_CONSTANTS } from '@/constants/config';

const { CLAIM_RADIUS } = CLAIM_CONSTANTS;

interface RadiusCircleProps {
  coordinates: [number, number];
  entryProgress: number;
  isCaptureActive: boolean;
}

export function RadiusCircle({ coordinates, entryProgress, isCaptureActive }: RadiusCircleProps) {
  const [lng, lat] = coordinates;
  const circlePolygonCoords = generateCirclePolygon(lng, lat, CLAIM_RADIUS);
  
  // Generate yellow entry progress arc (0-100% during entry mode)
  const entryArcCoords = generateProgressArc(lng, lat, CLAIM_RADIUS, entryProgress);

  return (
    <>
      {/* Base green circle */}
      <ShapeSource
        id="radius-circle-source"
        shape={{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: circlePolygonCoords,
          },
          properties: {},
        }}
      >
        <FillLayer
          id="radius-circle-fill"
          style={{
            fillColor: isCaptureActive ? '#4CAF50' : '#FFC107',
            fillOpacity: 0.2,
          }}
        />
        <LineLayer
          id="radius-circle-line"
          style={{
            lineColor: isCaptureActive ? '#4CAF50' : '#FFC107',
            lineWidth: 3,
          }}
        />
      </ShapeSource>

      {/* Yellow entry progress arc (shows during entry mode) */}
      {entryProgress > 0 && entryProgress < 1 && (
        <ShapeSource
          id="entry-arc-source"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: entryArcCoords,
            },
            properties: {},
          }}
        >
          <LineLayer
            id="entry-arc-line"
            style={{
              lineColor: '#FFC107',
              lineWidth: 6,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      )}
    </>
  );
}
