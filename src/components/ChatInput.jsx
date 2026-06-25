import React, { useState, useRef } from 'react';
import { Send, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ChatInput — bottom command terminal bar
 */
export default function ChatInput({ onSubmit, placeholder = 'Ask JARVIS anything...', inline = false }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onSubmit) {
      onSubmit(query.trim());
    } else {
      // Navigate to chat page with query
      navigate(`/chat?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (inline) {
    // Inline mode (used inside ChatPage)
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-display tracking-widest"
            style={{ color: 'var(--j-cyan)' }}
          >
            ›
          </span>
          <input
            ref={inputRef}
            className="hud-input pl-7"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="hud-btn cyan flex items-center gap-2"
          disabled={!query.trim()}
        >
          <span>SEND</span>
          <Send size={12} />
        </button>
      </form>
    );
  }

  // Bottom bar mode (used in Layout)
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background: 'var(--j-panel)',
        borderTop: '1px solid var(--j-border)',
        position: 'relative',
      }}
    >
      {/* Glow top edge */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent)',
        }}
      />

      <Zap size={14} style={{ color: 'var(--j-cyan)', flexShrink: 0 }} />

      <div className="flex-1 relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-display tracking-widest"
          style={{ color: 'var(--j-cyan)' }}
        >
          ›_
        </span>
        <input
          ref={inputRef}
          className="hud-input pl-8 text-sm"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className="hud-btn cyan flex items-center gap-2"
        style={{ flexShrink: 0 }}
        disabled={!query.trim()}
      >
        <span>SEND</span>
        <Send size={11} />
      </button>
    </form>
  );
}
