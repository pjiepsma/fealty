/**
 * Map Icon Generator Functions
 * 
 * These functions generate polygon coordinates for custom map icons
 * that scale naturally with map zoom levels (using geographic coordinates).
 */

/**
 * Helper to convert meters to coordinate offset
 */
function toCoord(
  centerLng: number,
  centerLat: number,
  xMeters: number,
  yMeters: number
): [number, number] {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * (Math.PI / 180));
  
  return [
    centerLng + (xMeters / metersPerDegreeLng),
    centerLat + (yMeters / metersPerDegreeLat)
  ];
}

/**
 * Generate circle polygon coordinates for a fixed radius in meters
 */
export function generateCirclePolygon(
  centerLng: number,
  centerLat: number,
  radiusMeters: number,
  points: number = 64
): number[][][] {
  const coordinates: number[][] = [];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * (Math.PI / 180));
  
  const radiusLat = radiusMeters / metersPerDegreeLat;
  const radiusLng = radiusMeters / metersPerDegreeLng;
  
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = radiusLng * Math.cos(theta);
    const y = radiusLat * Math.sin(theta);
    coordinates.push([centerLng + x, centerLat + y]);
  }
  // Close the polygon
  coordinates.push(coordinates[0]);
  return [coordinates];
}

/**
 * Generate progress arc coordinates (for circular progress indicators)
 */
export function generateProgressArc(
  centerLng: number,
  centerLat: number,
  radiusMeters: number,
  progress: number, // 0 to 1
  points: number = 64
): number[][] {
  const coordinates: number[][] = [];
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * (Math.PI / 180));
  
  const radiusLat = radiusMeters / metersPerDegreeLat;
  const radiusLng = radiusMeters / metersPerDegreeLng;
  
  // Start from top (-90 degrees) and go clockwise
  const totalPoints = Math.ceil(points * progress);
  const startAngle = (3 * Math.PI) / 2;
  
  for (let i = 0; i <= totalPoints; i++) {
    const theta = startAngle + (i / points) * (2 * Math.PI) * progress;
    const x = radiusLng * Math.cos(theta);
    const y = radiusLat * Math.sin(theta);
    coordinates.push([centerLng + x, centerLat + y]);
  }
  
  return coordinates;
}

/**
 * Generate shield icon coordinates (medieval shield shape)
 */
export function generateShieldIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const width = sizeMeters;
  const height = sizeMeters * 1.2;
  
  // Shield shape: flat top, curved sides, pointed bottom
  return [
    toCoord(centerLng, centerLat, 0, height / 2),           // Top center
    toCoord(centerLng, centerLat, width / 2, height / 2),   // Top right
    toCoord(centerLng, centerLat, width / 2, height / 4),   // Right upper
    toCoord(centerLng, centerLat, width / 3, 0),            // Right middle
    toCoord(centerLng, centerLat, width / 4, -height / 3),  // Right lower
    toCoord(centerLng, centerLat, 0, -height / 2),          // Bottom point
    toCoord(centerLng, centerLat, -width / 4, -height / 3), // Left lower
    toCoord(centerLng, centerLat, -width / 3, 0),           // Left middle
    toCoord(centerLng, centerLat, -width / 2, height / 4),  // Left upper
    toCoord(centerLng, centerLat, -width / 2, height / 2),  // Top left
    toCoord(centerLng, centerLat, 0, height / 2),           // Close shape
  ];
}

/**
 * Generate castle icon coordinates (simplified design with towers and arched doorway)
 */
