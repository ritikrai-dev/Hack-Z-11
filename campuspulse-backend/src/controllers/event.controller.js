import * as XLSX from "xlsx";
import { success, failure } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";
import { sendNotificationAndSync } from "../services/notificationService.js";

// Ensure seed events have scopes and registrations
function ensureEventRegistrations(event) {
  if (!event.scope) {
    event.scope = event.category === "Hackathon" ? "INTER-COLLEGE" : "INTRA-COLLEGE";
  }
  if (!event.capacity) {
    event.capacity = 100;
  }
  if (!event.customFormFields && event.scope === "INTRA-COLLEGE") {
    event.customFormFields = [
      "Student ID / Roll No",
      "Department & Semester",
      "Prior Knowledge / Project Idea",
      "Emergency Contact"
    ];
  }
  if (!event.externalRegistrationLink && event.scope === "INTER-COLLEGE") {
    event.externalRegistrationLink = "https://unstop.com/hackathons/smart-campus-hackathon-2026";
  }
  if (!event.registrations) {
    event.registrations = [
      {
        ticketId: `TCK-${event.id.replace("evt_", "")}-9042`,
        studentId: "2023CS042",
        name: "Ritik Sharma",
        email: "ritik.sharma@campus.edu",
        college: "Campus Institute of Technology (In-House)",
        department: "Computer Science & Engineering",
        year: "3rd Year",
        phone: "+91 98765 43210",
        status: "Checked In",
        registeredAt: "2026-09-06T10:15:00Z",
        formData: {
          "Student ID / Roll No": "2023CS042",
          "Department & Semester": "CSE - Sem 5",
          "Prior Knowledge / Project Idea": "Built full-stack React & Node campus portal"
        }
      },
      {
        ticketId: `TCK-${event.id.replace("evt_", "")}-9043`,
        studentId: "2023EC088",
        name: "Aarav Gupta",
        email: "aarav.gupta@campus.edu",
        college: event.scope === "INTER-COLLEGE" ? "National Institute of Technology (NIT)" : "Campus Institute of Technology (In-House)",
        department: "Electronics & Communication",
        year: "3rd Year",
        phone: "+91 98123 45670",
        status: "Registered",
        registeredAt: "2026-09-06T14:30:00Z",
        formData: {
          "Student ID / Roll No": "2023EC088",
          "Department & Semester": "ECE - Sem 5",
          "Prior Knowledge / Project Idea": "Embedded firmware and microcontrollers"
        }
      },
      {
        ticketId: `TCK-${event.id.replace("evt_", "")}-9044`,
        studentId: "2024CS099",
        name: "Neha Patel",
        email: "neha.patel@campus.edu",
        college: "Campus Institute of Technology (In-House)",
        department: "Computer Science & Engineering",
        year: "2nd Year",
        phone: "+91 97890 12345",
        status: "Registered",
        registeredAt: "2026-09-07T08:45:00Z",
        formData: {
          "Student ID / Roll No": "2024CS099",
          "Department & Semester": "CSE - Sem 3",
          "Prior Knowledge / Project Idea": "UI/UX and frontend engineering"
        }
      }
    ];
  }
}

