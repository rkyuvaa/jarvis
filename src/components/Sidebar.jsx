import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Bell,
  MessageSquare,
  Map,
  ScanLine,
  Power,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'DASHBOARD', icon: LayoutDashboard },
  { to: '/events',     label: 'EVENTS',    icon: CalendarDays },
  { to: '/reminders',  label: 'REMINDERS', icon: Bell },
  { to: '/chat',       label: 'JARVIS AI', icon: MessageSquare },
  { to: '/map',        label: 'MAP VIEW',  icon: Map },
  { to: '/scan',       label: 'SCAN PHOTO', icon: ScanLine },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);
  const dateStr = now.toLocaleDateString('default', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <aside
      style={{
        width: '200px',
        minWidth: '200px',
        background: 'var(--j-panel)',
        borderRight: '1px solid var(--j-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--j-border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--j-cyan), transparent)',
        }} />

        <div className="flex items-center gap-2 mb-1">
          <Cpu size={18} style={{ color: 'var(--j-cyan)' }} />
          <span
            className="font-display text-xl tracking-widest"
            style={{ color: 'var(--j-cyan)', letterSpacing: '6px', fontWeight: 700 }}
          >
            JARVIS
          </span>
        </div>
        <p className="font-mono-data text-[9px] tracking-widest" style={{ color: 'var(--j-muted)' }}>
          PERSONAL ASSISTANT
        </p>

        {/* Status indicators */}
        <div className="flex items-center gap-2 mt-3">
          <div className="status-dot" />
          <div className="status-dot amber" style={{ animationDelay: '0.3s' }} />
          <div className="status-dot cyan" style={{ animationDelay: '0.6s' }} />
          <span className="font-mono-data text-[8px] ml-1" style={{ color: 'var(--j-green)' }}>ONLINE</span>
        </div>
      </div>

      {/* Clock */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--j-border)' }}>
        <div className="font-mono-data text-lg" style={{ color: 'var(--j-text)', letterSpacing: '2px' }}>
          {timeStr}
        </div>
        <div className="font-mono-data text-[9px]" style={{ color: 'var(--j-muted)' }}>
          {dateStr}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--j-border)' }}>
        {user && (
          <p className="font-mono-data text-[9px] truncate mb-2" style={{ color: 'var(--j-muted)' }}>
            {user.email}
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="nav-item w-full flex items-center gap-2"
          style={{ color: 'var(--j-red)', borderColor: 'transparent', padding: '6px 0' }}
        >
          <Power size={12} />
          <span className="font-display text-[9px] tracking-widest uppercase">DISCONNECT</span>
        </button>
      </div>
    </aside>
  );
}
