import React from 'react';
import { useAuth } from '../hooks/useAuth';
import PhotoUploader from '../components/PhotoUploader';
import HudCard from '../components/HudCard';
import { ScanLine, Cpu, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ScanPhotoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEventCreated = (event) => {
    // Navigate to events after a short delay
    setTimeout(() => navigate('/events'), 2500);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 boot-0">
        <p className="label-xs mb-1">VISION SYSTEM</p>
        <h1 className="font-display text-2xl tracking-widest" style={{ color: 'var(--j-text)', letterSpacing: '4px' }}>
          SCAN PHOTO
        </h1>
        <div className="hud-divider mt-3 mb-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main uploader */}
        <div className="lg:col-span-2 boot-1">
          <HudCard>
            <PhotoUploader
              userId={user?.id}
              onEventCreated={handleEventCreated}
            />
          </HudCard>
        </div>

        {/* Info panel */}
        <div className="space-y-4 boot-2">
          <HudCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={16} style={{ color: 'var(--j-cyan)' }} />
              <span className="label-sm" style={{ color: 'var(--j-cyan)' }}>GEMINI AI</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: ScanLine, label: 'EVENT DETECTION', desc: 'Extracts dates, times, venues, and hosts' },
                { icon: Image,    label: 'MULTI-FORMAT',    desc: 'JPG, PNG, WEBP — invitations, flyers, cards' },
                { icon: Cpu,      label: 'AUTO REMINDERS',  desc: 'Yearly anniversaries and birthdays auto-created' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={13} style={{ color: 'var(--j-blue)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="font-display text-[9px] tracking-widest" style={{ color: 'var(--j-text)' }}>{label}</p>
                    <p className="font-mono-data text-[9px] mt-0.5" style={{ color: 'var(--j-muted)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </HudCard>

          <HudCard className="p-5">
            <p className="label-xs mb-3">HOW IT WORKS</p>
            <ol className="space-y-2">
              {[
                'Upload a photo of an invitation or flyer',
                'Gemini AI extracts all event data',
                'Review and edit extracted information',
                'Event is saved with automatic reminders',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono-data text-xs flex-shrink-0" style={{ color: 'var(--j-cyan)' }}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span className="font-mono-data text-[10px]" style={{ color: 'var(--j-muted)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </HudCard>
        </div>
      </div>
    </div>
  );
}
