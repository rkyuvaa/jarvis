import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, createJarvisMarker } from '../lib/maps';
import { MapPin } from 'lucide-react';

/**
 * MapEmbed — Embeds Google Maps with JARVIS-styled markers.
 * Can render a single location or multiple event pins.
 */
export default function MapEmbed({
  lat,
  lng,
  zoom = 14,
  events = [],
  onMarkerClick,
  height = '300px',
  className = '',
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadGoogleMapsScript();
        if (cancelled || !mapRef.current) return;

        const center = lat && lng
          ? { lat: parseFloat(lat), lng: parseFloat(lng) }
          : { lat: 40.7128, lng: -74.006 };

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            { elementType: 'geometry',        stylers: [{ color: '#020b14' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#4a7a99' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#020b14' }] },
            { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#020b14' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#00b4d8' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050f1c' }] },
            { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0d3a5c' }] },
            { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#050f1c' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#030d17' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#020b14' }] },
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          backgroundColor: '#020b14',
        });

        mapInstance.current = map;

        // If events array provided, add all pins
        if (events.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          events.forEach((ev) => {
            if (ev.latitude && ev.longitude) {
              const pos = { lat: parseFloat(ev.latitude), lng: parseFloat(ev.longitude) };
              const marker = createJarvisMarker(map, pos, ev, onMarkerClick);
              markers.current.push(marker);
              bounds.extend(pos);
            }
          });
          if (!bounds.isEmpty()) map.fitBounds(bounds);
        } else if (lat && lng) {
          // Single location marker
          createJarvisMarker(map, { lat: parseFloat(lat), lng: parseFloat(lng) }, {}, null);
        }

        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          console.warn('[JARVIS Map] Init error:', e);
          setError(e.message);
          setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [lat, lng, zoom, events, onMarkerClick]);

  if (error) {
    return (
      <div
        className={`hud-card flex flex-col items-center justify-center gap-2 ${className}`}
        style={{ height, background: 'var(--j-panel)' }}
      >
        <MapPin size={24} style={{ color: 'var(--j-muted)' }} />
        <span className="text-[10px] font-display tracking-widest uppercase" style={{ color: 'var(--j-muted)' }}>
          MAP UNAVAILABLE
        </span>
        <span className="text-[9px] font-mono-data" style={{ color: 'var(--j-muted)' }}>
          {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Google Maps API key not configured' : error}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: 'var(--j-panel)' }}
        >
          <div className="text-[10px] font-display tracking-widest uppercase" style={{ color: 'var(--j-muted)' }}>
            LOADING MAP...
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
