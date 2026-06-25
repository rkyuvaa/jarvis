# JARVIS — Personal Life Assistant

A futuristic AI-powered personal assistant PWA with a HUD-style interface.

## Features

- 🤖 **JARVIS AI Chat** — Gemini 2.0 Flash with full schedule context
- 📸 **Photo Scan** — Drop an invite photo, AI extracts all event data
- 📅 **Events** — Calendar view + detail modal with Google Maps embed
- 🔔 **Reminders** — Browser notifications + Firebase push (FCM)
- 🗺️ **Map View** — All geocoded events on a dark-themed Google Map
- 🔐 **Auth** — Supabase email + password, Row Level Security
- 📱 **PWA** — Installable on mobile and desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 + Custom HUD CSS |
| Database | Supabase (PostgreSQL + Storage + Auth) |
| AI | Google Gemini 2.0 Flash |
| Maps | Google Maps JavaScript API |
| Push | Firebase Cloud Messaging |
| Icons | Lucide React |
| Fonts | Orbitron + Share Tech Mono |

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/rkyuvaa/jarvis.git
cd jarvis
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your API keys in .env
```

### 3. Set up Supabase

Run the SQL schema in your [Supabase SQL Editor](https://supabase.com/dashboard):

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_time TEXT,
  location_name TEXT,
  location_address TEXT,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  event_type TEXT DEFAULT 'general',
  source TEXT DEFAULT 'manual',
  source_image_url TEXT,
  raw_extraction JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  is_sent BOOLEAN DEFAULT FALSE,
  fcm_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photo_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  gemini_response JSONB,
  linked_event_id UUID REFERENCES events(id),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_events" ON events USING (auth.uid() = user_id);
CREATE POLICY "users_own_reminders" ON reminders USING (auth.uid() = user_id);
CREATE POLICY "users_own_scans" ON photo_scans USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('jarvis-uploads', 'jarvis-uploads', false);
```

### 4. Run locally

```bash
npm run dev
# http://localhost:5173
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add all env vars from `.env.example` in project settings
4. Deploy

## Project Structure

```
src/
├── lib/           # supabase, gemini, maps, fcm, reminderEngine
├── hooks/         # useAuth, useEvents, useReminders
├── components/    # Layout, Sidebar, HudCard, PhotoUploader, MapEmbed...
└── pages/         # Login, Dashboard, Events, Reminders, Chat, Map, Scan
```

## License

MIT
