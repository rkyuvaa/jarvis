import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Bell, ScanLine, PlusCircle,
  MessageSquare, Zap, ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { useReminders } from '../hooks/useReminders';
import { supabase } from '../lib/supabase';
import HudCard from '../components/HudCard';
import EventRow from '../components/EventRow';
import PhotoUploader from '../components/PhotoUploader';

// ── ADD EVENT MODAL ───────────────────────────────────────────
function AddEventModal({ userId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', event_date: '', event_time: '', location_name: '',
    description: '', event_type: 'general',
    reminder_1day: true, reminder_1week: false, reminder_daytime: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.event_date) {
      setError('Title and date are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const eventDate = new Date(form.event_date).toISOString();
      const { data: event, error: err } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: form.title,
          event_date: eventDate,
          event_time: form.event_time || null,
          location_name: form.location_name || null,
          description: form.description || null,
          event_type: form.event_type,
          source: 'manual',
        })
        .select()
        .single();
      if (err) throw err;

      // Create selected reminders
      const remindersToInsert = [];
      const base = new Date(form.event_date);

      if (form.reminder_1week) {
        const at = new Date(base); at.setDate(at.getDate() - 7); at.setHours(9, 0, 0, 0);
        remindersToInsert.push({ user_id: userId, event_id: event.id, title: `1 week before: ${form.title}`, remind_at: at.toISOString(), is_sent: false });
      }
      if (form.reminder_1day) {
        const at = new Date(base); at.setDate(at.getDate() - 1); at.setHours(9, 0, 0, 0);
        remindersToInsert.push({ user_id: userId, event_id: event.id, title: `Tomorrow: ${form.title}`, remind_at: at.toISOString(), is_sent: false });
      }
      if (form.reminder_daytime) {
        const at = new Date(base); at.setHours(8, 0, 0, 0);
        remindersToInsert.push({ user_id: userId, event_id: event.id, title: `Today: ${form.title}`, remind_at: at.toISOString(), is_sent: false });
      }
      if (remindersToInsert.length) {
        await supabase.from('reminders').insert(remindersToInsert);
      }

      onCreated?.(event);
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel w-full" style={{ maxWidth: '500px' }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--j-border)' }}>
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: 'var(--j-cyan)' }}>ADD EVENT</h2>
          <button onClick={onClose} className="font-mono-data text-lg" style={{ color: 'var(--j-muted)' }}>×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label-xs block mb-1">EVENT TITLE *</label>
            <input className="hud-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs block mb-1">DATE *</label>
              <input type="date" className="hud-input" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
            <div>
              <label className="label-xs block mb-1">TIME</label>
              <input type="time" className="hud-input" value={form.event_time} onChange={e => set('event_time', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label-xs block mb-1">LOCATION</label>
            <input className="hud-input" value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="Venue or location" />
          </div>
          <div>
            <label className="label-xs block mb-1">EVENT TYPE</label>
            <select className="hud-input" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
              {['general','meeting','birthday','wedding','anniversary','party','conference','concert','other'].map(t => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-xs block mb-1">DESCRIPTION</label>
            <textarea className="hud-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Notes..." style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label-xs block mb-2">AUTO REMINDERS</label>
            {[
              { key: 'reminder_1week', label: '1 WEEK BEFORE' },
              { key: 'reminder_1day',  label: '1 DAY BEFORE' },
              { key: 'reminder_daytime', label: 'DAY OF (8 AM)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 mb-2 cursor-pointer">
                <div
                  className={`hud-toggle ${form[key] ? 'on' : ''}`}
                  onClick={() => set(key, !form[key])}
                />
                <span className="font-display text-[9px] tracking-widest" style={{ color: form[key] ? 'var(--j-cyan)' : 'var(--j-muted)' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p className="font-mono-data text-[11px]" style={{ color: 'var(--j-red)' }}>{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="hud-btn green flex-1">
              <span>{loading ? 'SAVING...' : 'SAVE EVENT'}</span>
            </button>
            <button onClick={onClose} className="hud-btn" style={{ borderColor: 'var(--j-muted)', color: 'var(--j-muted)' }}>
              <span>CANCEL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD PAGE ────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { events, getThisWeekCount, getUpcoming } = useEvents(user?.id);
  const { activeCount } = useReminders(user?.id);
  const navigate = useNavigate();

  const [showScan, setShowScan] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [photoScansCount, setPhotoScansCount] = useState('—');

  // Fetch photo scan count
  React.useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('photo_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => {
        if (count !== null) setPhotoScansCount(count);
      });
  }, [user?.id]);

  const upcomingEvents = getUpcoming(30).slice(0, 5);
  const weekCount = getThisWeekCount();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING';
    if (h < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 boot-0">
        <p className="label-xs mb-1">{greeting()}, {user?.email?.split('@')[0].toUpperCase()}</p>
        <h1
          className="font-display text-2xl tracking-widest"
          style={{ color: 'var(--j-text)', letterSpacing: '4px' }}
        >
          COMMAND CENTER
        </h1>
        <div className="hud-divider mt-3 mb-0" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <HudCard
          label="EVENTS THIS WEEK"
          value={weekCount}
          icon={CalendarDays}
          valueColor="var(--j-cyan)"
          className="boot-1"
          onClick={() => navigate('/events')}
        />
        <HudCard
          label="REMINDERS ACTIVE"
          value={activeCount}
          icon={Bell}
          valueColor="var(--j-amber)"
          className="boot-2"
          onClick={() => navigate('/reminders')}
        />
        <HudCard
          label="PHOTOS SCANNED"
          value={photoScansCount}
          icon={ScanLine}
          valueColor="var(--j-green)"
          className="boot-3"
          onClick={() => navigate('/scan')}
        />
      </div>

      {/* Grid: upcoming events + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming events list */}
        <div className="lg:col-span-2 boot-3">
          <HudCard>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--j-border)' }}
            >
              <span className="label-sm" style={{ color: 'var(--j-blue)' }}>UPCOMING EVENTS</span>
              <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-1 font-display text-[8px] tracking-widest"
                style={{ color: 'var(--j-muted)' }}
              >
                VIEW ALL <ChevronRight size={10} />
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="font-mono-data text-[11px]" style={{ color: 'var(--j-muted)' }}>
                  No upcoming events. Add one or scan a photo.
                </p>
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  compact
                  onClick={() => navigate('/events')}
                />
              ))
            )}
          </HudCard>
        </div>

        {/* Quick actions */}
        <div className="boot-4">
          <HudCard>
            <div
              className="px-4 py-3"
              style={{ borderBottom: '1px solid var(--j-border)' }}
            >
              <span className="label-sm" style={{ color: 'var(--j-blue)' }}>QUICK ACTIONS</span>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => setShowScan(true)}
                className="hud-btn amber w-full flex items-center justify-center gap-2"
              >
                <ScanLine size={14} />
                <span>SCAN PHOTO</span>
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="hud-btn w-full flex items-center justify-center gap-2"
              >
                <PlusCircle size={14} />
                <span>ADD EVENT</span>
              </button>
              <button
                onClick={() => navigate('/chat?q=What%27s+happening+this+week%3F')}
                className="hud-btn cyan w-full flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} />
                <span>WHAT'S THIS WEEK?</span>
              </button>
              <button
                onClick={() => navigate('/map')}
                className="hud-btn green w-full flex items-center justify-center gap-2"
              >
                <Zap size={14} />
                <span>MAP VIEW</span>
              </button>
            </div>
          </HudCard>

          {/* System status */}
          <HudCard className="mt-4">
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--j-border)' }}>
              <span className="label-sm" style={{ color: 'var(--j-blue)' }}>SYSTEM STATUS</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'SUPABASE DB',   status: 'ONLINE',  color: 'var(--j-green)' },
                { label: 'GEMINI AI',     status: import.meta.env.VITE_GEMINI_API_KEY ? 'READY' : 'NO KEY', color: import.meta.env.VITE_GEMINI_API_KEY ? 'var(--j-green)' : 'var(--j-amber)' },
                { label: 'GOOGLE MAPS',   status: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'READY' : 'NO KEY', color: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'var(--j-green)' : 'var(--j-amber)' },
                { label: 'NOTIFICATIONS', status: Notification.permission === 'granted' ? 'ENABLED' : 'DISABLED', color: Notification.permission === 'granted' ? 'var(--j-green)' : 'var(--j-muted)' },
              ].map(({ label, status, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-muted)' }}>{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                    <span className="font-mono-data text-[9px]" style={{ color }}>{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      </div>

      {/* Modals */}
      {showScan && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowScan(false)}>
          <div className="modal-panel" style={{ maxWidth: '560px', width: '90%' }}>
            <PhotoUploader
              userId={user?.id}
              onEventCreated={() => setShowScan(false)}
              onClose={() => setShowScan(false)}
            />
          </div>
        </div>
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
