/**
 * Geocode an address string to lat/lng coordinates using Google Maps Geocoding API.
 * @param {string} address
 * @returns {Promise<{lat:number, lng:number, formatted:string}|null>}
 */
export async function geocodeAddress(address) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || !address) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return {
        lat: loc.lat,
        lng: loc.lng,
        formatted: data.results[0].formatted_address,
      };
    }
    return null;
  } catch (e) {
    console.warn('[JARVIS Maps] Geocoding failed:', e);
    return null;
  }
}

/**
 * Load the Google Maps JavaScript API dynamically.
 * @returns {Promise<void>}
 */
export function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY not set'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

/**
 * Create custom JARVIS-style map marker for Google Maps.
 * @param {google.maps.Map} map
 * @param {{lat:number, lng:number}} position
 * @param {object} event
 * @param {Function} onClick
 * @returns {google.maps.Marker}
 */
export function createJarvisMarker(map, position, event, onClick) {
  const marker = new window.google.maps.Marker({
    position,
    map,
    title: event.title,
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#00ffff',
      fillOpacity: 0.9,
      strokeColor: '#020b14',
      strokeWeight: 2,
    },
    animation: window.google.maps.Animation.DROP,
  });

  if (onClick) marker.addListener('click', () => onClick(event));
  return marker;
}
