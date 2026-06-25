import React, { useState } from 'react';
import { Bell, BellOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useReminders } from '../hooks/useReminders';
import { initFCM } from '../lib/fcm';
import ReminderItem from '../components/ReminderItem';
import HudCard from '../components/HudCard';

export default function RemindersPage() {
  const { user } = useAuth();
  const { loading, grouped, refetch, activeCount } = useReminders(user?.id);
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [fcmLoading, setFcmLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

  const handleToggleFCM = async () => {
    if (fcmEnabled) {
      setFcmEnabled(false);
      setFcmToken(null);
      return;
    }
    setFcmLoading(true);
    try {
      const token = await initFCM();
      if (token) {
        setFcmEnabled(true);
        setFcmToken(token);
      }
    } catch (e) {
      console.warn('FCM init failed:', e);
    } finally {
      setFcmLoading(false);
    }
  };

  const groups = grouped();

  const GROUP_SECTIONS = [
    { key: 'today',    label: 'TODAY',     data: groups.today },
    { key: 'thisWeek', label: 'THIS WEEK', data: groups.thisWeek },
    { key: 'later',    label: 'LATER',     data: groups.later },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 boot-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="label-xs mb-1">ALERT SYSTEM</p>
          <h1 className="font-display text-2xl tracking-widest" style={{ color: 'var(--j-text)', letterSpacing: '4px' }}>
            REMINDERS
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={refetch}
            className="hud-btn sm flex items-center gap-1.5"
          >
            <RefreshCw size={11} />
            <span>REFRESH</span>
          </button>
          {/* FCM toggle */}
          <div className="flex items-center gap-2">
            {fcmEnabled
              ? <Bell size={14} style={{ color: 'var(--j-cyan)' }} />
              : <BellOff size={14} style={{ color: 'var(--j-muted)' }} />
            }
            <div
              className={`hud-toggle ${fcmEnabled ? 'on' : ''}`}
              onClick={handleToggleFCM}
            />
            <span className="font-display text-[8px] tracking-widest" style={{ color: fcmEnabled ? 'var(--j-cyan)' : 'var(--j-muted)' }}>
              {fcmLoading ? 'ENABLING...' : fcmEnabled ? 'PUSH ON' : 'PUSH OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6 boot-1">
        <HudCard label="ACTIVE" value={activeCount} valueColor="var(--j-amber)" />
        <HudCard label="DUE TODAY" value={groups.today.filter(r => !r.is_sent).length} valueColor="var(--j-red)" />
        <HudCard label="THIS WEEK" value={groups.thisWeek.filter(r => !r.is_sent).length} valueColor="var(--j-cyan)" />
      </div>

      {/* FCM token info */}
      {fcmToken && (
        <div
          className="mb-4 px-3 py-2 border boot-2 flex items-center gap-2"
          style={{ borderColor: 'rgba(57,211,83,0.3)', background: 'rgba(57,211,83,0.05)' }}
        >
          <div className="status-dot" />
          <span className="font-mono-data text-[9px] truncate" style={{ color: 'var(--j-green)' }}>
            FCM ACTIVE · TOKEN: {fcmToken.slice(0, 30)}...
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex gap-2 justify-center py-12">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_SECTIONS.map(({ key, label, data }) => (
            <div key={key} className="boot-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="label-xs" style={{ color: 'var(--j-muted)' }}>{label}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--j-border)' }} />
                <span className="font-mono-data text-[9px]" style={{ color: 'var(--j-muted)' }}>
                  {data.length} ITEMS
                </span>
              </div>
              {data.length === 0 ? (
                <p className="font-mono-data text-xs px-2" style={{ color: 'var(--j-muted)' }}>
                  — None —
                </p>
              ) : (
                <div className="space-y-2">
                  {data.map((r) => (
                    <ReminderItem
                      key={r.id}
                      reminder={r}
                      onAction={() => refetch()}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
