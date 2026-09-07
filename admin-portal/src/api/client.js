const API_BASE = "http://localhost:5000/api/v1";

export const adminStorage = {
  getToken: () => localStorage.getItem("cp_admin_token"),
  setToken: (token) => {
    if (token) localStorage.setItem("cp_admin_token", token);
    else localStorage.removeItem("cp_admin_token");
  },
  getUser: () => {
    try {
      const data = localStorage.getItem("cp_admin_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    if (user) localStorage.setItem("cp_admin_user", JSON.stringify(user));
    else localStorage.removeItem("cp_admin_user");
  },
  clear: () => {
    localStorage.removeItem("cp_admin_token");
    localStorage.removeItem("cp_admin_user");
  }
};

export async function adminApiRequest(endpoint, options = {}) {
  const token = adminStorage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: `Server returned HTTP ${res.status}`
  }));

  if (!res.ok) {
    if (res.status === 401) {
      adminStorage.clear();
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function adminLogin(userId, password) {
  const data = await adminApiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      userId,
      password,
      expectedPortal: "admin"
    })
  });

  if (data.data?.token) {
    adminStorage.setToken(data.data.token);
    adminStorage.setUser(data.data.user);
  }

  return data.data;
}

export async function adminChangePassword(currentPassword, newPassword) {
  const data = await adminApiRequest("/auth/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (data.data?.token) {
    adminStorage.setToken(data.data.token);
  }
  if (data.data?.user) {
    adminStorage.setUser(data.data.user);
  }

  return data.data;
}

export async function adminGetMe() {
  const data = await adminApiRequest("/auth/me");
  if (data.data) {
    adminStorage.setUser(data.data);
  }
  return data.data;
}

export function adminLogout() {
  adminStorage.clear();
  return adminApiRequest("/auth/logout", { method: "POST" }).catch(() => {});
}

// Admin API endpoints
export const adminApi = {
  getStats: () => adminApiRequest("/admin/stats"),
  
  // Students
  getStudents: (q = "") => adminApiRequest(`/admin/students?q=${encodeURIComponent(q)}`),
  createStudent: (data) => adminApiRequest("/admin/students", { method: "POST", body: JSON.stringify(data) }),
  toggleStudentStatus: (id) => adminApiRequest(`/admin/students/${id}/status`, { method: "PATCH" }),
  resetStudentPassword: (id, temporaryPassword) => adminApiRequest(`/admin/students/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify({ temporaryPassword })
  }),

  // Teachers
  getTeachers: (q = "") => adminApiRequest(`/admin/teachers?q=${encodeURIComponent(q)}`),
  createTeacher: (data) => adminApiRequest("/admin/teachers", { method: "POST", body: JSON.stringify(data) }),
  toggleTeacherStatus: (id) => adminApiRequest(`/admin/teachers/${id}/status`, { method: "PATCH" }),
  resetTeacherPassword: (id, temporaryPassword) => adminApiRequest(`/admin/teachers/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify({ temporaryPassword })
  }),

  // Club Leaders
  getClubLeaders: (q = "") => adminApiRequest(`/admin/club-leaders?q=${encodeURIComponent(q)}`),
  createClubLeader: (data) => adminApiRequest("/admin/club-leaders", { method: "POST", body: JSON.stringify(data) }),
  assignClub: (id, clubName) => adminApiRequest(`/admin/club-leaders/${id}/assign-club`, {
    method: "PATCH",
    body: JSON.stringify({ clubName })
  }),
  toggleClubLeaderStatus: (id) => adminApiRequest(`/admin/club-leaders/${id}/status`, { method: "PATCH" }),
  resetClubLeaderPassword: (id, temporaryPassword) => adminApiRequest(`/admin/club-leaders/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify({ temporaryPassword })
  }),

  // Notices & Events
  getNotices: () => adminApiRequest("/notices"),
  createNotice: (data) => adminApiRequest("/notices", { method: "POST", body: JSON.stringify(data) }),
  getEvents: () => adminApiRequest("/organizer/events"),
  boostEvent: (id) => adminApiRequest(`/organizer/events/${id}/boost`, { method: "PATCH" }),
  createEvent: (data) => adminApiRequest("/organizer/events", { method: "POST", body: JSON.stringify(data) }),

  // Defaulters Oversight
  getDefaulters: (dept = "") => adminApiRequest(`/defaulters/admin/all?department=${encodeURIComponent(dept)}`)
};