export async function list(req, res, next) {
  try {
    const { filter = "upcoming", search, category, scope } = req.query;
    let list = [...mockDatabase.events];

    list.forEach(ensureEventRegistrations);

    if (filter === "past") {
      list = list.filter(e => e.isPast);
    } else if (filter === "my_events") {
      list = list.filter(e => e.isRegistered);
    } else {
      list = list.filter(e => !e.isPast);
    }

    if (scope && scope !== "All") {
      list = list.filter(e => e.scope === scope);
    }

    if (category && category !== "All") {
      list = list.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.organizerClub && e.organizerClub.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    return success(res, "Events fetched successfully", {
      events: list,
      activeFilter: filter,
      total: list.length
    });
  } catch (e) {
    next(e);
  }
}

export async function getNearYou(req, res, next) {
  try {
    mockDatabase.events.forEach(ensureEventRegistrations);
    const nearEvents = mockDatabase.events.filter(e => e.liveCheckIns > 0 || e.isLive);
    return success(res, "Nearby & live events fetched successfully", {
      events: nearEvents.length > 0 ? nearEvents : mockDatabase.events.slice(0, 2)
    });
  } catch (e) {
    next(e);
  }
}

export async function getRecommended(req, res, next) {
  try {
    mockDatabase.events.forEach(ensureEventRegistrations);
    const recommended = mockDatabase.events.filter(e => !e.isPast);
    return success(res, "Recommended events fetched successfully", {
      events: recommended
    });
  } catch (e) {
    next(e);
  }
}

export async function details(req, res, next) {
  try {
    const { id } = req.params;
    let event = mockDatabase.events.find(e => e.id === id) || mockDatabase.events[0];
    ensureEventRegistrations(event);
    return success(res, "Event fetched successfully", { event });
  } catch (e) {
    next(e);
  }
}

export async function register(req, res, next) {
  try {
    const { id } = req.params;
    let event = mockDatabase.events.find(e => e.id === id);
    if (!event) {
      return failure(res, "Event not found", 404);
    }
    ensureEventRegistrations(event);

    const studentId = req.user?.studentId || req.body.studentId || "2023CS042";
    const studentName = req.user?.name || req.body.name || "Student Participant";
    const studentEmail = req.user?.email || req.body.email || "student@campus.edu";
    const ticketId = `TCK-${Date.now().toString().slice(-6)}`;

    // In-House vs Inter-College college label
    const college = req.body.college || (event.scope === "INTER-COLLEGE" ? (req.body.collegeName || "Outside College") : "Campus Institute of Technology (In-House)");

    const newRegistration = {
      ticketId,
      studentId,
      name: studentName,
      email: studentEmail,
      college,
      department: req.body.department || req.user?.department || "Computer Science",
      year: req.body.year || req.user?.year || "3rd Year",
      phone: req.body.phone || req.user?.phone || "+91 98765 43210",
      status: "Registered",
      registeredAt: new Date().toISOString(),
      formData: req.body.formData || {}
    };

    if (!event.registrations) event.registrations = [];
    // Prevent duplicate registration for the same student
    const existingIndex = event.registrations.findIndex(r => r.studentId === studentId);
    if (existingIndex === -1) {
      event.registrations.unshift(newRegistration);
      event.rsvps = (event.rsvps || 0) + 1;
    }

    event.isRegistered = true;

    const ticket = {
      ticketId,
      eventId: id,
      studentId,
      studentName,
      college,
      qrPayload: `CAMPUSPULSE:EVT:${id}:USER:${studentId}:${Date.now()}`,
      issuedAt: new Date().toISOString(),
      status: "VALID"
    };

    return success(res, "Successfully registered for event", { event, ticket, registration: newRegistration }, 201);
  } catch (e) {
    next(e);
  }
}

export async function unregister(req, res, next) {
  try {
    const { id } = req.params;
    const event = mockDatabase.events.find(e => e.id === id);
    if (event) {
      event.isRegistered = false;
      event.rsvps = Math.max(0, (event.rsvps || 1) - 1);
      if (event.registrations) {
        const studentId = req.user?.studentId || "2023CS042";
        event.registrations = event.registrations.filter(r => r.studentId !== studentId);
      }
    }
    return success(res, "Event registration cancelled", { eventId: id, isRegistered: false });
  } catch (e) {
    next(e);
  }
}

export async function getTicketQR(req, res, next) {
  try {
    const { id } = req.params;
    const event = mockDatabase.events.find(e => e.id === id) || mockDatabase.events[0];
    ensureEventRegistrations(event);
    const ticketData = {
      ticketId: `TCK-${event.id.replace("evt_", "")}-9042`,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      venue: event.location,
      holderName: req.user?.name || "Ritik Sharma",
      holderStudentId: req.user?.studentId || "2023CS042",
      qrToken: `CP-VALID-${event.id}-${req.user?.studentId || "2023CS042"}-SECURE`,
      gateStatus: "READY_FOR_SCAN",
      scanTimestamp: null
    };

    return success(res, "Ticket QR retrieved successfully", { ticket: ticketData });
  } catch (e) {
    next(e);
  }
}

export async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment?.trim()) return failure(res, "Comment text is required", 400);

    const event = mockDatabase.events.find(e => e.id === id) || mockDatabase.events[0];
    const newComment = {
      id: `c_${Date.now()}`,
      user: req.user?.name || "Ritik Sharma",
      avatar: req.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      comment: comment.trim(),
      time: "Just now"
    };

    if (!event.discussion) event.discussion = [];
    event.discussion.push(newComment);

    return success(res, "Comment added to discussion thread", { comment: newComment }, 201);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const scope = req.body.scope === "INTER-COLLEGE" ? "INTER-COLLEGE" : "INTRA-COLLEGE";
    const newEvent = {
      id: `evt_${Date.now()}`,
      title: req.body.title || "New Campus Event",
      organizerClub: req.body.organizer || req.user?.name || "Faculty Coordinator",
      organizerId: req.user?.sub || req.user?.studentId || req.user?.id,
      clubLogo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=200&q=80",
      bannerImage: req.body.bannerImage || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
      date: req.body.date || "Next Week",
      ticketDate: "15 SEP",
      ticketDay: "TUE",
      time: req.body.time || "4:00 PM - 6:00 PM",
      location: req.body.venue || req.body.location || "Campus Hall",
      status: "Registration Open",
      statusColor: "#10B981",
      statusIcon: "check-circle",
      category: req.body.category || "General",
      scope,
      capacity: Number(req.body.capacity) || 100,
      customFormFields: scope === "INTRA-COLLEGE" ? (req.body.customFormFields || ["Student ID", "Department", "Year", "Contact Number"]) : null,
      externalRegistrationLink: scope === "INTER-COLLEGE" ? (req.body.externalRegistrationLink || "https://unstop.com") : null,
      isPast: false,
      isRegistered: false,
      isLive: false,
      liveCheckIns: 0,
      whyThis: "Newly published event from campus faculty/organizers",
      views: 1,
      rsvps: 0,
      description: req.body.description || "Official campus event.",
      schedule: req.body.schedule || [
        { time: "04:00 PM", title: "Registration & Welcome", speaker: "Host" }
      ],
      gallery: [],
      discussion: [],
      registrations: []
    };

    mockDatabase.events.unshift(newEvent);

    if (mockDatabase.organizerStats?.managedEvents) {
      mockDatabase.organizerStats.managedEvents.unshift({
        id: newEvent.id,
        title: newEvent.title,
        date: newEvent.date,
        venue: newEvent.location,
        rsvps: 0,
        capacity: newEvent.capacity,
        scope: newEvent.scope,
        views: 1,
        boosted: false,
        trend: [1]
      });
    }

    // Real-Time Sync & Notification Dispatch
    sendNotificationAndSync({
      sender: {
        role: req.user?.role || "ORGANIZER",
        name: newEvent.organizerClub
      },
      target: {
        type: "ALL"
      },
      payload: {
        type: "event:created",
        title: `🎉 New Event: ${newEvent.title}`,
        message: `${newEvent.organizerClub} announced: ${newEvent.title} on ${newEvent.date} at ${newEvent.location}. RSVP now!`,
        data: newEvent,
        metadata: {
          eventId: newEvent.id,
          scope: newEvent.scope,
          category: newEvent.category,
          date: newEvent.date
        }
      }
    }).catch((err) => console.warn("Event notification error:", err?.message));

    return success(res, "Event created successfully", { event: newEvent }, 201);
  } catch (e) {
    next(e);
  }
}

