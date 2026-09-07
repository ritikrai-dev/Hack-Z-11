-- ============================================================================
-- CAMPUSPULSE: FULL END-TO-END SUPABASE POSTGRESQL DATABASE
-- Project: https://mxdyulpunsogjfsaflao.supabase.co
-- Execute this entire script in your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/mxdyulpunsogjfsaflao/sql/new)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-initializing cleanly
DROP TABLE IF EXISTS public.event_daily_metrics CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.schedule_conflicts CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- 1. DEPARTMENTS TABLE
CREATE TABLE public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHARTERED CLUBS TABLE
CREATE TABLE public.clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Technical',
  faculty_advisor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE (Supports STUDENT, TEACHER, CLUB_LEADER, ADMIN)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'CLUB_LEADER', 'ADMIN')),
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  academic_year TEXT,
  division TEXT DEFAULT 'A',
  phone TEXT,
  assigned_club_id TEXT REFERENCES public.clubs(id) ON DELETE SET NULL,
  must_change_password BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENTS TABLE
CREATE TABLE public.events (
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

-- 5. EVENT REGISTRATIONS & DIGITAL QR TICKETS
CREATE TABLE public.event_registrations (
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

-- 6. EVENT DAILY METRICS (7-Day Telemetry & Analytics)
CREATE TABLE public.event_daily_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  registrations_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  checkins_count INT DEFAULT 0
);

-- 7. ACADEMIC SCHEDULES & TIMETABLE
CREATE TABLE public.schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT NOT NULL,
  instructor TEXT,
  department_id TEXT REFERENCES public.departments(id) ON DELETE CASCADE,
  academic_year TEXT DEFAULT '3rd'
);

-- 8. SCHEDULE CONFLICTS
CREATE TABLE public.schedule_conflicts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL,
  course_a TEXT NOT NULL,
  course_b TEXT NOT NULL,
  conflict_date TEXT NOT NULL,
  conflict_time TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolution_choice TEXT
);

