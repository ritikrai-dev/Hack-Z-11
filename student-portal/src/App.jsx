import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Calendar, BookOpen, Sparkles, Search, CheckCircle, AlertTriangle,
  User, LogOut, Key, QrCode, Plus, ChevronRight, Filter, Heart,
  Share2, ArrowRight, X, Clock, MapPin, Users, Award, Bot, Send, Check,
  Upload, FileText, Download, ExternalLink, Globe, Home as HomeIcon,
  GraduationCap, Briefcase, FileCheck, Layers, Eye, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { authStorage, login, changePassword, logout, getMe, portalApi, API_BASE } from './api/client';

export default function App() {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());

  // Application View: 'intro' | 'select_role' | 'student_login' | 'teacher_login'
  const [viewState, setViewState] = useState('intro');
  const [introProgress, setIntroProgress] = useState(0);

  // Login Form States
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forced password update modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Dashboard Tab state
  const [studentNavTab, setStudentNavTab] = useState('home'); // 'home' | 'notices' | 'events' | 'registrations' | 'clubs' | 'stories'
  const [teacherNavTab, setTeacherNavTab] = useState('home'); // 'home' | 'events' | 'notices' | 'registrations' | 'create_event' | 'create_notice'

  // Data states
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [urgentStories, setUrgentStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [organizerStats, setOrganizerStats] = useState(null);
  const [managedEvents, setManagedEvents] = useState([]);
  const [activeNoticeCategory, setActiveNoticeCategory] = useState('All');
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [noticeSmartSort, setNoticeSmartSort] = useState(false);
  const [scheduleConflict, setScheduleConflict] = useState(null);

  // Digital Ticket QR Modal
  const [ticketModalEvent, setTicketModalEvent] = useState(null);

  // Student Registration Modal for INTRA-COLLEGE events (Custom In-House Form)
  const [registeringEvent, setRegisteringEvent] = useState(null);
  const [intraFormAnswers, setIntraFormAnswers] = useState({});
  const [isRegistering, setIsRegistering] = useState(false);

  // Teacher Event Management & Registrations Roster
  const [selectedManagedEvent, setSelectedManagedEvent] = useState(null);
  const [eventRoster, setEventRoster] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // Teacher Create Event State (Intra vs Inter)
  const [eventScope, setEventScope] = useState('INTRA-COLLEGE'); // 'INTRA-COLLEGE' | 'INTER-COLLEGE'
  const [eventFormData, setEventFormData] = useState({
    title: '',
    venue: '',
    date: '',
    time: '3:00 PM - 5:00 PM',
    capacity: 100,
    category: 'Workshop',
    description: '',
    externalRegistrationLink: 'https://unstop.com',
    customFields: ['Student ID / Roll No', 'Department & Semester', 'Prior Knowledge / Project Idea']
  });
  const [newCustomFieldInput, setNewCustomFieldInput] = useState('');
  const [eventFormMsg, setEventFormMsg] = useState('');

  // Notice Creation with Drag-and-Drop File Upload
  const [noticeFormData, setNoticeFormData] = useState({
    title: '',
    category: 'Academic',
    department: '',
    content: '',
    urgency: 'normal'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(false);
  const [noticeFormMsg, setNoticeFormMsg] = useState('');
  const fileInputRef = useRef(null);

  // AI Assistant Chat state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your CampusPulse AI Assistant. How can I assist you with class timetables, notices, or events today?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // 1. Opening Animation (2.8 seconds progress timer)
  useEffect(() => {
    if (viewState === 'intro') {
      const interval = setInterval(() => {
        setIntroProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setViewState('select_role');
            return 100;
          }
          return prev + 5;
        });
      }, 120);
      return () => clearInterval(interval);
    }
  }, [viewState]);

  // Load Session on Token
  useEffect(() => {
    if (token) {
      getMe()
        .then(u => {
          setUser(u);
          if (u.mustChangePassword) setShowPasswordModal(true);
        })
        .catch(() => handleLogout());
    }
  }, [token]);

  // Load Public & User Data
  useEffect(() => {
    loadCampusData();
  }, [user, token, activeNoticeCategory, noticeSmartSort]);

  const loadCampusData = async () => {
    try {
      const params = {};
      if (activeNoticeCategory !== 'All') params.category = activeNoticeCategory;
      if (noticeSmartSort) params.smartSort = 'true';

      const [nRes, evRes, stRes] = await Promise.all([
        portalApi.getNotices(params).catch(() => ({ data: { notices: [] } })),
        portalApi.getEvents().catch(() => ({ data: { events: [] } })),
        portalApi.getUrgentStories().catch(() => ({ data: { stories: [] } }))
      ]);

      if (nRes.data?.notices) setNotices(nRes.data.notices);
      if (evRes.data?.events) setEvents(evRes.data.events);
      if (stRes.data?.stories) setUrgentStories(stRes.data.stories);

      // Student schedule conflict
      if (user?.role === 'STUDENT') {
        const confRes = await portalApi.getConflicts().catch(() => null);
        if (confRes?.data?.conflicts?.length > 0) {
          setScheduleConflict(confRes.data.conflicts[0]);
        }
      }

      // Teacher / Faculty Data
      if (user?.role === 'TEACHER' || user?.role === 'CLUB_LEADER') {
        const [statsRes, managedRes] = await Promise.all([
          portalApi.getOrganizerStats().catch(() => null),
          portalApi.getManagedEvents().catch(() => null)
        ]);
        if (statsRes?.data) setOrganizerStats(statsRes.data);
        if (managedRes?.data?.events) setManagedEvents(managedRes.data.events);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Handlers (Strict Role Gating)
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const data = await login(loginId, password, 'STUDENT');
      setUser(data.user);
      setToken(data.token);
      if (data.mustChangePassword) setShowPasswordModal(true);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify your Student credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const data = await login(loginId, password, 'TEACHER');
      setUser(data.user);
      setToken(data.token);
      if (data.mustChangePassword) setShowPasswordModal(true);
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify your Faculty credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setToken(null);
    setViewState('select_role');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }
    try {
      const data = await changePassword(currPass, newPass);
      setPassSuccess('Password updated successfully! Redirecting...');
      setTimeout(() => {
        setShowPasswordModal(false);
        setUser(data.user);
      }, 1200);
    } catch (err) {
      setPassError(err.message || 'Failed to update password');
    }
  };

  // Student: Register for Event (Intra Form Submission)
  const handleOpenRegisterModal = (ev) => {
    if (ev.scope === 'INTER-COLLEGE') {
      // Direct prompt / external registration guidance
      setRegisteringEvent(ev);
    } else {
      // Intra-College Form
      setRegisteringEvent(ev);
      // Pre-fill initial defaults
      const defaults = {};
      (ev.customFormFields || ['Student ID / Roll No', 'Department & Semester']).forEach(field => {
        if (field.toLowerCase().includes('student') || field.toLowerCase().includes('id') || field.toLowerCase().includes('roll')) {
          defaults[field] = user?.studentId || '';
        } else if (field.toLowerCase().includes('department') || field.toLowerCase().includes('branch')) {
          defaults[field] = user?.department || 'Computer Science';
        } else {
          defaults[field] = '';
        }
      });
      setIntraFormAnswers(defaults);
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setIsRegistering(true);
    try {
      const payload = {
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        college: registeringEvent.scope === 'INTRA-COLLEGE' ? 'Campus Institute of Technology (In-House)' : (intraFormAnswers['College Name'] || 'External College'),
        department: user.department,
        year: user.year,
        phone: user.phone,
        formData: intraFormAnswers
      };

      const res = await portalApi.registerEvent(registeringEvent.id, payload);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setRegisteringEvent(null);
      loadCampusData();

      // Show digital ticket modal
      setTicketModalEvent({
        ...registeringEvent,
        ticketId: res.data?.ticket?.ticketId || 'TCK-863149',
        qrToken: res.data?.ticket?.qrPayload || `CAMPUSPULSE:EVT:${registeringEvent.id}:${user.studentId}`
      });
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  // Student Unregister
  const handleUnregisterEvent = async (eventId) => {
    try {
      await portalApi.unregisterEvent(eventId);
      loadCampusData();
    } catch (err) {
      alert(err.message || 'Failed to cancel registration');
    }
  };

  // Teacher: Load Event Registrations Roster
  const handleViewRegistrations = async (ev) => {
    setSelectedManagedEvent(ev);
    setIsLoadingRoster(true);
    try {
      const res = await portalApi.getEventRegistrations(ev.id);
      if (res.data?.registrations) {
        setEventRoster(res.data.registrations);
      }
    } catch (err) {
      alert(err.message || 'Failed to load registrations');
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Teacher: Export Attendees (.xlsx / .json)
  const handleDownloadExport = (format) => {
    if (!selectedManagedEvent) return;
    const exportUrl = `${API_BASE}/events/${selectedManagedEvent.id}/registrations/export?format=${format}`;
    // Trigger direct file download
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', `registrations_${selectedManagedEvent.id}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Teacher: Create Event Submit
  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setEventFormMsg('');
    try {
      const payload = {
        title: eventFormData.title,
        venue: eventFormData.venue,
        date: eventFormData.date || 'Next Week',
        time: eventFormData.time,
        capacity: Number(eventFormData.capacity) || 100,
        category: eventFormData.category,
        description: eventFormData.description,
        scope: eventScope,
        customFormFields: eventScope === 'INTRA-COLLEGE' ? eventFormData.customFields : null,
        externalRegistrationLink: eventScope === 'INTER-COLLEGE' ? eventFormData.externalRegistrationLink : null,
        organizer: user.name
      };

      await portalApi.createManagedEvent(payload);
      setEventFormMsg('Event published successfully to campus feed!');
      setTimeout(() => {
        setEventFormMsg('');
        setTeacherNavTab('events');
        loadCampusData();
      }, 1000);
    } catch (err) {
      setEventFormMsg(err.message || 'Failed to create event');
    }
  };

  // Notice Creation with File Upload
  const handleFileSelect = (file) => {
    if (!file) return;
    // Client-side file size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|png|jpg|jpeg|doc|docx)$/i)) {
      alert('Only PDF, PNG, JPG, JPEG, DOC, and DOCX files are allowed.');
      return;
    }
    setSelectedFile(file);
  };

  const handleCreateNoticeSubmit = async (e) => {
    e.preventDefault();
    setNoticeFormMsg('');
    setFileUploadProgress(true);

    try {
      let attachments = [];
      if (selectedFile) {
        const uploadRes = await portalApi.uploadFile(selectedFile);
        if (uploadRes.data?.file) {
          attachments.push({
            name: uploadRes.data.file.originalName,
            url: uploadRes.data.file.url,
            size: `${(uploadRes.data.file.size / 1024).toFixed(1)} KB`,
            type: selectedFile.name.endsWith('.pdf') ? 'pdf' : selectedFile.name.match(/\.(png|jpg|jpeg)$/i) ? 'image' : 'doc'
          });
        }
      }

      const payload = {
        title: noticeFormData.title,
        category: noticeFormData.category,
        department: user.department || 'Academic Department',
        content: noticeFormData.content,
        urgency: noticeFormData.urgency,
        attachments
      };

      await portalApi.createNotice(payload);
      setNoticeFormMsg('Notice published successfully with verified department seal!');
      setTimeout(() => {
        setNoticeFormMsg('');
        setSelectedFile(null);
        setNoticeFormData({ title: '', category: 'Academic', department: '', content: '', urgency: 'normal' });
        setTeacherNavTab('notices');
        loadCampusData();
      }, 1200);
    } catch (err) {
      setNoticeFormMsg(err.message || 'Failed to publish notice');
    } finally {
      setFileUploadProgress(false);
    }
  };

  // AI Assistant Chat
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const q = aiInput.trim();
    setAiMessages(prev => [...prev, { sender: 'user', text: q }]);
    setAiInput('');
    setIsAiTyping(true);
    try {
      const res = await portalApi.askAssistant(q);
      setAiMessages(prev => [...prev, {
        sender: 'ai',
        text: res.data?.reply || 'Information retrieved. Check your personalized schedule and notice board for details.',
        attachments: res.data?.attachments
      }]);
    } catch {
      setAiMessages(prev => [...prev, { sender: 'ai', text: 'I am temporarily unable to sync campus schedules. Please try again.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // =========================================================================
  // VIEW 1: 3D ANIMATED OPENING / LOADING EXPERIENCE (2–4 SECONDS)
  // =========================================================================
  if (viewState === 'intro') {
    return (
      <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Skip button for testing */}
        <button
          onClick={() => setViewState('select_role')}
          className="absolute top-6 right-6 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-600 transition flex items-center gap-1.5 z-20"
        >
          Skip Intro <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="text-center z-10 max-w-md w-full flex flex-col items-center">
          {/* 3D Animated Campus Structure */}
          <div className="perspective-container w-44 h-44 mb-8 flex items-center justify-center">
            <div className="preserve-3d animate-3d-spin w-28 h-28 relative">
              {/* Isometric Department Tiers */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 opacity-90 shadow-2xl shadow-blue-500/50 transform translate-z-8" />
              <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-600 opacity-80 border border-cyan-400/40 transform -rotate-12" />
              <div className="absolute inset-4 rounded-lg bg-slate-900/90 border border-blue-400 flex items-center justify-center shadow-inner">
                <span className="font-black text-2xl tracking-tighter text-white">CP</span>
              </div>
              {/* Pulsing Satellite Node */}
              <div className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/80 animate-ping" />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 rounded-full bg-indigo-400 shadow-md shadow-indigo-400/80" />
            </div>
          </div>

          {/* Animated Logo Reveal & Title */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Smart Campus Management Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
            Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">Pulse</span>
          </h1>

          {/* Tagline */}
          <div className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed mb-8">
            <p className="text-slate-200 font-semibold">Connecting Your Campus</p>
            <p className="text-xs text-slate-400 mt-0.5">One Platform. Every Update.</p>
          </div>

          {/* Sleek Progress Bar */}
          <div className="w-64 sm:w-80 bg-slate-800/80 rounded-full h-2 p-0.5 border border-slate-700/60 overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full transition-all duration-150 ease-out shadow-sm shadow-cyan-400/50"
              style={{ width: `${introProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-64 sm:w-80 text-[11px] text-slate-400 font-mono">
            <span>Loading campus modules...</span>
            <span className="font-bold text-cyan-400">{introProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN TYPE SELECTION SCREEN (CHOOSE STUDENT OR TEACHER)
  // (NO Admin Panel links or mentions per user instruction)
  // =========================================================================
  if (!user && viewState === 'select_role') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between items-center p-6 font-sans">
        {/* Header */}
        <header className="w-full max-w-4xl flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              CP
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">CampusPulse</span>
              <span className="text-xs text-slate-400 block font-medium">Smart Campus Gateway</span>
            </div>
          </div>
          <button
            onClick={() => { setIntroProgress(0); setViewState('intro'); }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
          >
            Replay Intro
          </button>
        </header>

        {/* Hero & Selection Matrix */}
        <main className="w-full max-w-4xl my-auto py-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Welcome to CampusPulse
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Choose how you want to continue
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Select your university role to enter your dedicated personalized campus experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 1. STUDENT CARD */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 card-shadow-hover flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-110 transition duration-300" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 block mb-1">
                  Enrolled Students
                </span>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Student</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Sign in with your Student College ID to view clash-free timetables, verified notices, and register for in-house & inter-college events.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>In-House & Inter-College Event Registration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Cryptographic QR Entry Passes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Verified Academic Notices with AI TL;DR</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => { setAuthError(''); setViewState('student_login'); }}
                className="relative z-10 w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                Continue as Student <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2. TEACHER / FACULTY CARD */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 card-shadow-hover flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 group-hover:scale-110 transition duration-300" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner">
                  <Briefcase className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 block mb-1">
                  Academic Faculty
                </span>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Faculty / Teacher</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Sign in with your Faculty ID to broadcast circulars with file attachments, create in-house & inter-college events, and export attendee rosters.
                </p>

                <ul className="space-y-2 text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Notice Publishing with Drag & Drop Files</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In-House Registration Form Builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Export Attendee Lists to Excel (.xlsx) & JSON</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => { setAuthError(''); setViewState('teacher_login'); }}
                className="relative z-10 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                Continue as Teacher <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full text-center py-4 text-xs text-slate-400">
          © 2026 CampusPulse • Central Smart Campus Management Platform
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: DEDICATED STUDENT LOGIN (/student/login)
  // =========================================================================
  if (!user && viewState === 'student_login') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <button
              onClick={() => { setAuthError(''); setViewState('select_role'); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1.5 transition"
            >
              ← Choose a different role
            </button>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Student Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">Enter your student credentials to enter CampusPulse</p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 card-shadow">
            {authError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student College ID
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. 2023CS042"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? 'Verifying Student Role...' : 'Sign In as Student'}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Demo Student Accounts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setLoginId('2023CS042'); setPassword('student123'); }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 text-left transition"
                >
                  <div className="font-bold text-slate-800">Student (Ritik)</div>
                  <div className="text-[10px] text-slate-500 font-mono">2023CS042</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginId('2024CS099'); setPassword('tempPass123!'); }}
                  className="p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 text-left text-amber-900 transition"
                >
                  <div className="font-bold">First-Login Demo</div>
                  <div className="text-[10px] text-amber-700 font-mono">2024CS099</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: DEDICATED TEACHER LOGIN (/teacher/login)
  // =========================================================================
  if (!user && viewState === 'teacher_login') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <button
              onClick={() => { setAuthError(''); setViewState('select_role'); }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1.5 transition"
            >
              ← Choose a different role
            </button>
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Faculty & Teacher Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">Enter your faculty credentials to manage campus operations</p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 card-shadow">
            {authError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty / Teacher ID
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. TCH101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? 'Verifying Faculty Role...' : 'Sign In as Faculty'}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Demo Faculty Account
              </span>
              <button
                type="button"
                onClick={() => { setLoginId('TCH101'); setPassword('teacher123'); }}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80 text-left transition"
              >
                <div className="font-bold text-slate-800">Faculty (Dr. Arvind Rao)</div>
                <div className="text-[10px] text-slate-500 font-mono">TCH101 • Dept of CSE</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 5: AUTHENTICATED TEACHER HOME (/teacher/home)
  // =========================================================================
  if (user?.role === 'TEACHER' || user?.role === 'CLUB_LEADER') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
        {/* TEACHER SIDEBAR */}
        <aside className="w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between hidden md:flex shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
                CP
              </div>
              <div>
                <span className="font-black text-slate-900 text-base">CampusPulse</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 block mt-0.5">
                  Faculty Portal
                </span>
              </div>
            </div>

            <nav className="space-y-1.5 text-xs font-semibold">
              <button
                onClick={() => setTeacherNavTab('home')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  teacherNavTab === 'home' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HomeIcon className="w-4 h-4" /> Overview Dashboard
              </button>
              <button
                onClick={() => setTeacherNavTab('events')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  teacherNavTab === 'events' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" /> My Events
              </button>
              <button
                onClick={() => setTeacherNavTab('create_event')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  teacherNavTab === 'create_event' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-600" /> Create Campus Event
              </button>
              <button
                onClick={() => setTeacherNavTab('notices')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  teacherNavTab === 'notices' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bell className="w-4 h-4" /> All Notices
              </button>
              <button
                onClick={() => setTeacherNavTab('create_notice')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                  teacherNavTab === 'create_notice' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-600" /> Publish Notice & File
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                {user.name?.charAt(0) || 'P'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user.studentId}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* TEACHER MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2 md:hidden">
              <span className="font-black text-slate-900 text-sm">CampusPulse</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                Faculty
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Department of {user.department || 'Computer Science'} • Authorized Broadcaster</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTeacherNavTab('create_notice')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Publish Notice
              </button>
              <button
                onClick={() => setTeacherNavTab('create_event')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" /> Create Event
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 md:hidden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="p-6 max-w-6xl w-full mx-auto space-y-6">
            {/* Faculty Welcome Hero */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-700/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
                  Academic Faculty Desk
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2">
                  Welcome back, Professor {user.name} 👋
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl leading-relaxed">
                  Manage in-house college registrations, link external portals for inter-college hackathons, and publish official departmental circulars with file attachments.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTeacherNavTab('create_event')}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 shadow-md transition"
                >
                  + New Campus Event
                </button>
              </div>
            </div>

            {/* 4 Faculty KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Events Managed
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {events.length || 4} Events
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">✓ Intra & Inter Scope</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Events
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {events.filter(e => !e.isPast).length || 3} Active
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Accepting Registrations</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Registrations
                </span>
                <span className="text-2xl font-black text-slate-900">
                  248 Students
                </span>
                <span className="text-[11px] text-blue-600 block mt-1">Exportable (.xlsx / .json)</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 card-shadow">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Published Notices
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {notices.length || 5} Circulars
                </span>
                <span className="text-[11px] text-purple-600 block mt-1">Attached PDF/Docs</span>
              </div>
            </div>

            {/* TAB: OVERVIEW / MY EVENTS */}
            {(teacherNavTab === 'home' || teacherNavTab === 'events') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Managed Campus Events</h3>
                    <p className="text-xs text-slate-500">Track registrations, manage scopes, and export attendee lists</p>
                  </div>
                  <button
                    onClick={() => setTeacherNavTab('create_event')}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    + Create Another Event
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(ev => (
                    <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200 card-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            ev.scope === 'INTER-COLLEGE'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {ev.scope === 'INTER-COLLEGE' ? '🌐 INTER-COLLEGE (Other Colleges)' : '🏛️ INTRA-COLLEGE (In-House Only)'}
                          </span>
                          <span className="text-[11px] text-slate-400">{ev.category || 'Tech'}</span>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 mb-1">{ev.title}</h4>
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-3">
                          <span>📅 {ev.date}</span>
                          <span>📍 {ev.location || 'Main Auditorium'}</span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Capacity</span>
                            <span className="font-bold text-slate-700">{ev.rsvps || 3} / {ev.capacity || 100} Registered</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, ((ev.rsvps || 3) / (ev.capacity || 100)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">ID: {ev.id}</span>
                        <button
                          onClick={() => handleViewRegistrations(ev)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5" /> Manage Registrations & Export
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: CREATE EVENT (INTRA VS INTER) */}
            {teacherNavTab === 'create_event' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow max-w-3xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900">Create Campus Event</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure registration scope (In-house custom form vs. Inter-college external registration link)
                  </p>
                </div>

                {eventFormMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{eventFormMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateEventSubmit} className="space-y-5 text-xs">
                  {/* Scope Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      1. Select Event Participation Scope *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setEventScope('INTRA-COLLEGE')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                          eventScope === 'INTRA-COLLEGE'
                            ? 'border-blue-600 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🏛️</span>
                          <span className="font-black text-sm text-slate-900">INTRA-COLLEGE (In-House)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          For students of <strong>our college only</strong>. Generates an in-app registration form that students fill out directly.
                        </p>
                      </div>

                      <div
                        onClick={() => setEventScope('INTER-COLLEGE')}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                          eventScope === 'INTER-COLLEGE'
                            ? 'border-purple-600 bg-purple-50/50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🌐</span>
                          <span className="font-black text-sm text-slate-900">INTER-COLLEGE (Outside)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Open to <strong>other / outside colleges</strong>. Upload an external registration link (e.g. Unstop, Google Form, or portal).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Event Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. National Hackathon 2026"
                        value={eventFormData.title}
                        onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Venue / Location *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Turing Lab 402 or Main Auditorium"
                        value={eventFormData.venue}
                        onChange={e => setEventFormData({ ...eventFormData, venue: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sep 15, 2026"
                        value={eventFormData.date}
                        onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Time Window</label>
                      <input
                        type="text"
                        placeholder="e.g. 2:00 PM - 5:00 PM"
                        value={eventFormData.time}
                        onChange={e => setEventFormData({ ...eventFormData, time: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Attendee Capacity</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={eventFormData.capacity}
                        onChange={e => setEventFormData({ ...eventFormData, capacity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Scope Specific Options */}
                  {eventScope === 'INTRA-COLLEGE' ? (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                      <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-600" /> In-House Registration Form Builder
                      </div>
                      <p className="text-[11px] text-blue-700 mb-3">
                        These fields will be displayed to our college students when they click "Register":
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {eventFormData.customFields.map((field, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl bg-white border border-blue-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                            <span>{field}</span>
                            {idx > 1 && (
                              <button
                                type="button"
                                onClick={() => setEventFormData({
                                  ...eventFormData,
                                  customFields: eventFormData.customFields.filter((_, i) => i !== idx)
                                })}
                                className="text-slate-400 hover:text-red-600"
                              >
                                ✕
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add custom question (e.g. GitHub URL, Team Name)..."
                          value={newCustomFieldInput}
                          onChange={e => setNewCustomFieldInput(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCustomFieldInput.trim()) {
                              setEventFormData({
                                ...eventFormData,
                                customFields: [...eventFormData.customFields, newCustomFieldInput.trim()]
                              });
                              setNewCustomFieldInput('');
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm"
                        >
                          + Add Field
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
                      <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-purple-600" /> External Registration Portal Link
                      </div>
                      <p className="text-[11px] text-purple-700 mb-3">
                        Students and outside participants will be directed to this link to register:
                      </p>

                      <input
                        type="url"
                        required
                        placeholder="https://unstop.com/hackathons/... or https://forms.gle/..."
                        value={eventFormData.externalRegistrationLink}
                        onChange={e => setEventFormData({ ...eventFormData, externalRegistrationLink: e.target.value })}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-950"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Event Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter briefing, topics covered, prerequisites..."
                      value={eventFormData.description}
                      onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setTeacherNavTab('events')}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                    >
                      Publish Event Now
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: CREATE NOTICE WITH DRAG & DROP FILE UPLOAD */}
            {teacherNavTab === 'create_notice' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 card-shadow max-w-3xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-900">Publish Department Notice</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official faculty broadcast with verified department seal and downloadable circular file
                  </p>
                </div>

                {noticeFormMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{noticeFormMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreateNoticeSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mid-Term Examination Schedule & Guidelines"
                      value={noticeFormData.title}
                      onChange={e => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={noticeFormData.category}
                        onChange={e => setNoticeFormData({ ...noticeFormData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Exam">Examination</option>
                        <option value="Urgent">Urgent Alert</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Urgency Priority</label>
                      <select
                        value={noticeFormData.urgency}
                        onChange={e => setNoticeFormData({ ...noticeFormData, urgency: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="high">High Urgency (Pulsing Banner)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notice Content / Instructions *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Provide the complete circular details and instructions for students..."
                      value={noticeFormData.content}
                      onChange={e => setNoticeFormData({ ...noticeFormData, content: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white"
                    />
                  </div>

                  {/* Drag-and-Drop File Upload Component */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Upload Document / Circular (PDF, Images, DOC up to 10MB)
                    </label>
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-emerald-50/40 cursor-pointer transition flex flex-col items-center justify-center"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={e => {
                          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shadow-sm mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs">
                        Drag & drop notice circular here, or <span className="text-emerald-600 underline">browse</span>
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Supported: PDF, PNG, JPG, JPEG, DOC, DOCX (Max 10MB)
                      </span>
                    </div>

                    {/* File Preview Pill */}
                    {selectedFile && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs truncate max-w-xs">{selectedFile.name}</div>
                            <div className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for upload</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setTeacherNavTab('home')}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={fileUploadProgress}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {fileUploadProgress ? 'Uploading File & Publishing...' : 'Broadcast Notice'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: NOTICES FEED */}
            {teacherNavTab === 'notices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900">Campus Notice Board Feed</h3>
                  <button
                    onClick={() => setTeacherNavTab('create_notice')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                  >
                    + Publish Notice
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notices.map(n => (
                    <div key={n.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 card-shadow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {n.category}
                          </span>
                          <span className="text-[11px] text-slate-400">{n.postedAt || 'Recently'}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">{n.title}</h4>
                        <p className="text-xs text-slate-600 mb-3 line-clamp-3">{n.content || n.aiSummary}</p>

                        {/* Attachments preview */}
                        {n.attachments?.length > 0 && (
                          <div className="mb-3 space-y-1">
                            {n.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-emerald-800 text-[11px] font-semibold transition"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{att.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{n.department}</span>
                        <span className="text-emerald-600 font-semibold">✓ Verified Broadcaster</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* ========================================================================= */}
        {/* MODAL: EVENT REGISTRATION MANAGEMENT & EXPORT (EXCEL & JSON)              */}
        {/* ========================================================================= */}
        {selectedManagedEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 card-shadow border border-slate-200 max-h-[90vh] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        selectedManagedEvent.scope === 'INTER-COLLEGE'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {selectedManagedEvent.scope === 'INTER-COLLEGE' ? '🌐 Inter-College' : '🏛️ Intra-College (In-House)'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{selectedManagedEvent.id}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{selectedManagedEvent.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {selectedManagedEvent.location || 'Campus Hall'} • 📅 {selectedManagedEvent.date}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedManagedEvent(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Capacity Bar & Stats */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered</span>
                    <span className="text-lg font-black text-slate-900">{eventRoster.length} Students</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Capacity</span>
                    <span className="text-lg font-black text-slate-900">{selectedManagedEvent.capacity || 100}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center text-emerald-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">Filled</span>
                    <span className="text-lg font-black">
                      {Math.round((eventRoster.length / (selectedManagedEvent.capacity || 100)) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Search & Export Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search attendee by name, ID, college..."
                      value={rosterSearch}
                      onChange={e => setRosterSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadExport('xlsx')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDownloadExport('json')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Export JSON
                    </button>
                  </div>
                </div>

                {/* Attendees Table */}
                <div className="overflow-x-auto max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Attendee</th>
                        <th className="py-2.5 px-3">College / Institute</th>
                        <th className="py-2.5 px-3">Dept & Year</th>
                        <th className="py-2.5 px-3">Ticket ID</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventRoster
                        .filter(r => !rosterSearch || r.name.toLowerCase().includes(rosterSearch.toLowerCase()) || r.studentId?.toLowerCase().includes(rosterSearch.toLowerCase()) || r.college?.toLowerCase().includes(rosterSearch.toLowerCase()))
                        .map((att, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{att.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{att.studentId} • {att.email}</div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">
                              {att.college || 'Campus Institute of Technology (In-House)'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {att.department} • {att.year}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                              {att.ticketId}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'Checked In'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {att.status || 'Registered'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedManagedEvent(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 6: AUTHENTICATED STUDENT HOME (/student/home)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-slate-900 font-sans">
      {/* STUDENT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-600/20">
              CP
            </div>
            <div>
              <span className="font-black text-slate-900 text-base">CampusPulse</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 block mt-0.5">
                Student
              </span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setStudentNavTab('home')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                studentNavTab === 'home' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HomeIcon className="w-4 h-4" /> Home Feed
            </button>
            <button
              onClick={() => setStudentNavTab('notices')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                studentNavTab === 'notices' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4 h-4" /> Official Notices
            </button>
            <button
              onClick={() => setStudentNavTab('events')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                studentNavTab === 'events' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" /> Campus Events
            </button>
            <button
              onClick={() => setStudentNavTab('registrations')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                studentNavTab === 'registrations' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4" /> My Registrations & Passes
            </button>
            <button
              onClick={() => setStudentNavTab('clubs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${
                studentNavTab === 'clubs' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4" /> Chartered Clubs
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-xs truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">{user?.studentId}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* STUDENT MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-black text-slate-900 text-sm">CampusPulse</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700">
              Student
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>{user?.department || 'Computer Science'} • {user?.year || '3rd'} Year • Div {user?.division || 'A'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Ask AI Assistant</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 md:hidden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* Personalized Student Greeting */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
                Student Campus Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2">
                Welcome back, {user?.name} 👋
              </h1>
              <p className="text-xs text-blue-100 mt-1 max-w-xl">
                Roll No: {user?.studentId} • {user?.department} • Year {user?.year} • Clash-free timetable & verified feeds active
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStudentNavTab('events')}
                className="px-4 py-2.5 rounded-xl bg-white text-blue-800 text-xs font-bold hover:bg-blue-50 shadow-md transition"
              >
                Browse Campus Events
              </button>
            </div>
          </div>

          {/* Schedule Conflict Alert Banner (if any) */}
          {scheduleConflict && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs sm:text-sm">Smart Schedule Clash Detected</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    "{scheduleConflict.courseA}" clashes with "{scheduleConflict.courseB}" on {scheduleConflict.date} at {scheduleConflict.time}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleConflict(null)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Urgent Campus Stories Carousel */}
          {urgentStories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Flash Stories</h3>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {urgentStories.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveStory(s)}
                    className="flex flex-col items-center cursor-pointer shrink-0 group"
                  >
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-red-500 shadow-md group-hover:scale-105 transition">
                      <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                        <img src={s.avatar || s.thumbnail || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt="" className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 mt-1 max-w-[70px] truncate text-center">
                      {s.author || s.title || 'Urgent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTICES SECTION */}
          {(studentNavTab === 'home' || studentNavTab === 'notices') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Campus Notice Board</h2>
                  <p className="text-xs text-slate-500">Official circulars, exam schedules, and department guidelines</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['All', 'Academic', 'Clubs', 'Exams', 'Urgent'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveNoticeCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeNoticeCategory === cat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setNoticeSmartSort(!noticeSmartSort)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      noticeSmartSort
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Smart Sort
                  </button>
                </div>
              </div>

              {/* Notices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices.map(n => (
                  <div key={n.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 card-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {n.category}
                        </span>
                        <span className="text-[11px] text-slate-400">{n.postedAt || 'Recently'}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-1">{n.title}</h3>
                      <div className="text-xs text-slate-600 line-clamp-3 mb-3">{n.content || n.aiSummary}</div>

                      {n.aiSummary && (
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 mb-3 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{n.aiSummary}</span>
                        </div>
                      )}

                      {/* File Download Component */}
                      {n.attachments?.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {n.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-blue-800 text-xs transition"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-bold truncate max-w-[200px]">{att.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Download className="w-3 h-3" /> Download ({att.size})
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{n.department}</span>
                      <span className="text-blue-600 font-semibold">✓ Verified Broadcaster</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENTS SECTION (INTRA VS INTER) */}
          {(studentNavTab === 'home' || studentNavTab === 'events') && (
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Upcoming Campus Events</h2>
                <p className="text-xs text-slate-500">In-house workshops and inter-college hackathons</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 card-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {/* Distinct INTRA vs INTER Badges */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          ev.scope === 'INTER-COLLEGE'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {ev.scope === 'INTER-COLLEGE' ? '🌐 INTER-COLLEGE (Other Colleges)' : '🏛️ INTRA-COLLEGE (In-House Only)'}
                        </span>

                        {ev.isRegistered && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            ✓ Registered
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-1">{ev.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ev.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.venue || ev.location || 'Auditorium'}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-4">{ev.description || 'Join students and mentors in this campus session.'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Capacity: {ev.rsvps || 3}/{ev.capacity || 100}</span>

                      {ev.isRegistered ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTicketModalEvent({
                              ...ev,
                              ticketId: `TCK-${ev.id.replace('evt_', '')}-9042`,
                              qrToken: `CP-VALID-${ev.id}-${user.studentId}`
                            })}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" /> View Digital Pass
                          </button>
                          <button
                            onClick={() => handleUnregisterEvent(ev.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {ev.scope === 'INTER-COLLEGE' && ev.externalRegistrationLink && (
                            <a
                              href={ev.externalRegistrationLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> External Link ↗
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenRegisterModal(ev)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                          >
                            {ev.scope === 'INTRA-COLLEGE' ? 'Fill In-House Form' : 'Register Here'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY REGISTRATIONS TAB */}
          {studentNavTab === 'registrations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900">My Registered Campus Passes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.filter(e => e.isRegistered).map(ev => (
                  <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200 card-shadow">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Confirmed RSVP</span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{ev.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{ev.date} • {ev.venue || ev.location}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-600">Pass: TCK-{ev.id.replace('evt_', '')}-9042</span>
                      <button
                        onClick={() => setTicketModalEvent({
                          ...ev,
                          ticketId: `TCK-${ev.id.replace('evt_', '')}-9042`,
                          qrToken: `CP-VALID-${ev.id}-${user.studentId}`
                        })}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Entry Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INTRA-COLLEGE IN-HOUSE REGISTRATION FORM (STUDENTS)                */}
      {/* ========================================================================= */}
      {registeringEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 card-shadow border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  registeringEvent.scope === 'INTER-COLLEGE'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {registeringEvent.scope === 'INTER-COLLEGE' ? '🌐 Inter-College Registration' : '🏛️ In-House College Form'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{registeringEvent.title}</h3>
                <p className="text-xs text-slate-500">📍 {registeringEvent.location || 'Campus Hall'} • 📅 {registeringEvent.date}</p>
              </div>
              <button onClick={() => setRegisteringEvent(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
            </div>

            {registeringEvent.scope === 'INTER-COLLEGE' && registeringEvent.externalRegistrationLink && (
              <div className="mb-4 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                <span className="font-bold block mb-1">External Registration Available:</span>
                <p className="text-[11px] mb-3">You can also register on the official external university portal:</p>
                <a
                  href={registeringEvent.externalRegistrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open {new URL(registeringEvent.externalRegistrationLink).hostname} ↗
                </a>
              </div>
            )}

            <form onSubmit={handleSubmitRegistration} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Student Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600"
                />
              </div>

              {registeringEvent.scope === 'INTER-COLLEGE' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">College / University Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Institute of Technology or Campus Institute"
                    value={intraFormAnswers['College Name'] || ''}
                    onChange={e => setIntraFormAnswers({ ...intraFormAnswers, 'College Name': e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              )}

              {/* Dynamic In-House Custom Form Fields configured by Teacher */}
              {(registeringEvent.customFormFields || ['Student ID / Roll No', 'Department & Semester', 'Prior Knowledge / Project Idea']).map((field, i) => (
                <div key={i}>
                  <label className="block font-bold text-slate-700 mb-1">{field} *</label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter ${field}...`}
                    value={intraFormAnswers[field] || ''}
                    onChange={e => setIntraFormAnswers({ ...intraFormAnswers, [field]: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRegisteringEvent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isRegistering ? 'Submitting Registration...' : 'Confirm Registration & Get Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DIGITAL TICKET QR PASS MODAL ================= */}
      {ticketModalEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center card-shadow border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-3 flex items-center justify-center font-bold">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Campus Entry Ticket</h3>
            <p className="text-xs text-slate-500 mb-4">{ticketModalEvent.title}</p>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-4">
              <QRCodeSVG
                value={ticketModalEvent.qrToken || `CAMPUSPULSE:EVT:${ticketModalEvent.id}:${user.studentId}`}
                size={160}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1 mb-4 font-mono">
              <div>Ticket: <strong>{ticketModalEvent.ticketId || 'TCK-863149'}</strong></div>
              <div>Holder: <strong>{user.name} ({user.studentId})</strong></div>
              <div>Venue: <strong>{ticketModalEvent.venue || ticketModalEvent.location || 'Campus Auditorium'}</strong></div>
            </div>

            <button
              onClick={() => setTicketModalEvent(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ================= MANDATORY FIRST LOGIN PASSWORD CHANGE ================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 card-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto mb-3 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-1">Mandatory First-Login Password Change</h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Your account was created with a temporary password. You must set a permanent private password to continue.
            </p>

            {passError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currPass}
                  onChange={e => setCurrPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Secure Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
              >
                Set Permanent Password & Enter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= AI ASSISTANT CHAT OVERLAY ================= */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[520px] p-5 flex flex-col justify-between card-shadow border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">CampusPulse AI Assistant</h4>
                  <p className="text-[10px] text-slate-500">Live timetable, notices & campus knowledge</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="text-xs text-slate-400 italic">CampusPulse AI is thinking...</div>
              )}
            </div>

            <form onSubmit={handleSendAiMessage} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Ask: Any clash today? What notices are urgent?"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <button type="submit" className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= FULL-SCREEN FLASH STORY MODAL ================= */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 text-white relative">
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
            >
              ✕
            </button>
            <div className="h-96 w-full relative">
              <img src={activeStory.avatar || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80'} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">FLASH NOTICE</span>
                <h3 className="text-xl font-black mt-2">{activeStory.title || 'Campus Update'}</h3>
                <p className="text-xs text-slate-300 mt-1">{activeStory.content || 'Important live notification for all students.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
