import React from 'react';
import { Bell, Clock, AlarmClock, CheckCircle } from 'lucide-react';
import { snoozeReminder, dismissReminder } from '../lib/reminderEngine';

/**
 * ReminderItem — a single reminder row
 */
export default function ReminderItem({ reminder, onAction }) {
  const remindAt = new Date(reminder.remind_at);
  const isPast = remindAt < new Date();
  const isSent = reminder.is_sent;

  const timeStr = remindAt.toLocaleString('default', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSnooze = async (e) => {
    e.stopPropagation();
    try {
      await snoozeReminder(reminder.id);
      onAction?.('snoozed', reminder.id);
    } catch (err) {
      console.error('Snooze failed:', err);
    }
  };

  const handleDismiss = async (e) => {
    e.stopPropagation();
    try {
      await dismissReminder(reminder.id);
      onAction?.('dismissed', reminder.id);
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
  };

  const statusColor = isSent
    ? 'var(--j-muted)'
    : isPast
    ? 'var(--j-amber)'
    : 'var(--j-cyan)';

  return (
    <div
      className="hud-card p-4 flex items-start gap-3 boot-1"
      style={{ opacity: isSent ? 0.5 : 1 }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isSent ? (
          <CheckCircle size={16} style={{ color: 'var(--j-green)' }} />
        ) : isPast ? (
          <AlarmClock size={16} style={{ color: 'var(--j-amber)' }} />
        ) : (
          <Bell size={16} style={{ color: 'var(--j-cyan)' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-display tracking-wider" style={{ color: 'var(--j-text)', letterSpacing: '1px' }}>
          {reminder.title}
        </div>
        {reminder.events && (
          <div className="text-[10px] font-mono-data mt-0.5 truncate" style={{ color: 'var(--j-muted)' }}>
            ↳ {reminder.events.title}
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Clock size={10} style={{ color: statusColor }} />
          <span className="text-[10px] font-mono-data" style={{ color: statusColor }}>
            {timeStr}
          </span>
          {reminder.is_recurring && (
            <span className="text-[8px] tracking-widest uppercase font-display px-1.5 py-0.5 ml-1"
              style={{ background: 'rgba(0,180,216,0.1)', border: '1px solid rgba(0,180,216,0.3)', color: 'var(--j-blue)' }}>
              {reminder.recurrence_rule || 'RECURRING'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isSent && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={handleSnooze}
            className="hud-btn sm amber"
          >
            <span>+1HR</span>
          </button>
          <button
            onClick={handleDismiss}
            className="hud-btn sm"
            style={{ borderColor: 'var(--j-muted)', color: 'var(--j-muted)' }}
          >
            <span>✕</span>
          </button>
        </div>
      )}
    </div>
  );
}