export function generateCastleIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2; // half width
  const h = sizeMeters * 0.9; // height
  const towerW = w * 0.35; // tower width
  
  const coords: [number, number][] = [];
  
  // Start at bottom left of left tower
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));
  // Left tower up
  coords.push(toCoord(centerLng, centerLat, -w, h/4));
  // Left tower roof (triangle)
  coords.push(toCoord(centerLng, centerLat, -w + towerW, h/2));
  coords.push(toCoord(centerLng, centerLat, -w + 2*towerW, h/4));
  // Connection wall
  coords.push(toCoord(centerLng, centerLat, -w + 2*towerW, h/6));
  coords.push(toCoord(centerLng, centerLat, w - 2*towerW, h/6));
  // Right tower roof (triangle)
  coords.push(toCoord(centerLng, centerLat, w - 2*towerW, h/4));
  coords.push(toCoord(centerLng, centerLat, w - towerW, h/2));
  coords.push(toCoord(centerLng, centerLat, w, h/4));
  // Right tower down
  coords.push(toCoord(centerLng, centerLat, w, -h/2));
  // Bottom (with arch doorway notch)
  coords.push(toCoord(centerLng, centerLat, w * 0.4, -h/2));
  coords.push(toCoord(centerLng, centerLat, w * 0.4, -h/4));
  
  // Arch doorway (simplified semicircle)
  const archPoints = 8;
  for (let i = 0; i <= archPoints; i++) {
    const angle = Math.PI * (i / archPoints);
    const x = (w * 0.25) * Math.cos(angle);
    const y = -h/4 + (h * 0.15) * Math.sin(angle);
    coords.push(toCoord(centerLng, centerLat, x, y));
  }
  
  coords.push(toCoord(centerLng, centerLat, -w * 0.4, -h/4));
  coords.push(toCoord(centerLng, centerLat, -w * 0.4, -h/2));
  // Close polygon
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));
  
  return coords;
}

/**
 * Generate windmill icon coordinates (classic Dutch windmill with blades)
 */
export function generateWindmillIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2;
  const h = sizeMeters;
  const coords: [number, number][] = [];
  
  // Trapezoid body (wider at bottom)
  coords.push(toCoord(centerLng, centerLat, -w * 0.4, -h/2)); // Bottom left
  coords.push(toCoord(centerLng, centerLat, -w * 0.25, h/3)); // Top left
  coords.push(toCoord(centerLng, centerLat, w * 0.25, h/3));  // Top right
  coords.push(toCoord(centerLng, centerLat, w * 0.4, -h/2));  // Bottom right
  
  // Add windmill blade indicator (diagonal line from top)
  coords.push(toCoord(centerLng, centerLat, w * 0.6, h/2));   // Blade top
  coords.push(toCoord(centerLng, centerLat, w * 0.25, h/3));  // Back to top
  
  // Close
  coords.push(toCoord(centerLng, centerLat, -w * 0.4, -h/2));
  
  return coords;
}

/**
 * Generate museum icon coordinates (building with triangular roof)
 */
export function generateMuseumIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2;
  const h = sizeMeters * 0.9;
  const coords: [number, number][] = [];
  
  // Building base
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));      // Bottom left
  coords.push(toCoord(centerLng, centerLat, -w, h/4));       // Left wall
  
  // Triangular roof (pediment)
  coords.push(toCoord(centerLng, centerLat, 0, h/2));        // Roof peak
  coords.push(toCoord(centerLng, centerLat, w, h/4));        // Right roof
  
  // Right wall
  coords.push(toCoord(centerLng, centerLat, w, -h/2));       // Bottom right
  
  // Add columns (simple vertical lines)
  coords.push(toCoord(centerLng, centerLat, w * 0.5, -h/2)); 
  coords.push(toCoord(centerLng, centerLat, w * 0.5, h/4));
  coords.push(toCoord(centerLng, centerLat, w, h/4));
  coords.push(toCoord(centerLng, centerLat, w, -h/2));
  
  // Close
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));
  
  return coords;
}

/**
 * Generate park icon coordinates (tree shape)
 */
