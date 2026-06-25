import { supabase } from './supabase';

/**
 * Check for due reminders and fire browser notifications.
 * Called on app load and periodically.
 * @param {string} userId - The authenticated user's ID
 */
export async function checkAndFireReminders(userId) {
  if (!userId) return [];

  try {
    // Query reminders that are due and not yet sent
    const { data: dueReminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        events (
          title,
          location_name,
          event_time,
          event_date
        )
      `)
      .eq('user_id', userId)
      .eq('is_sent', false)
      .lte('remind_at', new Date().toISOString())
      .order('remind_at', { ascending: true });

    if (error) throw error;
    if (!dueReminders?.length) return [];

    const fired = [];

    for (const reminder of dueReminders) {
      // Fire browser notification
      if (Notification.permission === 'granted') {
        const event = reminder.events;
        new Notification(reminder.title, {
          body: event
            ? `📍 ${event.location_name || 'No location'} · ${event.event_time || ''}`
            : 'JARVIS Reminder',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `reminder-${reminder.id}`,
          data: {
            event_id: reminder.event_id,
            route: reminder.event_id ? `/events` : '/',
          },
        });
      }

      // Mark as sent
      await supabase
        .from('reminders')
        .update({ is_sent: true })
        .eq('id', reminder.id);

      fired.push(reminder);
    }

    return fired;
  } catch (e) {
    console.warn('[JARVIS Reminder Engine] Error:', e);
    return [];
  }
}

/**
 * Schedule a periodic reminder check (every 5 minutes).
 * @param {string} userId
 * @returns {Function} cleanup function
 */
export function startReminderEngine(userId) {
  // Request notification permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Immediate check on start
  checkAndFireReminders(userId);

  // Check every 5 minutes
  const interval = setInterval(() => {
    checkAndFireReminders(userId);
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}

/**
 * Snooze a reminder by 1 hour.
 * @param {string} reminderId
 */
export async function snoozeReminder(reminderId) {
  const snoozeTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('reminders')
    .update({ remind_at: snoozeTime, is_sent: false })
    .eq('id', reminderId);

  if (error) throw error;
}

/**
 * Dismiss a reminder permanently.
 * @param {string} reminderId
 */
export async function dismissReminder(reminderId) {
  const { error } = await supabase
    .from('reminders')
    .update({ is_sent: true })
    .eq('id', reminderId);

  if (error) throw error;
}

/**
 * Create reminders from auto_reminders array returned by Gemini.
 * @param {string} userId
 * @param {string} eventId
 * @param {string} eventDate - ISO date string
 * @param {Array} autoReminders - from Gemini extraction
 */
export async function createAutoReminders(userId, eventId, eventDate, autoReminders = []) {
  if (!autoReminders?.length) return;

  const eventDateObj = new Date(eventDate);
  const remindersToInsert = [];

  for (const ar of autoReminders) {
    const advanceDays = ar.advance_days ?? 7;
    const remindAt = new Date(eventDateObj);
    remindAt.setDate(remindAt.getDate() - advanceDays);
    remindAt.setHours(9, 0, 0, 0); // 9 AM

    remindersToInsert.push({
      user_id: userId,
      event_id: eventId,
      title: ar.title,
      remind_at: remindAt.toISOString(),
      is_recurring: ar.recurrence && ar.recurrence !== 'NONE',
      recurrence_rule: ar.recurrence !== 'NONE' ? ar.recurrence : null,
      is_sent: false,
    });
  }

  if (remindersToInsert.length) {
    const { error } = await supabase.from('reminders').insert(remindersToInsert);
    if (error) console.warn('[JARVIS] Failed to insert auto-reminders:', error);
  }
}
