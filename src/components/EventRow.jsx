import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import TagBadge from './TagBadge';

/**
 * EventRow — single event list item
 */
export default function EventRow({ event, onClick, compact = false }) {
  const date = new Date(event.event_date);
  const isUpcoming = date >= new Date();

  const monthStr = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const dayStr = date.getDate().toString().padStart(2, '0');

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 py-2 px-3 border-b cursor-pointer hover:bg-[rgba(0,180,216,0.04)] transition-colors group"
        style={{ borderColor: 'var(--j-border)' }}
        onClick={() => onClick?.(event)}
      >
        {/* Date block */}
        <div
          className="flex-shrink-0 w-10 h-10 flex flex-col items-center justify-center border"
          style={{ borderColor: 'var(--j-border)', background: 'var(--j-dim)' }}
        >
          <span className="text-[8px] tracking-widest font-display" style={{ color: 'var(--j-muted)' }}>
            {monthStr}
          </span>
          <span className="text-sm font-mono-data font-bold" style={{ color: isUpcoming ? 'var(--j-cyan)' : 'var(--j-muted)' }}>
            {dayStr}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-display tracking-wide truncate"
            style={{ color: isUpcoming ? 'var(--j-text)' : 'var(--j-muted)' }}
          >
            {event.title}
          </div>
          {event.location_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} style={{ color: 'var(--j-muted)' }} />
              <span className="text-[10px] font-mono-data truncate" style={{ color: 'var(--j-muted)' }}>
                {event.location_name}
              </span>
            </div>
          )}
        </div>

        <TagBadge source={event.source} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-4 py-3 px-4 border-b cursor-pointer hover:bg-[rgba(0,180,216,0.04)] transition-all group"
      style={{ borderColor: 'var(--j-border)' }}
      onClick={() => onClick?.(event)}
    >
      {/* Date block */}
      <div
        className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center border"
        style={{ borderColor: 'var(--j-border)', background: 'var(--j-dim)' }}
      >
        <span className="text-[8px] tracking-widest font-display" style={{ color: 'var(--j-muted)' }}>
          {monthStr}
        </span>
        <span className="text-lg font-mono-data font-bold leading-none mt-0.5" style={{ color: isUpcoming ? 'var(--j-cyan)' : 'var(--j-muted)' }}>
          {dayStr}
        </span>
      </div>

      {/* Title + location */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-display tracking-wide group-hover:text-cyan-400 transition-colors truncate"
          style={{ color: isUpcoming ? 'var(--j-text)' : 'var(--j-muted)', letterSpacing: '1px' }}
        >
          {event.title}
        </div>
        <div className="flex items-center gap-3 mt-1">
          {event.location_name && (
            <div className="flex items-center gap-1">
              <MapPin size={10} style={{ color: 'var(--j-muted)' }} />
              <span className="text-[11px] font-mono-data truncate" style={{ color: 'var(--j-muted)' }}>
                {event.location_name}
              </span>
            </div>
          )}
          {event.event_time && (
            <div className="flex items-center gap-1">
              <Clock size={10} style={{ color: 'var(--j-muted)' }} />
              <span className="text-[11px] font-mono-data" style={{ color: 'var(--j-muted)' }}>
                {event.event_time}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Event type */}
      <span
        className="hidden sm:block text-[9px] tracking-widest uppercase font-display px-2 py-0.5 border"
        style={{ borderColor: 'var(--j-border)', color: 'var(--j-muted)' }}
      >
        {event.event_type || 'GENERAL'}
      </span>

      <TagBadge source={event.source} />
    </div>
  );
}
