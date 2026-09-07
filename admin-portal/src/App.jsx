import React, { useState, useEffect } from 'react';
import {
  Shield, Users, GraduationCap, UserCheck, Calendar, Bell, Key, RefreshCw,
  Search, Plus, CheckCircle, XCircle, Lock, LogOut, Eye, EyeOff, Sparkles,
  ChevronRight, AlertCircle, BarChart3, Activity, Award, Zap, Building, Check
} from 'lucide-react';
import { adminStorage, adminLogin, adminChangePassword, adminLogout, adminGetMe, adminApi } from './api/client';

export default function App() {
  const [user, setUser] = useState(adminStorage.getUser());
  const [token, setToken] = useState(adminStorage.getToken());
  
  // Login State
  const [loginId, setLoginId] = useState('ADM001');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'overview' | 'students' | 'teachers' | 'clubs' | 'notices' | 'events'
  const [activeTab, setActiveTab] = useState('overview');

  // Live Data States
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [clubLeaders, setClubLeaders] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalType, setModalType] = useState(null); // 'createStudent' | 'createTeacher' | 'createClubLeader' | 'resetPassword' | 'changeAdminPass' | 'createNotice'
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Form states
  const [formData, setFormData] = useState({});

  // Verify session on mount
  useEffect(() => {
    if (token) {
      adminGetMe()
        .then(u => setUser(u))
        .catch(() => handleLogout());
    }
  }, [token]);

  // Load tab data
  useEffect(() => {
    if (user && token) {
      loadTabData();
    }
  }, [user, token, activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    setActionError('');
    try {
      if (activeTab === 'overview') {
        const res = await adminApi.getStats();
        if (res.data) setStats(res.data);
      } else if (activeTab === 'students') {
        const res = await adminApi.getStudents(searchQuery);
        if (res.data) setStudents(res.data.students || []);
      } else if (activeTab === 'teachers') {
        const res = await adminApi.getTeachers(searchQuery);
        if (res.data) setTeachers(res.data.teachers || []);
      } else if (activeTab === 'clubs') {
        const res = await adminApi.getClubLeaders(searchQuery);
        if (res.data) setClubLeaders(res.data.clubLeaders || []);
      } else if (activeTab === 'notices') {
        const res = await adminApi.getNotices();
        if (res.data) setNotices(res.data.notices || []);
      } else if (activeTab === 'events') {
        const res = await adminApi.getEvents();
        if (res.data) setEvents(res.data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);
    try {
      const data = await adminLogin(loginId, password);
      setUser(data.user);
      setToken(data.token);
      if (data.mustChangePassword) {
        setModalType('changeAdminPass');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Verify your administrator credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setUser(null);
    setToken(null);
    setActiveTab('overview');
  };

  // Student Actions
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await adminApi.createStudent(formData);
      setActionSuccess(`Student ${formData.studentId} provisioned with temporary password: ${formData.temporaryPassword || 'Welcome2026!'}`);
      setModalType(null);
      setFormData({});
      loadTabData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleToggleStudent = async (id) => {
    try {
      await adminApi.toggleStudentStatus(id);
      loadTabData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetStudentPassword = async (e) => {
    e.preventDefault();
    try {
      await adminApi.resetStudentPassword(selectedTarget.id || selectedTarget.studentId, formData.temporaryPassword);
      setActionSuccess(`Password reset for ${selectedTarget.name}. Temp password: ${formData.temporaryPassword}`);
      setModalType(null);
      setFormData({});
      loadTabData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Teacher Actions
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await adminApi.createTeacher(formData);
      setActionSuccess(`Faculty account ${formData.teacherId} successfully created.`);
      setModalType(null);
      setFormData({});
      loadTabData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleToggleTeacher = async (id) => {
    try {
      await adminApi.toggleTeacherStatus(id);
      loadTabData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Club Leader Actions
  const handleCreateClubLeader = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await adminApi.createClubLeader(formData);
      setActionSuccess(`Club Leader account ${formData.clubLeaderId} created.`);
      setModalType(null);
      setFormData({});
      loadTabData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleToggleClubLeader = async (id) => {
    try {
      await adminApi.toggleClubLeaderStatus(id);
      loadTabData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Notice Action
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await adminApi.createNotice(formData);
      setActionSuccess('Official campus announcement published successfully.');
      setModalType(null);
      setFormData({});
      loadTabData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Event Boost
  const handleBoostEvent = async (id) => {
    try {
      await adminApi.boostEvent(id);
      setActionSuccess('Event boosted to top priority in student feed.');
      loadTabData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Admin Change Password
  const handleChangeAdminPassword = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await adminChangePassword(formData.currentPassword, formData.newPassword);
      setActionSuccess('Password updated successfully.');
      setModalType(null);
      setFormData({});
    } catch (err) {
      setActionError(err.message);
    }
  };

  // ================= RENDER LOGIN SCREEN =================
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 text-white font-black text-2xl mb-4 border border-blue-400/20">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">CampusPulse Administrator</h1>
            <p className="text-slate-400 text-sm mt-1">Central Administrative & Credential Command Portal</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400">
              <Lock className="w-3.5 h-3.5" /> Restricted Access — Authorized Personnel Only
            </div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-7 shadow-2xl">
            {authError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Administrator ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. ADM001"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <Shield className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Security Token...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In to Command Center
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Demo Admin: <strong className="text-slate-200">ADM001</strong></span>
              <button
                type="button"
                onClick={() => { setLoginId('ADM001'); setPassword('admin123'); }}
                className="text-blue-400 hover:underline font-semibold"
              >
                Auto-fill Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER AUTHENTICATED DASHBOARD =================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">CampusPulse</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Port 5174 • Production Command Suite</p>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{user.name}</span>
            <span className="text-slate-500">({user.studentId})</span>
          </div>

          <button
            onClick={() => { setFormData({}); setModalType('changeAdminPass'); }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700/50"
            title="Update Password"
          >
            <Key className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Password</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition border border-red-800/40"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 p-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'System Overview', icon: BarChart3 },
              { id: 'students', label: 'Student Accounts', icon: GraduationCap },
              { id: 'teachers', label: 'Faculty Directory', icon: UserCheck },
              { id: 'clubs', label: 'Club Leaders & Orgs', icon: Award },
              { id: 'notices', label: 'Notices & Broadcasts', icon: Bell },
              { id: 'events', label: 'Events & RSVPs', icon: Calendar },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" /> API Connection Active
            </div>
            <p className="text-slate-500">Connected to <strong>http://localhost:5000/api/v1</strong></p>
          </div>
        </aside>

        {/* Content Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {/* Notification Alerts */}
          {actionSuccess && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
            </div>
          )}

          {actionError && (
            <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
              <button onClick={() => setActionError('')} className="text-red-400 hover:text-white">✕</button>
            </div>
          )}

          {/* ================= VIEW 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white">Administrative Overview</h2>
                <p className="text-xs text-slate-400">Live operational telemetry across all smart campus entities</p>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Registered Students', val: stats?.totalStudents ?? '...', icon: GraduationCap, color: 'from-blue-600 to-cyan-500' },
                  { label: 'Faculty Members', val: stats?.totalTeachers ?? '...', icon: UserCheck, color: 'from-emerald-600 to-teal-500' },
                  { label: 'Active Club Leaders', val: stats?.totalClubLeaders ?? '...', icon: Award, color: 'from-purple-600 to-indigo-500' },
                  { label: 'Published Events', val: stats?.totalEvents ?? '...', icon: Calendar, color: 'from-amber-600 to-orange-500' },
                  { label: 'Campus Notices', val: stats?.totalNotices ?? '...', icon: Bell, color: 'from-rose-600 to-pink-500' },
                  { label: 'Chartered Clubs', val: stats?.activeClubs ?? '...', icon: Building, color: 'from-indigo-600 to-blue-500' },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">{kpi.label}</span>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white">{kpi.val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Recent Campus Audit Trail
                  </h3>
                  <button onClick={loadTabData} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {(stats?.recentActivity || []).map((act, i) => (
                    <div key={act.id || i} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white mr-2">{act.action}:</span>
                        <span className="text-slate-400">{act.detail}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{act.actor}</span>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: STUDENTS ================= */}
          {activeTab === 'students' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Student Credential Registry</h2>
                  <p className="text-xs text-slate-400">All students are pre-provisioned with College ID & temporary password</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ temporaryPassword: 'TempPass' + Math.floor(100 + Math.random() * 900) + '!' });
                    setModalType('createStudent');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Provision New Student
                </button>
              </div>

              {/* Filter / Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTabData()}
                    placeholder="Search by Student ID, Name, or Email..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <button
                  onClick={loadTabData}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Filter
                </button>
              </div>

              {/* Students Table */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">College ID</th>
                      <th className="py-3.5 px-4">Dept / Year / Div</th>
                      <th className="py-3.5 px-4">Security State</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{s.studentId}</td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {s.department || 'CS'} • {s.year || '3rd'} Year • Div {s.division || 'A'}
                        </td>
                        <td className="py-3.5 px-4">
                          {s.mustChangePassword ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold border border-amber-500/30">
                              First-Login Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                              Active Password
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            s.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {s.isActive !== false ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTarget(s);
                              setFormData({ temporaryPassword: 'Reset' + Math.floor(100 + Math.random() * 900) + '!' });
                              setModalType('resetPassword');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700/60"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={() => handleToggleStudent(s.id || s.studentId)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                              s.isActive !== false
                                ? 'bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800/50'
                                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/50'
                            }`}
                          >
                            {s.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: TEACHERS ================= */}
          {activeTab === 'teachers' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Faculty & Teacher Registry</h2>
                  <p className="text-xs text-slate-400">Teachers have rights to post academic notices and create seminars</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ temporaryPassword: 'Teach' + Math.floor(100 + Math.random() * 900) + '!' });
                    setModalType('createTeacher');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Register Faculty Member
                </button>
              </div>

              {/* Faculty Table */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Faculty Name</th>
                      <th className="py-3.5 px-4">Teacher ID</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Phone / Contact</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{t.name}</div>
                          <div className="text-[11px] text-slate-500">{t.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{t.teacherId || t.studentId}</td>
                        <td className="py-3.5 px-4 text-slate-300">{t.department || 'Computer Science'}</td>
                        <td className="py-3.5 px-4 text-slate-400">{t.phone || '+91 98765 43210'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            t.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {t.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTarget(t);
                              setFormData({ temporaryPassword: 'Reset' + Math.floor(100 + Math.random() * 900) + '!' });
                              setModalType('resetPassword');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700/60"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={() => handleToggleTeacher(t.id || t.studentId)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: CLUB LEADERS ================= */}
          {activeTab === 'clubs' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Club Leader Appointments</h2>
                  <p className="text-xs text-slate-400">Club leaders have posting rights strictly bound to their assigned club</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ temporaryPassword: 'Club' + Math.floor(100 + Math.random() * 900) + '!' });
                    setModalType('createClubLeader');
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Appoint Club Leader
                </button>
              </div>

              {/* Club Leaders Table */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Leader Name</th>
                      <th className="py-3.5 px-4">Leader ID</th>
                      <th className="py-3.5 px-4">Assigned Club</th>
                      <th className="py-3.5 px-4">Scope Restriction</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {clubLeaders.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{c.clubLeaderId || c.studentId}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                            {c.assignedClub || 'Coding Club'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          Strictly {c.assignedClub || 'Club'} events & notices only
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            c.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTarget(c);
                              setFormData({ temporaryPassword: 'Reset' + Math.floor(100 + Math.random() * 900) + '!' });
                              setModalType('resetPassword');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700/60"
                          >
                            Reset Pass
                          </button>
                          <button
                            onClick={() => handleToggleClubLeader(c.id || c.studentId)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: NOTICES ================= */}
          {activeTab === 'notices' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Campus Broadcasts & Notices</h2>
                  <p className="text-xs text-slate-400">Official administration announcements broadcasted to all students</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ category: 'Administrative', urgency: 'normal', department: 'Campus Administration' });
                    setModalType('createNotice');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Broadcast Notice
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notices.map(n => (
                  <div key={n.id} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {n.category}
                        </span>
                        <span className="text-[11px] text-slate-500">{n.postedAt || 'Recently'}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{n.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{n.content || n.aiSummary}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-500">
                      <span>Author: {n.department}</span>
                      <span className="text-emerald-400 font-semibold">✓ Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= VIEW 6: EVENTS ================= */}
          {activeTab === 'events' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white">Campus Events & RSVP Engine</h2>
                  <p className="text-xs text-slate-400">Boost, inspect capacity, and oversee registrations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {ev.category || 'Workshop'}
                        </span>
                        {ev.isBoosted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Boosted (+60% Reach)
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base mb-1">{ev.title}</h4>
                      <p className="text-xs text-slate-400 mb-3">{ev.date} • {ev.venue || 'Campus Auditorium'}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-300 mb-4">
                        <div>RSVP: <strong className="text-white">{ev.rsvps}</strong> / {ev.capacity}</div>
                        <div>Live Check-ins: <strong className="text-emerald-400">{ev.liveCheckins || 0}</strong></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                      <span className="text-xs text-slate-500">By {ev.organizer}</span>
                      {!ev.isBoosted && (
                        <button
                          onClick={() => handleBoostEvent(ev.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Boost Visibility
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}

      {/* Modal: Create Student */}
      {modalType === 'createStudent' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Provision Student Account</h3>
            <p className="text-xs text-slate-400 mb-4">Create account credentials with temporary password</p>

            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">College ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026CS101"
                    value={formData.studentId || ''}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Gupta"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rohan@student.campuspulse.edu"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department || 'Computer Science'}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Computer Science">CS</option>
                    <option value="Electronics & Comm">ECE</option>
                    <option value="Mechanical Eng">Mech</option>
                    <option value="Information Tech">IT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Year</label>
                  <select
                    value={formData.year || '1st'}
                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Division</label>
                  <input
                    type="text"
                    placeholder="A"
                    value={formData.division || 'A'}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temporary Password *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.temporaryPassword || ''}
                    onChange={e => setFormData({ ...formData, temporaryPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Student will be required to change this upon first login</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Teacher */}
      {modalType === 'createTeacher' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Register Faculty Member</h3>
            <p className="text-xs text-slate-400 mb-4">Provision verified teacher credentials</p>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Teacher ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCH205"
                    value={formData.teacherId || ''}
                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. S. Mehta"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  value={formData.department || 'Computer Science'}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Faculty Email *</label>
                <input
                  type="email"
                  required
                  placeholder="s.mehta@faculty.campuspulse.edu"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={formData.temporaryPassword || 'faculty123'}
                  onChange={e => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Club Leader */}
      {modalType === 'createClubLeader' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Appoint Club Leader</h3>
            <p className="text-xs text-slate-400 mb-4">Assign a verified student leader to a chartered campus club</p>

            <form onSubmit={handleCreateClubLeader} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Club Leader ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CLB301"
                    value={formData.clubLeaderId || ''}
                    onChange={e => setFormData({ ...formData, clubLeaderId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Aanya Kapoor"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned Chartered Club *</label>
                <select
                  value={formData.assignedClub || 'Coding Club'}
                  onChange={e => setFormData({ ...formData, assignedClub: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Coding Club">Coding Club</option>
                  <option value="Robotics Guild">Robotics Guild</option>
                  <option value="Design Collective">Design Collective</option>
                  <option value="Literary Society">Literary Society</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Permissions will be strictly isolated to this club
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Leader Email *</label>
                <input
                  type="email"
                  required
                  placeholder="aanya@clubs.campuspulse.edu"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={formData.temporaryPassword || 'club123'}
                  onChange={e => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-purple-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Appoint Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {modalType === 'resetPassword' && selectedTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set new temporary password for <strong>{selectedTarget.name}</strong> ({selectedTarget.studentId || selectedTarget.teacherId || selectedTarget.clubLeaderId})
            </p>

            <form onSubmit={handleResetStudentPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">New Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={formData.temporaryPassword || ''}
                  onChange={e => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono"
                />
                <span className="text-[10px] text-slate-500 block mt-1">User will be forced to change this on next login</span>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                >
                  Reset & Invalidate Old Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Admin Password */}
      {modalType === 'changeAdminPass' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Update Admin Password</h3>
            <p className="text-xs text-slate-400 mb-4">Set a new strong password for administrator ADM001</p>

            <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.currentPassword || ''}
                  onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">New Secure Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.newPassword || ''}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Update Master Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Broadcast Notice */}
      {modalType === 'createNotice' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Broadcast Campus Notice</h3>
            <p className="text-xs text-slate-400 mb-4">Official administrative announcement with verified seal</p>

            <form onSubmit={handleCreateNotice} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Semester Examination Schedule Published"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category || 'Administrative'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Administrative">Administrative</option>
                    <option value="Academic">Academic</option>
                    <option value="Exams">Exams</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={formData.urgency || 'normal'}
                    onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Content / Announcement Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter detailed notice content..."
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
