import React from 'react';

/**
 * HudCard — reusable stat/panel card with glow top edge and optional arc corners.
 */
export default function HudCard({
  children,
  className = '',
  label,
  value,
  valueColor = 'var(--j-cyan)',
  icon: Icon,
  animate = true,
  style = {},
  onClick,
}) {
  // Simple stat card mode when label+value provided
  if (label !== undefined) {
    return (
      <div
        className={`hud-card p-5 flex flex-col gap-2 ${animate ? 'boot-0' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        onClick={onClick}
      >
        {/* Arc corners */}
        <svg className="hud-arc-corner top-left" viewBox="0 0 40 40" fill="none">
          <path d="M0 40 L0 8 Q0 0 8 0 L40 0" stroke="#00ffff" strokeWidth="1" fill="none" opacity="0.4" />
        </svg>
        <svg className="hud-arc-corner top-right" viewBox="0 0 40 40" fill="none">
          <path d="M0 40 L0 8 Q0 0 8 0 L40 0" stroke="#00ffff" strokeWidth="1" fill="none" opacity="0.4" />
        </svg>

        <div className="flex items-center justify-between">
          <span className="label-xs">{label}</span>
          {Icon && (
            <Icon size={16} style={{ color: valueColor, opacity: 0.6 }} />
          )}
        </div>
        <div
          className="font-mono-data text-4xl font-bold mt-1"
          style={{ color: valueColor }}
        >
          {value ?? '—'}
        </div>
      </div>
    );
  }

  // Generic panel card mode
  return (
    <div
      className={`hud-card ${animate ? 'boot-0' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      <svg className="hud-arc-corner top-left" viewBox="0 0 40 40" fill="none">
        <path d="M0 40 L0 8 Q0 0 8 0 L40 0" stroke="#00ffff" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>
      <svg className="hud-arc-corner top-right" viewBox="0 0 40 40" fill="none">
        <path d="M0 40 L0 8 Q0 0 8 0 L40 0" stroke="#00ffff" strokeWidth="1" fill="none" opacity="0.4" />
      </svg>
      {children}
    </div>
  );
}
