-- ==========================================================
-- CampusPulse Supabase PostgreSQL Schema
-- Run this in your Supabase Dashboard SQL Editor
-- (Project: https://mxdyulpunsogjfsaflao.supabase.co)
-- ==========================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chartered Clubs Table
CREATE TABLE IF NOT EXISTS public.clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Technical',
  faculty_advisor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table (Role-Based: STUDENT, TEACHER, CLUB_LEADER, ADMIN)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'CLUB_LEADER', 'ADMIN')),
  department_id TEXT,
  academic_year TEXT,
  division TEXT DEFAULT 'A',
  phone TEXT,
  assigned_club_id TEXT,
  must_change_password BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Workshop',
  venue TEXT DEFAULT 'Campus Auditorium',
  event_date TEXT,
  capacity INT DEFAULT 100,
  rsvps_count INT DEFAULT 0,
  is_boosted BOOLEAN DEFAULT false,
  views_count INT DEFAULT 0,
  live_checkins INT DEFAULT 0,
  organizer_name TEXT,
  organizer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event Registrations Table (Digital QR Tickets)
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  user_id TEXT,
  student_id TEXT NOT NULL,
  ticket_id TEXT UNIQUE NOT NULL,
  qr_token TEXT NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Event Daily Metrics Table (Organizer Telemetry & Sparklines)
CREATE TABLE IF NOT EXISTS public.event_daily_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  registrations_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  checkins_count INT DEFAULT 0
);

-- Indices for fast query retrieval
CREATE INDEX IF NOT EXISTS idx_users_student_id ON public.users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_ticket ON public.event_registrations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_student ON public.event_registrations(student_id);

-- Enable RLS and grant service-role bypass
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read & service role full access
CREATE POLICY "Allow public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow service role all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service role all events" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow service role all registrations" ON public.event_registrations FOR ALL USING (true);
CREATE POLICY "Allow service role all metrics" ON public.event_daily_metrics FOR ALL USING (true);
