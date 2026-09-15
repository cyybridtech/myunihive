/**
 * Centralized Map Configuration & Resilient Fallback Styles
 * Provides verified Mapbox tokens and robust OpenStreetMap fallbacks
 * to ensure maps render reliably across all network conditions and browsers.
 */

import mapboxgl from 'mapbox-gl';

// Disable telemetry events to prevent console ERR_BLOCKED_BY_CLIENT errors under adblockers
try {
  if (mapboxgl && mapboxgl.config) {
    Object.defineProperty(mapboxgl.config, 'EVENTS_URL', {
      get: () => null,
      set: () => {},
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  // Telemetry override is optional
}

// Verified reliable Mapbox token
const VERIFIED_TOKEN = 'pk.eyJ1IjoiY3l5YnJpZCIsImEiOiJjbXA3a2Z4NTcwdHY1MnBzOTd4MmIxem04In0.Fy1GZDtHXGf2INyt0_f8Kw';

// Known broken / 403-restricted token to safeguard against
const REVOKED_TOKEN = 'pk.eyJ1IjoiY3l5YnJpZCIsImEiOiJjbXA4ZDZyZDIwb2ZmMnFzZnNpZjJ0aHF2In0.wPt2DmSb2voR6LjTI7vfyg';

export const getMapboxToken = (): string => {
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  if (envToken && envToken !== REVOKED_TOKEN) {
    return envToken;
  }
  return VERIFIED_TOKEN;
};

export const MAPBOX_TOKEN = getMapboxToken();

export const MAPBOX_SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
export const MAPBOX_STREETS_STYLE = 'mapbox://styles/mapbox/streets-v12';

/**
 * High-reliability OpenStreetMap raster style
 * Never requires an API key, zero 403 errors, completely immune to token limits.
 */
export const OSM_FALLBACK_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

/**
 * Fetch walking directions safely with graceful fallback
 */
export async function fetchWalkingRoute(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<{ distanceKm: string; durationMin: number; geometry: any } | null> {
  const token = getMapboxToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&access_token=${token}`
    );
    if (!res.ok) {
      console.warn(`Mapbox directions returned status ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
      const durationMin = Math.round(data.routes[0].duration / 60);
      return {
        distanceKm,
        durationMin,
        geometry: data.routes[0].geometry
      };
    }
  } catch (err) {
    console.warn('Could not fetch walking route directions:', err);
  }
  return null;
}