export function generateParkIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2;
  const h = sizeMeters;
  const coords: [number, number][] = [];
  
  // Tree trunk (bottom center)
  coords.push(toCoord(centerLng, centerLat, -w * 0.15, -h/2));
  coords.push(toCoord(centerLng, centerLat, -w * 0.15, -h/5));
  
  // Tree foliage (cloud-like shape with triangular top)
  coords.push(toCoord(centerLng, centerLat, -w * 0.6, -h/5));  // Left base
  coords.push(toCoord(centerLng, centerLat, -w * 0.5, h/4));   // Left side
  coords.push(toCoord(centerLng, centerLat, -w * 0.3, h/3));   // Left upper
  coords.push(toCoord(centerLng, centerLat, 0, h/2));          // Top peak
  coords.push(toCoord(centerLng, centerLat, w * 0.3, h/3));    // Right upper
  coords.push(toCoord(centerLng, centerLat, w * 0.5, h/4));    // Right side
  coords.push(toCoord(centerLng, centerLat, w * 0.6, -h/5));   // Right base
  
  // Back to trunk
  coords.push(toCoord(centerLng, centerLat, w * 0.15, -h/5));
  coords.push(toCoord(centerLng, centerLat, w * 0.15, -h/2));
  
  // Close
  coords.push(toCoord(centerLng, centerLat, -w * 0.15, -h/2));
  
  return coords;
}

/**
 * Generate church icon coordinates (building with cross/steeple)
 */
export function generateChurchIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2;
  const h = sizeMeters;
  const coords: [number, number][] = [];
  
  // Main building
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));       // Bottom left
  coords.push(toCoord(centerLng, centerLat, -w, h/4));        // Left wall
  
  // Tower/steeple (narrow top section)
  coords.push(toCoord(centerLng, centerLat, -w * 0.3, h/4));  // Tower left base
  coords.push(toCoord(centerLng, centerLat, -w * 0.2, h/2));  // Tower left
  
  // Cross on top (simplified)
  coords.push(toCoord(centerLng, centerLat, -w * 0.1, h/2));
  coords.push(toCoord(centerLng, centerLat, -w * 0.1, h * 0.65)); // Cross vertical
  coords.push(toCoord(centerLng, centerLat, w * 0.1, h * 0.65));
  coords.push(toCoord(centerLng, centerLat, w * 0.1, h/2));
  
  coords.push(toCoord(centerLng, centerLat, w * 0.2, h/2));   // Tower right
  coords.push(toCoord(centerLng, centerLat, w * 0.3, h/4));   // Tower right base
  
  // Right wall
  coords.push(toCoord(centerLng, centerLat, w, h/4));
  coords.push(toCoord(centerLng, centerLat, w, -h/2));        // Bottom right
  
  // Close
  coords.push(toCoord(centerLng, centerLat, -w, -h/2));
  
  return coords;
}

/**
 * Generate monument icon coordinates (obelisk/pillar shape)
 */
export function generateMonumentIcon(
  centerLng: number,
  centerLat: number,
  sizeMeters: number
): number[][] {
  const w = sizeMeters / 2;
  const h = sizeMeters * 1.1;
  const coords: [number, number][] = [];
  
  // Base (wider)
  coords.push(toCoord(centerLng, centerLat, -w * 0.6, -h/2));
  coords.push(toCoord(centerLng, centerLat, -w * 0.6, -h/3));
  
  // Main pillar (narrower)
  coords.push(toCoord(centerLng, centerLat, -w * 0.3, -h/3));
  coords.push(toCoord(centerLng, centerLat, -w * 0.25, h/3));
  
  // Top (pointed obelisk)
  coords.push(toCoord(centerLng, centerLat, 0, h/2));         // Peak
  
  coords.push(toCoord(centerLng, centerLat, w * 0.25, h/3));
  coords.push(toCoord(centerLng, centerLat, w * 0.3, -h/3));
  
  // Right base
  coords.push(toCoord(centerLng, centerLat, w * 0.6, -h/3));
  coords.push(toCoord(centerLng, centerLat, w * 0.6, -h/2));
  
  // Close
  coords.push(toCoord(centerLng, centerLat, -w * 0.6, -h/2));
  
  return coords;
}

// TODO: Add more icon generators as needed

