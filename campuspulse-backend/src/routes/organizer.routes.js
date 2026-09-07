import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { mockDatabase } from "../services/mockData.js";
import { supabase } from "../config/supabase.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate, authorize("ADMIN", "TEACHER", "CLUB_LEADER"));


// 1. Organizer Dashboard Stats with 7-Day Sparklines & Overview Metrics
router.get("/dashboard/stats", (req, res) => {
  const activeEvents = mockDatabase.events.filter(e => !e.isPast);
  const totalRegistrations = mockDatabase.events.reduce((sum, e) => sum + (e.registrations?.length || e.rsvps || 0), 0);
  const noticesCount = mockDatabase.notices.length;
  const managedEventsCount = (mockDatabase.organizerStats.managedEvents || []).length;

  const data = {
    ...mockDatabase.organizerStats,
    overviewMetrics: {
      myEvents: managedEventsCount || 6,
      activeEvents: activeEvents.length || 4,
      totalRegistrations: totalRegistrations || 380,
      myNotices: noticesCount || 8
    }
  };
  return success(res, "Organizer stats fetched successfully", data);
});

// Student Directory for Faculty (Search & Filter by Dept, Year, Division)
router.get("/students", async (req, res) => {
  const { search, department, year, division } = req.query;

  try {
    const { data: supaStudents, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "STUDENT");

    if (!error && supaStudents && supaStudents.length > 0) {
      let mapped = supaStudents.map(s => ({
        id: s.id,
        studentId: s.student_id || s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department_id || "Computer Science",
        year: s.academic_year || "3rd Year",
        division: s.division || "A",
        phone: s.phone || "+91 98765 43210",
        avatar: s.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
        isActive: s.is_active !== false
      }));

      if (department && department !== "All") {
        mapped = mapped.filter(s => s.department?.toLowerCase().includes(department.toLowerCase()));
      }
      if (year && year !== "All") {
        mapped = mapped.filter(s => s.year?.toLowerCase().includes(year.toLowerCase()));
      }
      if (division && division !== "All") {
        mapped = mapped.filter(s => s.division?.toLowerCase() === division.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        mapped = mapped.filter(s =>
          s.name?.toLowerCase().includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
        );
      }
      return success(res, "Students fetched successfully", { students: mapped, total: mapped.length });
    }
  } catch {
    // Fallback to in-memory mockDatabase
  }

  let list = [
    { id: "s1", studentId: "2023CS042", name: "Ritik Sharma", email: "ritik.sharma@campus.edu", department: "Computer Science", year: "3rd Year", division: "A", phone: "+91 98765 43210", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", isActive: true },
    { id: "s2", studentId: "2023CS019", name: "Kabir Verma", email: "kabir.verma@campus.edu", department: "Computer Science", year: "3rd Year", division: "B", phone: "+91 98765 43211", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", isActive: true },
    { id: "s3", studentId: "2023EC088", name: "Aarav Gupta", email: "aarav.gupta@campus.edu", department: "Electronics", year: "3rd Year", division: "A", phone: "+91 98765 43212", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", isActive: true },
    { id: "s4", studentId: "2024CS099", name: "Neha Patel", email: "neha.patel@campus.edu", department: "Computer Science", year: "2nd Year", division: "A", phone: "+91 98765 43213", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", isActive: true },
    { id: "s5", studentId: "2024ME014", name: "Ananya Roy", email: "ananya.roy@campus.edu", department: "Mechanical", year: "2nd Year", division: "C", phone: "+91 98765 43214", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", isActive: true },
    { id: "s6", studentId: "2025IT005", name: "Devansh Mehta", email: "devansh.m@campus.edu", department: "Information Tech", year: "1st Year", division: "B", phone: "+91 98765 43215", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80", isActive: true }
  ];

  if (department && department !== "All") {
    list = list.filter(s => s.department?.toLowerCase().includes(department.toLowerCase()));
  }
  if (year && year !== "All") {
    list = list.filter(s => s.year?.toLowerCase().includes(year.toLowerCase()));
  }
  if (division && division !== "All") {
    list = list.filter(s => s.division?.toLowerCase() === division.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  }

  return success(res, "Students fetched successfully", { students: list, total: list.length });
});

// 2. AI Insight Card (Standout Feature with Soft Glow Border)
router.get("/ai-insight", (req, res) => {
  return success(res, "AI insight fetched successfully", {
    insight: mockDatabase.organizerStats.aiInsight
  });
});

// 3. Managed Events List
router.get("/events", (req, res) => {
  return success(res, "Managed events fetched successfully", {
    events: mockDatabase.organizerStats.managedEvents,
    totalManaged: mockDatabase.organizerStats.managedEvents.length
  });
});

// 4. Create / Publish New Event (Organizer Operations)
router.post("/events", (req, res) => {
  const { title, date, location, venue, capacity, category, description, scope, customFormFields, externalRegistrationLink } = req.body;
  if (!title?.trim()) {
    return failure(res, "Event title is required", 400);
  }

  const eventScope = scope === "INTER-COLLEGE" ? "INTER-COLLEGE" : "INTRA-COLLEGE";
  const newEventId = `evt_${Date.now()}`;
  const newEvent = {
    id: newEventId,
    title: title.trim(),
    organizerClub: req.user?.department || req.user?.assignedClub || req.user?.name || "Faculty Coordinator",
    organizerId: req.user?.sub || req.user?.studentId || req.user?.id,
    clubLogo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=200&q=80",
    bannerImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
    date: date || "Upcoming, Fall 2026",
    ticketDate: "24 SEP",
    ticketDay: "THU",
    time: req.body.time || "3:00 PM - 5:00 PM",
    location: venue || location || "Campus Auditorium",
    status: "Registration Open",
    statusColor: "#10B981",
    statusIcon: "check-circle",
    category: category || "Tech",
    scope: eventScope,
    customFormFields: eventScope === "INTRA-COLLEGE" ? (customFormFields || ["Student ID", "Department", "Year"]) : null,
    externalRegistrationLink: eventScope === "INTER-COLLEGE" ? (externalRegistrationLink || "https://unstop.com") : null,
    isPast: false,
    isRegistered: false,
    isLive: false,
    liveCheckIns: 0,
    whyThis: "Newly published event from campus organizer intelligence",
    views: 1,
    rsvps: 0,
    capacity: Number(capacity) || 100,
    description: description || "Exciting campus event published via Organizer Intelligence Dashboard.",
    schedule: [
      { time: "03:00 PM", title: "Keynote & Problem Briefing", speaker: "Club Leads" }
    ],
    gallery: [],
    discussion: [],
    registrations: []
  };

  const managedEntry = {
    id: newEventId,
    title: newEvent.title,
    date: newEvent.date,
    venue: newEvent.location,
    rsvps: 0,
    capacity: Number(capacity) || 100,
    scope: eventScope,
    views: 1,
    boosted: false,
    trend: [1, 2, 4, 8, 12]
  };

  // Add analytics snapshot
  mockDatabase.organizerStats.analytics[newEventId] = {
    viewsOverTime: [
      { day: "Day 1", views: 1 },
      { day: "Day 2", views: 12 },
      { day: "Day 3", views: 28 },
      { day: "Day 4", views: 65 }
    ],
    funnel: [
      { stage: "Viewed", count: 65, percentage: 100, color: "#2D5BFF" },
      { stage: "RSVP'd", count: 18, percentage: 27.7, color: "#0F766E" },
      { stage: "Attended", count: 0, percentage: 0, color: "#10B981" }
    ],
    departmentBreakdown: [
      { department: "Computer Science", count: 10, percentage: 55, color: "#2D5BFF" },
      { department: "Electronics", count: 5, percentage: 28, color: "#0F766E" },
      { department: "Others", count: 3, percentage: 17, color: "#F59E0B" }
    ]
  };

  mockDatabase.events.unshift(newEvent);
  mockDatabase.organizerStats.managedEvents.unshift(managedEntry);

  return success(res, "Event published and broadcast to student feeds", {
    event: newEvent,
    managedEvent: managedEntry
  }, 201);
});

// 5. Update Managed Event
router.put("/events/:id", (req, res) => {
  const { id } = req.params;
  const managed = mockDatabase.organizerStats.managedEvents.find(e => e.id === id);
  const event = mockDatabase.events.find(e => e.id === id);

  if (!managed && !event) {
    return failure(res, "Managed event not found", 404);
  }

  if (managed) {
    if (req.body.title) managed.title = req.body.title;
    if (req.body.capacity) managed.capacity = Number(req.body.capacity);
    if (req.body.date) managed.date = req.body.date;
  }
  if (event) {
    if (req.body.title) event.title = req.body.title;
    if (req.body.date) event.date = req.body.date;
    if (req.body.location) event.location = req.body.location;
    if (req.body.description) event.description = req.body.description;
  }

  return success(res, "Managed event updated successfully", {
    managedEvent: managed,
    event
  });
});

// 6. Delete / Archive Managed Event
router.delete("/events/:id", (req, res) => {
  const { id } = req.params;
  const mIndex = mockDatabase.organizerStats.managedEvents.findIndex(e => e.id === id);
  if (mIndex !== -1) {
    mockDatabase.organizerStats.managedEvents.splice(mIndex, 1);
  }
  const eIndex = mockDatabase.events.findIndex(e => e.id === id);
  if (eIndex !== -1) {
    mockDatabase.events.splice(eIndex, 1);
  }

  return success(res, "Event archived from organizer dashboard", { eventId: id });
});

// 7. Event Detailed Analytics (Line chart, Funnel, Donut)
router.get("/events/:id/analytics", (req, res) => {
  const { id } = req.params;
  const analyticsData = mockDatabase.organizerStats.analytics[id] || mockDatabase.organizerStats.analytics.evt_1;
  const event = mockDatabase.events.find(e => e.id === id) || mockDatabase.events[0];

  return success(res, "Event analytics fetched successfully", {
    eventId: id,
    eventTitle: event.title,
    analytics: analyticsData
  });
});

// 8. Boost Event Visibility in Personalized Feeds (+60% reach)
router.patch("/events/:id/boost", (req, res) => {
  const { id } = req.params;
  const event = mockDatabase.organizerStats.managedEvents.find(e => e.id === id);
  let boosted = true;
  if (event) {
    event.boosted = !event.boosted;
    boosted = event.boosted;
  }
  return success(res, boosted ? "Event visibility boosted by +60% in campus feeds" : "Visibility boost deactivated", {
    eventId: id,
    boosted
  });
});

// 9. Export Event Performance Report
router.get("/events/:id/export-report", (req, res) => {
  const { id } = req.params;
  const event = mockDatabase.events.find(e => e.id === id) || mockDatabase.events[0];
  const report = {
    reportId: `REP-${id}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    event: {
      id: event.id,
      title: event.title,
      organizer: event.organizerClub,
      date: event.date,
      venue: event.location
    },
    metrics: {
      totalViews: event.views || 1420,
      rsvps: event.rsvps || 380,
      attended: 319,
      attendanceRate: "83.9%",
      conversionRate: "26.7%"
    },
    exportUrl: `/api/v1/reports/download/${id}.pdf`
  };
  return success(res, "Event performance report generated", { report });
});

// 10. Attendee Roster
router.get("/events/:id/roster", (req, res) => {
  const { id } = req.params;
  const roster = [
    { studentId: "2023CS042", name: "Riya Sharma", department: "CS", ticketId: "TCK-863149", checkedIn: true, time: "2:05 PM" },
    { studentId: "2023CS019", name: "Kabir Verma", department: "CS", ticketId: "TCK-863150", checkedIn: true, time: "2:10 PM" },
    { studentId: "2023EC088", name: "Aarav Gupta", department: "ECE", ticketId: "TCK-863151", checkedIn: false, time: null },
    { studentId: "2023ME014", name: "Ananya Roy", department: "Mech", ticketId: "TCK-863152", checkedIn: false, time: null }
  ];
  return success(res, "Attendee roster retrieved", { eventId: id, attendees: roster, count: roster.length });
});

// 11. Live Attendee Check-In (Entry QR Scan)
router.post("/events/:id/checkin", (req, res) => {
  const { id } = req.params;
  const { ticketId, studentId } = req.body;

  const event = mockDatabase.events.find(e => e.id === id);
  if (event) {
    event.liveCheckIns = (event.liveCheckIns || 0) + 1;
  }

  return success(res, "Attendee checked in successfully", {
    eventId: id,
    studentId: studentId || "2023CS042",
    ticketId: ticketId || "TCK-863149",
    status: "CHECKED_IN",
    timestamp: new Date().toISOString()
  });
});

export default router;
