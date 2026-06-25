import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for reminders CRUD.
 */
export function useReminders(userId) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('reminders')
      .select(`*, events(title, event_date, event_time, location_name)`)
      .eq('user_id', userId)
      .order('remind_at', { ascending: true });

    if (error) setError(error.message);
    else setReminders(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Real-time
  useEffect(() => {
    if (!userId) return;
    const sub = supabase
      .channel('reminders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reminders',
        filter: `user_id=eq.${userId}`,
      }, () => fetchReminders())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [userId, fetchReminders]);

  const createReminder = useCallback(async (data) => {
    const { data: created, error } = await supabase
      .from('reminders')
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return created;
  }, [userId]);

  const updateReminder = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const deleteReminder = useCallback(async (id) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
  }, []);

  /** Active (not sent) reminders count */
  const activeCount = reminders.filter((r) => !r.is_sent).length;

  /** Group reminders by time */
  const grouped = useCallback(() => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const today = [];
    const thisWeek = [];
    const later = [];

    reminders.forEach((r) => {
      const at = new Date(r.remind_at);
      if (at <= todayEnd) today.push(r);
      else if (at <= weekEnd) thisWeek.push(r);
      else later.push(r);
    });

    return { today, thisWeek, later };
  }, [reminders]);

  return {
    reminders,
    loading,
    error,
    activeCount,
    grouped,
    refetch: fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}