// List registrations for an event (Teachers & Admins)
export async function listRegistrations(req, res, next) {
  try {
    const { id } = req.params;
    const event = mockDatabase.events.find(e => e.id === id);
    if (!event) {
      return failure(res, "Event not found", 404);
    }
    ensureEventRegistrations(event);

    return success(res, "Event registrations retrieved successfully", {
      eventId: event.id,
      eventTitle: event.title,
      scope: event.scope,
      capacity: event.capacity,
      rsvps: event.registrations.length,
      registrations: event.registrations
    });
  } catch (e) {
    next(e);
  }
}

// Export registrations to Excel (.xlsx) or JSON
export async function exportRegistrations(req, res, next) {
  try {
    const { id } = req.params;
    const { format = "xlsx" } = req.query;

    const event = mockDatabase.events.find(e => e.id === id);
    if (!event) {
      return failure(res, "Event not found", 404);
    }
    ensureEventRegistrations(event);

    const registrations = event.registrations || [];

    if (format.toLowerCase() === "json") {
      res.setHeader("Content-Disposition", `attachment; filename="registrations_${id}.json"`);
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        scope: event.scope,
        capacity: event.capacity,
        totalRegistered: registrations.length,
        exportedAt: new Date().toISOString(),
        attendees: registrations
      }, null, 2));
    }

    // Default: Excel (.xlsx) via SheetJS
    const rows = registrations.map((reg, idx) => ({
      "S.No": idx + 1,
      "Ticket ID": reg.ticketId,
      "Full Name": reg.name,
      "Student / User ID": reg.studentId,
      "Email": reg.email,
      "College / Institution": reg.college,
      "Department": reg.department,
      "Year of Study": reg.year,
      "Phone": reg.phone,
      "Status": reg.status,
      "Registration Date": new Date(reg.registeredAt).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
      { "S.No": "-", "Ticket ID": "-", "Full Name": "No attendees registered yet", "Email": "-", "College": "-" }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename="registrations_${id}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);

  } catch (e) {
    next(e);
  }
}
