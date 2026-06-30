-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  event_time   TEXT,
  location_name     TEXT,
  location_address  TEXT,
  latitude     DECIMAL(9,6),
  longitude    DECIMAL(9,6),
  event_type   TEXT DEFAULT 'general',
  source       TEXT DEFAULT 'manual',
  source_image_url  TEXT,
  raw_extraction    JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  remind_at    TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule   TEXT,
  is_sent      BOOLEAN DEFAULT FALSE,
  fcm_message_id    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Photo scans log
CREATE TABLE IF NOT EXISTS photo_scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url    TEXT NOT NULL,
  gemini_response   JSONB,
  linked_event_id   UUID REFERENCES events(id),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' AND policyname = 'users_own_events'
    ) THEN
        CREATE POLICY "users_own_events" ON events
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reminders' AND policyname = 'users_own_reminders'
    ) THEN
        CREATE POLICY "users_own_reminders" ON reminders
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'photo_scans' AND policyname = 'users_own_scans'
    ) THEN
        CREATE POLICY "users_own_scans" ON photo_scans
          USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Note: Storage buckets creation usually requires storage API or manual configuration, 
-- but we can add the insert query here.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jarvis-uploads', 'jarvis-uploads', false)
ON CONFLICT (id) DO NOTHING;
