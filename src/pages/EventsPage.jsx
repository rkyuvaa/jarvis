import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, MapPin, Clock, Image, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { useReminders } from '../hooks/useReminders';
import { supabase } from '../lib/supabase';
import { geocodeAddress } from '../lib/maps';
import EventRow from '../components/EventRow';
import TagBadge from '../components/TagBadge';
import HudCard from '../components/HudCard';
import MapEmbed from '../components/MapEmbed';

// ── CALENDAR ─────────────────────────────────────────────────
function HudCalendar({ year, month, eventDates, selectedDate, onSelectDate, onMonthChange }) {
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' }).toUpperCase();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const cells = [];
    // Leading empty days
    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(year, month, -first.getDay() + i + 1);
      cells.push({ date: d, current: false });
    }
    // Current month
    for (let d = 1; d <= last.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), current: true });
    }
    // Trailing empty days
    const trailing = 42 - cells.length;
    for (let i = 1; i <= trailing; i++) {
      cells.push({ date: new Date(year, month + 1, i), current: false });
    }
    return cells;
  }, [year, month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <HudCard className="boot-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--j-border)' }}>
        <button onClick={() => onMonthChange(-1)} style={{ color: 'var(--j-muted)' }}>
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-xs tracking-widest" style={{ color: 'var(--j-cyan)', letterSpacing: '4px' }}>
          {monthName} {year}
        </span>
        <button onClick={() => onMonthChange(1)} style={{ color: 'var(--j-muted)' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="cal-day" style={{ color: 'var(--j-muted)', cursor: 'default', fontSize: '8px', letterSpacing: '1px' }}>
              {d}
            </div>
          ))}
        </div>
        {/* Date grid */}
        <div className="grid grid-cols-7">
          {days.map(({ date, current }, i) => {
            const dateStr = date.toISOString().slice(0, 10);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate === dateStr;
            const hasEvent = eventDates.has(dateStr);

            return (
              <div
                key={i}
                className={`cal-day ${!current ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}`}
                onClick={() => current && onSelectDate(dateStr)}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </HudCard>
  );
}

// ── EVENT DETAIL MODAL ────────────────────────────────────────
function EventDetailModal({ event, reminders, onClose }) {
  if (!event) return null;
  const date = new Date(event.event_date);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel" style={{ maxWidth: '560px', width: '90%' }}>
        <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid var(--j-border)' }}>
          <div>
            <TagBadge source={event.source} />
            <h2 className="font-display text-base tracking-widest mt-2" style={{ color: 'var(--j-text)', letterSpacing: '2px' }}>
              {event.title}
            </h2>
            <p className="font-mono-data text-[10px] mt-1" style={{ color: 'var(--j-muted)' }}>
              {date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
              {event.event_time && ` · ${event.event_time}`}
            </p>
          </div>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--j-muted)' }} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Location */}
          {event.location_name && (
            <div className="flex items-start gap-2">
              <MapPin size={14} style={{ color: 'var(--j-cyan)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="font-mono-data text-xs" style={{ color: 'var(--j-text)' }}>{event.location_name}</p>
                {event.location_address && (
                  <p className="font-mono-data text-[10px]" style={{ color: 'var(--j-muted)' }}>{event.location_address}</p>
                )}
              </div>
            </div>
          )}

          {/* Map embed */}
          {event.latitude && event.longitude && (
            <MapEmbed lat={event.latitude} lng={event.longitude} height="200px" />
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="label-xs mb-1">NOTES</p>
              <p className="font-mono-data text-xs" style={{ color: 'var(--j-text)' }}>{event.description}</p>
            </div>
          )}

          {/* Source image */}
          {event.source_image_url && (
            <div>
              <p className="label-xs mb-2 flex items-center gap-1">
                <Image size={10} />SOURCE PHOTO
              </p>
              <img
                src={event.source_image_url}
                alt="Source"
                className="w-full max-h-48 object-cover"
                style={{ border: '1px solid var(--j-border)', filter: 'brightness(0.8)' }}
              />
            </div>
          )}

          {/* Linked reminders */}
          {reminders.length > 0 && (
            <div>
              <p className="label-xs mb-2">LINKED REMINDERS</p>
              <div className="space-y-2">
                {reminders.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 py-1.5 px-3" style={{ background: 'var(--j-dim)', border: '1px solid var(--j-border)' }}>
                    <Clock size={10} style={{ color: 'var(--j-muted)' }} />
                    <span className="font-mono-data text-[10px] flex-1" style={{ color: 'var(--j-text)' }}>{r.title}</span>
                    <span className="font-mono-data text-[9px]" style={{ color: r.is_sent ? 'var(--j-green)' : 'var(--j-muted)' }}>
                      {r.is_sent ? 'SENT' : new Date(r.remind_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Get Directions */}
          {(event.latitude && event.longitude || event.location_address) && (
            <a
              href={`https://maps.google.com/?q=${event.latitude && event.longitude ? `${event.latitude},${event.longitude}` : encodeURIComponent(event.location_address || '')}`}
              target="_blank"
              rel="noreferrer"
              className="hud-btn cyan w-full flex items-center justify-center gap-2 mt-2"
            >
              <MapPin size={12} />
              <span>GET DIRECTIONS</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ADD EVENT INLINE FORM ─────────────────────────────────────
function AddEventModal({ userId, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', event_date: '', event_time: '', location_name: '', location_address: '', event_type: 'general', description: '', reminder_1day: true, reminder_1week: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.event_date) { setError('Title and date required.'); return; }
    setLoading(true); setError(null);
    try {
      let lat = null, lng = null;
      if (form.location_address) {
        const geo = await geocodeAddress(form.location_address);
        if (geo) { lat = geo.lat; lng = geo.lng; }
      }
      const { data: ev, error: err } = await supabase.from('events').insert({
        user_id: userId, title: form.title,
        event_date: new Date(form.event_date).toISOString(),
        event_time: form.event_time || null,
        location_name: form.location_name || null,
        location_address: form.location_address || null,
        latitude: lat, longitude: lng,
        event_type: form.event_type,
        description: form.description || null,
        source: 'manual',
      }).select().single();
      if (err) throw err;

      const base = new Date(form.event_date);
      const rems = [];
      if (form.reminder_1week) {
        const at = new Date(base); at.setDate(at.getDate() - 7); at.setHours(9, 0, 0, 0);
        rems.push({ user_id: userId, event_id: ev.id, title: `1 week: ${form.title}`, remind_at: at.toISOString(), is_sent: false });
      }
      if (form.reminder_1day) {
        const at = new Date(base); at.setDate(at.getDate() - 1); at.setHours(9, 0, 0, 0);
        rems.push({ user_id: userId, event_id: ev.id, title: `Tomorrow: ${form.title}`, remind_at: at.toISOString(), is_sent: false });
      }
      if (rems.length) await supabase.from('reminders').insert(rems);
      onCreated?.(ev); onClose?.();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel" style={{ maxWidth: '500px', width: '90%' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--j-border)' }}>
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>ADD EVENT</h2>
          <button onClick={onClose} style={{ color: 'var(--j-muted)' }}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="label-xs block mb-1">TITLE *</label>
            <input className="hud-input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-xs block mb-1">DATE *</label>
              <input type="date" className="hud-input" value={form.event_date} onChange={e => set('event_date', e.target.value)} /></div>
            <div><label className="label-xs block mb-1">TIME</label>
              <input type="time" className="hud-input" value={form.event_time} onChange={e => set('event_time', e.target.value)} /></div>
          </div>
          <div><label className="label-xs block mb-1">VENUE</label>
            <input className="hud-input" value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="Venue name" /></div>
          <div><label className="label-xs block mb-1">ADDRESS (for maps)</label>
            <input className="hud-input" value={form.location_address} onChange={e => set('location_address', e.target.value)} placeholder="Full street address" /></div>
          <div><label className="label-xs block mb-1">TYPE</label>
            <select className="hud-input" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {['general','meeting','birthday','wedding','anniversary','party','conference','concert','other'].map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select></div>
          <div>
            <label className="label-xs block mb-2">REMINDERS</label>
            {[{ key: 'reminder_1week', label: '1 WEEK BEFORE' }, { key: 'reminder_1day', label: '1 DAY BEFORE' }].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 mb-2 cursor-pointer">
                <div className={`hud-toggle ${form[key] ? 'on' : ''}`} onClick={() => set(key, !form[key])} />
                <span className="font-display text-[9px] tracking-widest" style={{ color: form[key] ? 'var(--j-cyan)' : 'var(--j-muted)' }}>{label}</span>
              </label>
            ))}
          </div>
          {error && <p className="font-mono-data text-[11px]" style={{ color: 'var(--j-red)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="hud-btn green flex-1"><span>{loading ? 'SAVING...' : 'SAVE'}</span></button>
            <button onClick={onClose} className="hud-btn" style={{ borderColor: 'var(--j-muted)', color: 'var(--j-muted)' }}><span>CANCEL</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EVENTS PAGE ───────────────────────────────────────────────
export default function EventsPage() {
  const { user } = useAuth();
  const { events, loading } = useEvents(user?.id);
  const { reminders } = useReminders(user?.id);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleMonthChange = (delta) => {
    const d = new Date(calYear, calMonth + delta);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  // All event dates as Set<string>
  const eventDates = useMemo(() => {
    const s = new Set();
    events.forEach((e) => s.add(e.event_date?.slice(0, 10)));
    return s;
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    let list = events;

    if (selectedDate) list = list.filter(e => e.event_date?.startsWith(selectedDate));

    switch (filter) {
      case 'UPCOMING': return list.filter(e => new Date(e.event_date) >= now);
      case 'PAST':     return list.filter(e => new Date(e.event_date) < now);
      case 'PHOTO':    return list.filter(e => e.source === 'photo');
      default:         return list;
    }
  }, [events, filter, selectedDate]);

  const linkedReminders = selectedEvent
    ? reminders.filter((r) => r.event_id === selectedEvent.id)
    : [];

  const FILTERS = ['ALL', 'UPCOMING', 'PAST', 'PHOTO'];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 boot-0 flex items-center justify-between">
        <div>
          <p className="label-xs mb-1">SCHEDULE</p>
          <h1 className="font-display text-2xl tracking-widest" style={{ color: 'var(--j-text)', letterSpacing: '4px' }}>
            EVENTS
          </h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="hud-btn flex items-center gap-2">
          <PlusCircle size={13} />
          <span>ADD EVENT</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <HudCalendar
            year={calYear}
            month={calMonth}
            eventDates={eventDates}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Event list */}
        <div className="lg:col-span-2">
          {/* Filter bar */}
          <div className="flex gap-2 mb-4 flex-wrap boot-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="hud-btn sm"
                style={filter === f ? {
                  borderColor: 'var(--j-cyan)',
                  color: 'var(--j-cyan)',
                  background: 'rgba(0,255,255,0.08)',
                } : {}}
              >
                <span>{f}</span>
              </button>
            ))}
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="hud-btn sm flex items-center gap-1"
                style={{ borderColor: 'var(--j-amber)', color: 'var(--j-amber)' }}
              >
                <X size={10} />
                <span>{selectedDate}</span>
              </button>
            )}
          </div>

          <HudCard className="boot-3">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex gap-2 justify-center">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-mono-data text-xs" style={{ color: 'var(--j-muted)' }}>No events found.</p>
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  onClick={(e) => setSelectedEvent(e)}
                />
              ))
            )}
          </HudCard>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          reminders={linkedReminders}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      {showAdd && (
        <AddEventModal
          userId={user?.id}
          onClose={() => setShowAdd(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