-- 9. USER SAVED BOOKMARKS
CREATE TABLE public.bookmarks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'notice' or 'event'
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- ============================================================================
-- INDICES
-- ============================================================================
CREATE INDEX idx_users_student_id ON public.users(student_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_event_reg_ticket ON public.event_registrations(ticket_id);
CREATE INDEX idx_event_reg_student ON public.event_registrations(student_id);
CREATE INDEX idx_schedules_day ON public.schedules(day_of_week);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Allow service role all users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service role all events" ON public.events FOR ALL USING (true);
CREATE POLICY "Allow service role all registrations" ON public.event_registrations FOR ALL USING (true);
CREATE POLICY "Allow service role all metrics" ON public.event_daily_metrics FOR ALL USING (true);
CREATE POLICY "Allow service role all conflicts" ON public.schedule_conflicts FOR ALL USING (true);
CREATE POLICY "Allow service role all bookmarks" ON public.bookmarks FOR ALL USING (true);

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. Departments
INSERT INTO public.departments (id, name, code) VALUES
  ('dept_cs', 'Computer Science and Engineering', 'CSE'),
  ('dept_ece', 'Electronics and Communication Engineering', 'ECE'),
  ('dept_mech', 'Mechanical Engineering', 'MECH'),
  ('dept_it', 'Information Technology', 'IT');

-- 2. Chartered Clubs
INSERT INTO public.clubs (id, name, code, description, category) VALUES
  ('club_coding', 'Coding Club', 'CODE', 'Competitive programming, open source hackathons, web development', 'Technical'),
  ('club_robotics', 'Robotics Guild', 'ROBO', 'Hardware design, autonomous rovers, IoT drones', 'Technical'),
  ('club_design', 'Design Collective', 'DSGN', 'UI/UX prototyping, visual branding, creative arts', 'Creative'),
  ('club_lit', 'Literary Society', 'LIT', 'Debating, creative writing, public speaking', 'Cultural');

-- 3. Users Across All 4 Roles
INSERT INTO public.users (id, student_id, name, email, password_hash, role, department_id, academic_year, division, phone, assigned_club_id, must_change_password, is_active) VALUES
  ('usr_admin_01', 'ADM001', 'CampusPulse Administrator', 'admin@campuspulse.edu', 'admin123', 'ADMIN', 'dept_cs', 'Staff', 'HQ', '+91 99999 00001', NULL, false, true),
  ('usr_stud_01', '2023CS042', 'Ritik Sharma', 'ritik.sharma@student.campuspulse.edu', 'student123', 'STUDENT', 'dept_cs', '3rd', 'A', '+91 98765 43210', NULL, false, true),
  ('usr_stud_02', '2024CS099', 'Aarav Patel', 'aarav.patel@student.campuspulse.edu', 'tempPass123!', 'STUDENT', 'dept_cs', '1st', 'B', '+91 98111 22233', NULL, true, true),
  ('usr_stud_03', '2023EC088', 'Priya Menon', 'priya.menon@student.campuspulse.edu', 'student123', 'STUDENT', 'dept_ece', '3rd', 'B', '+91 98222 11100', NULL, false, true),
  ('usr_tech_01', 'TCH101', 'Dr. Arvind Rao', 'arvind.rao@faculty.campuspulse.edu', 'teacher123', 'TEACHER', 'dept_cs', 'Faculty', 'CS', '+91 98222 33344', NULL, false, true),
  ('usr_tech_02', 'TCH102', 'Prof. Sunita Sharma', 'sunita.sharma@faculty.campuspulse.edu', 'teacher123', 'TEACHER', 'dept_ece', 'Faculty', 'ECE', '+91 98222 55566', NULL, false, true),
  ('usr_club_01', 'CLB201', 'Karan Johal', 'karan.johal@clubs.campuspulse.edu', 'club123', 'CLUB_LEADER', 'dept_cs', '3rd', 'A', '+91 98333 44455', 'club_coding', false, true),
  ('usr_club_02', 'CLB202', 'Siddharth Verma', 'siddharth@clubs.campuspulse.edu', 'club123', 'CLUB_LEADER', 'dept_cs', '3rd', 'B', '+91 98444 55566', 'club_robotics', false, true);

-- 4. Events
INSERT INTO public.events (id, title, description, category, venue, event_date, capacity, rsvps_count, is_boosted, views_count, live_checkins, organizer_name, organizer_id) VALUES
  ('evt_01', 'Edge AI & Robotics Hands-on Lab', 'Build on-device vision models using edge accelerators and ROS2.', 'Workshop', 'Robotics Lab 3B', 'Tomorrow, 4:00 PM', 60, 48, true, 840, 38, 'Robotics Guild', 'usr_club_02'),
  ('evt_02', 'Modern Web Architecture Summit', 'Scalable microfrontends, serverless backends, and edge databases.', 'Seminar', 'Main Auditorium', 'Friday, 2:00 PM', 150, 112, false, 490, 0, 'Coding Club', 'usr_club_01'),
  ('evt_03', 'UI/UX Design Sprint & Critique', 'Figma design systems, auto-layout mastery, and portfolio critiques.', 'Design', 'Design Studio 1', 'Next Monday, 11:00 AM', 45, 42, false, 320, 0, 'Design Collective', 'usr_admin_01'),
  ('evt_04', 'HackSprint 48-Hour Open Hackathon', 'Form 4-member teams and build full-stack solutions for campus automation.', 'Hackathon', 'Innovation Hub', 'Oct 14-16, 2026', 120, 96, true, 1200, 15, 'Coding Club', 'usr_club_01');

-- 5. Timetable Schedules
INSERT INTO public.schedules (id, course_code, course_name, day_of_week, start_time, end_time, room, instructor, department_id, academic_year) VALUES
  ('sch_01', 'CS301', 'Operating Systems', 'Monday', '09:00 AM', '10:30 AM', 'Room 204', 'Dr. Arvind Rao', 'dept_cs', '3rd'),
  ('sch_02', 'CS302', 'Design & Analysis of Algorithms', 'Monday', '11:00 AM', '12:30 PM', 'Room 205', 'Dr. Arvind Rao', 'dept_cs', '3rd'),
  ('sch_03', 'CS303', 'Computer Networks', 'Tuesday', '09:00 AM', '10:30 AM', 'Room 201', 'Prof. Sunita Sharma', 'dept_cs', '3rd'),
  ('sch_04', 'CS304', 'Database Management Systems', 'Wednesday', '02:00 PM', '03:30 PM', 'Lab 3', 'Dr. Arvind Rao', 'dept_cs', '3rd');

-- 6. Schedule Conflicts
INSERT INTO public.schedule_conflicts (id, student_id, course_a, course_b, conflict_date, conflict_time, is_resolved) VALUES
  ('cnf_01', '2023CS042', 'CS302 Algorithm Lab', 'Robotics Workshop Session', 'Thursday', '02:00 PM - 03:30 PM', false);
