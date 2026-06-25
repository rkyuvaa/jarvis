import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cpu, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate('/dashboard', { replace: true });
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('Account created. Check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="hud-grid-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--j-bg)' }}
    >
      {/* Scanline */}
      <div className="scanline-overlay" />

      {/* Background glow orbs */}
      <div
        style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,216,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Corner decorations */}
      <div style={{ position: 'fixed', top: 20, left: 20, opacity: 0.2 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M0 60 L0 10 Q0 0 10 0 L60 0" stroke="#00ffff" strokeWidth="1" fill="none" />
          <path d="M0 60 L0 20 Q0 5 15 5 L60 5" stroke="#00ffff" strokeWidth="0.5" fill="none" />
        </svg>
      </div>
      <div style={{ position: 'fixed', top: 20, right: 20, opacity: 0.2, transform: 'scaleX(-1)' }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M0 60 L0 10 Q0 0 10 0 L60 0" stroke="#00ffff" strokeWidth="1" fill="none" />
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 20, left: 20, opacity: 0.2, transform: 'scaleY(-1)' }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M0 60 L0 10 Q0 0 10 0 L60 0" stroke="#00ffff" strokeWidth="1" fill="none" />
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 20, right: 20, opacity: 0.2, transform: 'scale(-1)' }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path d="M0 60 L0 10 Q0 0 10 0 L60 0" stroke="#00ffff" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* Login card */}
      <div
        className="hud-card boot-0 w-full"
        style={{ maxWidth: '400px', position: 'relative' }}
      >
        {/* Header */}
        <div
          className="p-8 text-center"
          style={{ borderBottom: '1px solid var(--j-border)' }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Cpu size={28} style={{ color: 'var(--j-cyan)' }} />
            <h1
              className="font-display text-4xl tracking-widest hud-flicker"
              style={{ color: 'var(--j-cyan)', letterSpacing: '8px', fontWeight: 800 }}
            >
              JARVIS
            </h1>
          </div>
          <p className="font-mono-data text-[10px] tracking-widest" style={{ color: 'var(--j-muted)' }}>
            PERSONAL LIFE ASSISTANT v2.0
          </p>

          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="status-dot" />
            <div className="status-dot amber" style={{ animationDelay: '0.4s' }} />
            <div className="status-dot cyan" style={{ animationDelay: '0.8s' }} />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="label-xs block mb-2">
              {mode === 'login' ? 'IDENTITY' : 'NEW IDENTITY'}
            </label>
            <input
              type="email"
              className="hud-input"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label-xs block mb-2">ACCESS CODE</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="hud-input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--j-muted)' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 border"
              style={{ borderColor: 'var(--j-red)', background: 'rgba(255,56,96,0.08)' }}
            >
              <AlertCircle size={14} style={{ color: 'var(--j-red)', flexShrink: 0, marginTop: 1 }} />
              <span className="font-mono-data text-[11px]" style={{ color: 'var(--j-red)' }}>{error}</span>
            </div>
          )}
          {success && (
            <div
              className="flex items-start gap-2 p-3 border"
              style={{ borderColor: 'var(--j-green)', background: 'rgba(57,211,83,0.08)' }}
            >
              <span className="font-mono-data text-[11px]" style={{ color: 'var(--j-green)' }}>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="hud-btn cyan lg w-full flex items-center justify-center gap-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </>
            ) : (
              <span>{mode === 'login' ? 'ENGAGE' : 'CREATE ACCOUNT'}</span>
            )}
          </button>

          {/* Mode toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="font-mono-data text-[10px] transition-colors"
              style={{ color: 'var(--j-muted)' }}
            >
              {mode === 'login'
                ? 'New user? → Create account'
                : '← Back to login'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          className="px-8 pb-6 text-center"
          style={{ borderTop: '1px solid var(--j-border)' }}
        >
          <p className="font-mono-data text-[8px] pt-4" style={{ color: 'var(--j-muted)', letterSpacing: '3px' }}>
            SECURED · ENCRYPTED · PERSONAL
          </p>
        </div>
      </div>
    </div>
  );
}
