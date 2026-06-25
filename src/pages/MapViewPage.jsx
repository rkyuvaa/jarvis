import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import MapEmbed from '../components/MapEmbed';
import HudCard from '../components/HudCard';

export default function MapViewPage() {
  const { user } = useAuth();
  const { events, loading } = useEvents(user?.id);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [focusedEvent, setFocusedEvent] = useState(null);

  // Events that have coordinates
  const mappedEvents = useMemo(() =>
    events.filter(e => e.latitude && e.longitude),
    [events]
  );

  const handleMarkerClick = (event) => {
    setSelectedEvent(event);
  };

  const handleListClick = (event) => {
    setSelectedEvent(event);
    setFocusedEvent(event);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 boot-0">
        <p className="label-xs mb-1">GEOSPATIAL</p>
        <h1 className="font-display text-2xl tracking-widest" style={{ color: 'var(--j-text)', letterSpacing: '4px' }}>
          MAP VIEW
        </h1>
        <div className="hud-divider mt-3 mb-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 boot-1">
          <HudCard>
            {loading ? (
              <div className="flex items-center justify-center" style={{ height: '500px' }}>
                <div className="flex gap-2">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            ) : (
              <MapEmbed
                lat={focusedEvent?.latitude}
                lng={focusedEvent?.longitude}
                zoom={focusedEvent ? 14 : 10}
                events={mappedEvents}
                onMarkerClick={handleMarkerClick}
                height="500px"
              />
            )}
          </HudCard>

          {/* Selected event info */}
          {selectedEvent && (
            <HudCard className="mt-4 p-4 boot-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xs tracking-widest" style={{ color: 'var(--j-cyan)', letterSpacing: '2px' }}>
                    {selectedEvent.title}
                  </p>
                  {selectedEvent.location_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} style={{ color: 'var(--j-muted)' }} />
                      <p className="font-mono-data text-[10px]" style={{ color: 'var(--j-muted)' }}>
                        {selectedEvent.location_name}
                      </p>
                    </div>
                  )}
                  <p className="font-mono-data text-[10px] mt-0.5" style={{ color: 'var(--j-muted)' }}>
                    {new Date(selectedEvent.event_date).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    {selectedEvent.event_time && ` · ${selectedEvent.event_time}`}
                  </p>
                </div>
                <a
                  href={`https://maps.google.com/?q=${selectedEvent.latitude},${selectedEvent.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hud-btn sm flex items-center gap-1.5"
                >
                  <Navigation size={10} />
                  <span>DIRECTIONS</span>
                </a>
              </div>
            </HudCard>
          )}
        </div>

        {/* Events list */}
        <div className="lg:col-span-1 boot-2">
          <HudCard>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--j-border)' }}>
              <div className="flex items-center justify-between">
                <span className="label-sm" style={{ color: 'var(--j-blue)' }}>MAPPED EVENTS</span>
                <span className="font-mono-data text-[9px]" style={{ color: 'var(--j-muted)' }}>
                  {mappedEvents.length} / {events.length}
                </span>
              </div>
            </div>

            {mappedEvents.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin size={28} className="mx-auto mb-3" style={{ color: 'var(--j-muted)' }} />
                <p className="font-mono-data text-xs" style={{ color: 'var(--j-muted)' }}>
                  No events with location data.
                </p>
                <p className="font-mono-data text-[9px] mt-1" style={{ color: 'var(--j-muted)' }}>
                  Scan a photo with an address to auto-geocode.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                {mappedEvents.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  const date = new Date(ev.event_date);
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                      style={{
                        borderBottom: '1px solid var(--j-border)',
                        background: isSelected ? 'rgba(0,255,255,0.05)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--j-cyan)' : '2px solid transparent',
                      }}
                      onClick={() => handleListClick(ev)}
                    >
                      <div
                        className="flex-shrink-0 w-2 h-2 rounded-full"
                        style={{
                          background: isSelected ? 'var(--j-cyan)' : 'var(--j-muted)',
                          boxShadow: isSelected ? '0 0 6px var(--j-cyan)' : 'none',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-display text-[10px] tracking-wide truncate"
                          style={{ color: isSelected ? 'var(--j-cyan)' : 'var(--j-text)', letterSpacing: '1px' }}
                        >
                          {ev.title}
                        </p>
                        <p className="font-mono-data text-[9px] truncate" style={{ color: 'var(--j-muted)' }}>
                          {date.toLocaleDateString('default', { month: 'short', day: 'numeric' }).toUpperCase()}
                          {ev.location_name && ` · ${ev.location_name}`}
                        </p>
                      </div>
                      <ChevronRight size={10} style={{ color: 'var(--j-muted)', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
          </HudCard>

          {/* Stats */}
          <HudCard className="mt-4 p-4 boot-3">
            <p className="label-xs mb-3">COVERAGE</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-muted)' }}>TOTAL EVENTS</span>
                <span className="font-mono-data text-sm" style={{ color: 'var(--j-text)' }}>{events.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-muted)' }}>WITH LOCATION</span>
                <span className="font-mono-data text-sm" style={{ color: 'var(--j-cyan)' }}>{mappedEvents.length}</span>
              </div>
              <div className="mt-2 h-1.5" style={{ background: 'var(--j-border)', borderRadius: '1px' }}>
                <div
                  style={{
                    width: events.length ? `${(mappedEvents.length / events.length) * 100}%` : '0%',
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--j-blue), var(--j-cyan))',
                    boxShadow: '0 0 6px var(--j-cyan)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </HudCard>
        </div>
      </div>
    </div>
  );
}
