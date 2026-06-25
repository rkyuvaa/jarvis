import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for events CRUD with real-time updates.
 */
export function useEvents(userId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (error) setError(error.message);
    else setEvents(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const sub = supabase
      .channel('events-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `user_id=eq.${userId}`,
      }, () => fetchEvents())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId, fetchEvents]);

  const createEvent = useCallback(async (eventData) => {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...eventData, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [userId]);

  const updateEvent = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  /** Get events within next N days */
  const getUpcoming = useCallback((days = 30) => {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d >= now && d <= future;
    });
  }, [events]);

  /** Get events for a specific month */
  const getForMonth = useCallback((year, month) => {
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [events]);

  /** Stats for dashboard */
  const getThisWeekCount = useCallback(() => {
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d >= now && d <= weekEnd;
    }).length;
  }, [events]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getUpcoming,
    getForMonth,
    getThisWeekCount,
  };
}
