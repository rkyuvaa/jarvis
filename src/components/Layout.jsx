import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatInput from './ChatInput';
import { useAuth } from '../hooks/useAuth';
import { startReminderEngine } from '../lib/reminderEngine';

/**
 * Layout — main app shell with sidebar, scanline overlay, main area, and bottom chat bar.
 */
export default function Layout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Start reminder engine on mount
  useEffect(() => {
    if (user?.id) {
      const cleanup = startReminderEngine(user.id);
      return cleanup;
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div
        className="hud-grid-bg flex items-center justify-center"
        style={{ height: '100vh', background: 'var(--j-bg)' }}
      >
        <div className="text-center">
          <div
            className="font-display text-4xl tracking-widest mb-4 hud-flicker"
            style={{ color: 'var(--j-cyan)', letterSpacing: '8px' }}
          >
            JARVIS
          </div>
          <div className="flex gap-2 justify-center">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p className="font-mono-data text-[10px] mt-3" style={{ color: 'var(--j-muted)' }}>
            INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className="hud-grid-bg flex"
      style={{ minHeight: '100vh', background: 'var(--j-bg)' }}
    >
      {/* Global scanline overlay */}
      <div className="scanline-overlay" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
        }}
      >
        {/* Page content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <Outlet />
        </main>

        {/* Always-visible bottom chat bar */}
        <ChatInput />
      </div>
    </div>
  );
}
