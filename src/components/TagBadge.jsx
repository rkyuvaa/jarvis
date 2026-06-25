import React from 'react';

/**
 * TagBadge — source type badge: PHOTO | MANUAL | AUTO
 */
export default function TagBadge({ source, className = '' }) {
  const config = {
    photo:  { label: 'PHOTO',  cls: 'tag-photo' },
    manual: { label: 'MANUAL', cls: 'tag-manual' },
    auto:   { label: 'AUTO',   cls: 'tag-auto' },
  };

  const { label, cls } = config[source?.toLowerCase()] || config.manual;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[9px] tracking-widest uppercase font-display rounded-sm ${cls} ${className}`}
    >
      {label}
    </span>
  );
}
