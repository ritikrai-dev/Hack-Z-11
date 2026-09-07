const API_BASE = "http://localhost:5000/api/v1";

export const authStorage = {
  getToken: () => localStorage.getItem("cp_student_token"),
  setToken: (token) => {
    if (token) localStorage.setItem("cp_student_token", token);
    else localStorage.removeItem("cp_student_token");
  },
  getUser: () => {
    try {
      const data = localStorage.getItem("cp_student_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    if (user) localStorage.setItem("cp_student_user", JSON.stringify(user));
    else localStorage.removeItem("cp_student_user");
  },
  clear: () => {
    localStorage.removeItem("cp_student_token");
    localStorage.removeItem("cp_student_user");
  }
};

export async function apiRequest(endpoint, options = {}) {
  const token = authStorage.getToken();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
      authStorage.clear();
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export async function login(userId, password, expectedRole = null) {
  const body = {
    userId,
    password,
    expectedPortal: "student-staff"
  };
  if (expectedRole) {
    body.expectedRole = expectedRole;
  }

  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });

  if (data.data?.token) {
    authStorage.setToken(data.data.token);
    authStorage.setUser(data.data.user);
  }

  return data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const data = await apiRequest("/auth/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword })
  });

  if (data.data?.token) {
    authStorage.setToken(data.data.token);
  }
  if (data.data?.user) {
    authStorage.setUser(data.data.user);
  }

  return data.data;
}

export async function getMe() {
  const data = await apiRequest("/auth/me");
  if (data.data) {
    authStorage.setUser(data.data);
  }
  return data.data;
}

export function logout() {
  authStorage.clear();
  return apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
}

// Student & Staff API methods
export const portalApi = {
  // Notices
  getNotices: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/notices${q ? '?' + q : ''}`);
  },
  getUrgentStories: () => apiRequest("/notices/stories/urgent"),
  toggleBookmark: (id) => apiRequest(`/notices/${id}/bookmark`, { method: "PATCH" }),
  toggleReminder: (id) => apiRequest(`/notices/${id}/reminder`, { method: "PATCH" }),
  createNotice: (data) => apiRequest("/notices", { method: "POST", body: JSON.stringify(data) }),

  // File Upload (Drag-and-Drop)
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/files/upload", {
      method: "POST",
      body: formData
    });
  },

  // Events
  getEvents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/events${q ? '?' + q : ''}`);
  },
  getNearYouEvents: () => apiRequest("/events/near-you"),
  getRecommendedEvents: () => apiRequest("/events/recommended"),
  getEvent: (id) => apiRequest(`/events/${id}`),
  registerEvent: (id, data = {}) => apiRequest(`/events/${id}/register`, {
    method: "POST",
    body: JSON.stringify(data)
  }),
  unregisterEvent: (id) => apiRequest(`/events/${id}/register`, { method: "DELETE" }),
  getTicketQR: (id) => apiRequest(`/events/${id}/ticket-qr`),

  // Event Registrations & Export
  getEventRegistrations: (id) => apiRequest(`/events/${id}/registrations`),
  getExportUrl: (id, format = "xlsx") => `${API_BASE}/events/${id}/registrations/export?format=${format}`,

  // Organizer / Teacher / Club Leader Operations
  getOrganizerStats: () => apiRequest("/organizer/dashboard/stats"),
  getManagedEvents: () => apiRequest("/organizer/events"),
  createManagedEvent: (data) => apiRequest("/organizer/events", { method: "POST", body: JSON.stringify(data) }),
  getRoster: (id) => apiRequest(`/organizer/events/${id}/roster`),
  checkInAttendee: (eventId, ticketId) => apiRequest(`/organizer/events/${eventId}/checkin`, {
    method: "POST",
    body: JSON.stringify({ ticketId })
  }),

  // Timetable & Schedule
  getTimetable: () => apiRequest("/schedule/timetable"),
  getConflicts: () => apiRequest("/schedule/conflicts"),
  resolveConflict: (conflictId, keep) => apiRequest("/schedule/conflicts/resolve", {
    method: "POST",
    body: JSON.stringify({ conflictId, keep })
  }),

  // AI Campus Assistant
  askAssistant: (query) => apiRequest("/ai/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ query })
  })
};

export { API_BASE };
