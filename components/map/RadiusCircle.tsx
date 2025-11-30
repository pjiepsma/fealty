import React from 'react';
import { ShapeSource, FillLayer, LineLayer } from '@rnmapbox/maps';
import { generateCirclePolygon, generateProgressArc } from '@/utils/mapIcons';
import { CLAIM_RADIUS } from '@/constants/config';

interface RadiusCircleProps {
  coordinates: [number, number];
  entryProgress: number;
  isCaptureActive: boolean;
}

export function RadiusCircle({ coordinates, entryProgress, isCaptureActive }: RadiusCircleProps) {
  const circlePolygon = generateCirclePolygon(coordinates, CLAIM_RADIUS);
  
  // Generate yellow entry progress arc (0-100% during entry mode)
  const entryArc = generateProgressArc(coordinates, CLAIM_RADIUS, entryProgress * 360);

  return (
    <>
      {/* Base green circle */}
      <ShapeSource
        id="radius-circle-source"
        shape={{
          type: 'Feature',
          geometry: circlePolygon,
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
            geometry: entryArc,
            properties: {},
          }}
        >
          <LineLayer
            id="entry-arc-line"
            style={{
              lineColor: '#FFC107',
              lineWidth: 6,
            }}
          />
        </ShapeSource>
      )}
    </>
  );
}

