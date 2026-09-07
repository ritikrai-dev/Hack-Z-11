-- ==========================================================
-- CampusPulse Supabase Seed Data
-- Paste into Supabase Dashboard SQL Editor to populate initial campus data
-- ==========================================================

-- 1. Departments
INSERT INTO public.departments (id, name, code)
VALUES
  ('dept_cs', 'Computer Science and Engineering', 'CSE'),
  ('dept_ece', 'Electronics and Communication Engineering', 'ECE'),
  ('dept_mech', 'Mechanical Engineering', 'MECH')
ON CONFLICT (id) DO NOTHING;

-- 2. Chartered Clubs
INSERT INTO public.clubs (id, name, code, description, category)
VALUES
  ('club_coding', 'Coding Club', 'CODE', 'Competitive programming, open source hackathons, web development', 'Technical'),
  ('club_robotics', 'Robotics Guild', 'ROBO', 'Hardware design, autonomous rovers, IoT drones', 'Technical'),
  ('club_design', 'Design Collective', 'DSGN', 'UI/UX prototyping, visual branding, creative arts', 'Creative')
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Users (All 4 roles)
INSERT INTO public.users (id, student_id, name, email, password_hash, role, department_id, academic_year, division, phone, assigned_club_id, must_change_password, is_active)
VALUES
  ('usr_admin_01', 'ADM001', 'CampusPulse Administrator', 'admin@campuspulse.edu', 'admin123', 'ADMIN', 'Administration', 'Staff', 'HQ', '+91 99999 00001', NULL, false, true),
  ('usr_stud_01', '2023CS042', 'Ritik Sharma', 'ritik.sharma@student.campuspulse.edu', 'student123', 'STUDENT', 'dept_cs', '3rd', 'A', '+91 98765 43210', NULL, false, true),
  ('usr_stud_02', '2024CS099', 'Aarav Patel', 'aarav.patel@student.campuspulse.edu', 'tempPass123!', 'STUDENT', 'dept_cs', '1st', 'B', '+91 98111 22233', NULL, true, true),
  ('usr_tech_01', 'TCH101', 'Dr. Arvind Rao', 'arvind.rao@faculty.campuspulse.edu', 'teacher123', 'TEACHER', 'dept_cs', 'Faculty', 'CS', '+91 98222 33344', NULL, false, true),
  ('usr_club_01', 'CLB201', 'Karan Johal', 'karan.johal@clubs.campuspulse.edu', 'club123', 'CLUB_LEADER', 'dept_cs', '3rd', 'A', '+91 98333 44455', 'club_coding', false, true)
ON CONFLICT (student_id) DO NOTHING;

-- 4. Initial Events
INSERT INTO public.events (id, title, description, category, venue, event_date, capacity, rsvps_count, is_boosted, views_count, live_checkins, organizer_name, organizer_id)
VALUES
  ('evt_01', 'Edge AI & Robotics Hands-on Lab', 'Build on-device vision models using edge accelerators and ROS2.', 'Workshop', 'Robotics Lab 3B', 'Tomorrow, 4:00 PM', 60, 48, true, 840, 38, 'Robotics Guild', 'usr_club_01'),
  ('evt_02', 'Modern Web Architecture Summit', 'Scalable microfrontends, serverless backends, and edge databases.', 'Seminar', 'Main Auditorium', 'Friday, 2:00 PM', 150, 112, false, 490, 0, 'Coding Club', 'usr_club_01'),
  ('evt_03', 'UI/UX Design Sprint & Critique', 'Figma design systems, auto-layout mastery, and portfolio critiques.', 'Design', 'Design Studio 1', 'Next Monday, 11:00 AM', 45, 42, false, 320, 0, 'Design Collective', 'usr_admin_01')
ON CONFLICT (id) DO NOTHING;
