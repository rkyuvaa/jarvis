import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import { useReminders } from '../hooks/useReminders';
import { chatWithJarvis } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import ChatInput from '../components/ChatInput';
import HudCard from '../components/HudCard';

// ── ACTION EXECUTOR ───────────────────────────────────────────
async function executeAction(actionData, userId) {
  const { type, data } = actionData;
  if (type === 'create_event') {
    const { error } = await supabase.from('events').insert({
      user_id: userId,
      title: data.title,
      event_date: data.event_date ? new Date(data.event_date).toISOString() : new Date().toISOString(),
      event_time: data.event_time || null,
      location_name: data.location_name || null,
      description: data.description || null,
      event_type: data.event_type || 'general',
      source: 'auto',
    });
    if (error) throw error;
    return `Event "${data.title}" created.`;
  }
  if (type === 'create_reminder') {
    const { error } = await supabase.from('reminders').insert({
      user_id: userId,
      event_id: data.event_id || null,
      title: data.title,
      remind_at: data.remind_at ? new Date(data.remind_at).toISOString() : new Date().toISOString(),
      is_sent: false,
    });
    if (error) throw error;
    return `Reminder "${data.title}" created.`;
  }
  return null;
}

// ── MESSAGE BUBBLE ────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  // Parse out <action> tags from jarvis messages
  const parts = [];
  if (!isUser && msg.content) {
    const actionRegex = /<action>([\s\S]*?)<\/action>/g;
    let last = 0;
    let match;
    while ((match = actionRegex.exec(msg.content)) !== null) {
      if (match.index > last) parts.push({ type: 'text', content: msg.content.slice(last, match.index) });
      parts.push({ type: 'action', content: match[1] });
      last = match.index + match[0].length;
    }
    if (last < msg.content.length) parts.push({ type: 'text', content: msg.content.slice(last) });
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div style={{ maxWidth: '75%' }}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <Zap size={11} style={{ color: 'var(--j-cyan)' }} />
            <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-cyan)' }}>
              JARVIS
            </span>
          </div>
        )}
        <div className={`px-4 py-3 ${isUser ? 'chat-bubble-user' : 'chat-bubble-jarvis'}`}>
          {isUser ? (
            <p className="font-mono-data text-xs" style={{ color: 'var(--j-text)', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </p>
          ) : (
            <div>
              {parts.length === 0 ? (
                <p className="font-mono-data text-xs" style={{ color: 'var(--j-text)', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
              ) : (
                parts.map((p, i) =>
                  p.type === 'text' ? (
                    <p key={i} className="font-mono-data text-xs" style={{ color: 'var(--j-text)', whiteSpace: 'pre-wrap' }}>
                      {p.content}
                    </p>
                  ) : (
                    <div
                      key={i}
                      className="flex items-center gap-2 mt-1 px-2 py-1"
                      style={{ background: 'rgba(57,211,83,0.1)', border: '1px solid rgba(57,211,83,0.3)' }}
                    >
                      <CheckCircle size={10} style={{ color: 'var(--j-green)' }} />
                      <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-green)' }}>
                        ACTION EXECUTED
                      </span>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
        <div className="mt-1 text-right">
          <span className="font-mono-data text-[8px]" style={{ color: 'var(--j-muted)' }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── TYPING INDICATOR ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Zap size={11} style={{ color: 'var(--j-cyan)' }} />
      <span className="font-display text-[8px] tracking-widest" style={{ color: 'var(--j-cyan)' }}>JARVIS</span>
      <div className="flex gap-1.5 ml-2">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// ── CHAT PAGE ─────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { getUpcoming } = useEvents(user?.id);
  const { reminders } = useReminders(user?.id);

  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'jarvis',
      content: 'JARVIS online. All systems nominal. How can I assist you today?',
      timestamp: Date.now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Handle query from URL param (e.g., from dashboard "WHAT'S THIS WEEK?")
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSend(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (text) => {
    if (!text?.trim()) return;
    setError(null);

    const userMsg = { id: Date.now() + 'u', role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      // Build history (exclude init message)
      const history = messages.filter(m => m.id !== 'init').map(m => ({
        role: m.role,
        content: m.content,
      }));

      const context = {
        events: getUpcoming(30),
        reminders: reminders.filter(r => !r.is_sent),
      };

      const response = await chatWithJarvis(text, history, context);

      // Check for action tags and execute them
      const actionMatches = [...response.matchAll(/<action>([\s\S]*?)<\/action>/g)];
      for (const match of actionMatches) {
        try {
          const actionData = JSON.parse(match[1]);
          await executeAction(actionData, user?.id);
        } catch (e) {
          console.warn('[JARVIS Chat] Action execution failed:', e);
        }
      }

      const jarvisMsg = {
        id: Date.now() + 'j',
        role: 'jarvis',
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
    } catch (e) {
      setError(e.message || 'Communication error.');
      console.error('[ChatPage]', e);
    } finally {
      setTyping(false);
    }
  };

  const QUICK_PROMPTS = [
    "What's happening this week?",
    "Do I have anything tomorrow?",
    "Add a meeting for next Monday at 10 AM",
    "Show me all my upcoming events",
    "Set a reminder for next Friday",
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="mb-4 boot-0 flex-shrink-0">
        <p className="label-xs mb-1">AI INTERFACE</p>
        <h1 className="font-display text-2xl tracking-widest" style={{ color: 'var(--j-text)', letterSpacing: '4px' }}>
          JARVIS AI
        </h1>
        <div className="hud-divider mt-3 mb-0" />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0 boot-1">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="font-mono-data text-[9px] px-3 py-1.5 transition-colors"
            style={{
              background: 'var(--j-dim)',
              border: '1px solid var(--j-border)',
              color: 'var(--j-muted)',
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--j-blue)'; e.target.style.color = 'var(--j-blue)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--j-border)'; e.target.style.color = 'var(--j-muted)'; }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <HudCard className="flex-1 overflow-y-auto p-4 boot-2" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {typing && <TypingIndicator />}
        {error && (
          <div
            className="flex items-center gap-2 p-3 mb-3 border"
            style={{ borderColor: 'var(--j-red)', background: 'rgba(255,56,96,0.08)' }}
          >
            <AlertCircle size={13} style={{ color: 'var(--j-red)' }} />
            <span className="font-mono-data text-[11px]" style={{ color: 'var(--j-red)' }}>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </HudCard>

      {/* Input */}
      <div className="mt-3 flex-shrink-0 boot-3">
        <ChatInput onSubmit={handleSend} inline placeholder="Message JARVIS..." />
      </div>
    </div>
  );
}
