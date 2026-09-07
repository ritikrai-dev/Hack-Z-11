// CampusPulse In-Memory Seed Repository
// Provides high-fidelity data matching the Smart Campus App master prompt specifications

export const mockDatabase = {
  // Role-Based User Accounts (Pre-provisioned by Admin)
  users: [
    {
      id: "usr_admin_01",
      studentId: "ADM001",
      name: "CampusPulse Administrator",
      email: "admin@campuspulse.edu",
      role: "ADMIN",
      department: "Administration",
      password: "admin123",
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-08-01T09:00:00Z"
    },
    {
      id: "usr_student_01",
      studentId: "2023CS042",
      name: "Ritik Sharma",
      email: "ritik.sharma@campus.edu",
      role: "STUDENT",
      department: "Computer Science & Engineering",
      year: "3rd Year",
      division: "A",
      phone: "+91 98765 43210",
      password: "student123",
      isActive: true,
      mustChangePassword: false,
      profileCompleteness: 85,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      interests: ["Tech & AI", "Robotics", "Hackathons", "Design Systems"],
      preferences: {
        notifications: { urgentAlerts: true, eventReminders: true, clubUpdates: true, departmentNotices: true }
      },
      createdAt: "2026-08-10T10:00:00Z"
    },
    {
      id: "usr_student_02",
      studentId: "2024CS099",
      name: "Aarav Patel",
      email: "aarav.patel@campus.edu",
      role: "STUDENT",
      department: "Computer Science & Engineering",
      year: "1st Year",
      division: "B",
      phone: "+91 98123 45678",
      password: "tempPass123!",
      isActive: true,
      mustChangePassword: true, // First login test
      profileCompleteness: 50,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      interests: ["Tech & AI"],
      createdAt: "2026-09-01T11:00:00Z"
    },
    {
      id: "usr_teacher_01",
      studentId: "TCH101",
      name: "Dr. Arvind Rao",
      email: "arvind.rao@campus.edu",
      role: "TEACHER",
      department: "Computer Science & Engineering",
      phone: "+91 94321 09876",
      password: "teacher123",
      isActive: true,
      mustChangePassword: false,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      createdAt: "2026-07-15T08:30:00Z"
    },
    {
      id: "usr_club_01",
      studentId: "CLB201",
      name: "Karan Johal",
      email: "karan.johal@campus.edu",
      role: "CLUB_LEADER",
      assignedClub: "Coding Club",
      clubCode: "CODING_CLUB",
      department: "Computer Science & Engineering",
      phone: "+91 91234 56780",
      password: "club123",
      isActive: true,
      mustChangePassword: false,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      createdAt: "2026-08-20T12:00:00Z"
    }
  ],

  clubs: [
    { id: "club_1", name: "Coding Club", code: "CODING_CLUB", category: "Tech", leaderId: "CLB201", description: "Official Competitive Programming & Web Dev Guild." },
    { id: "club_2", name: "Robotics Guild", code: "ROBOTICS_GUILD", category: "Hardware", leaderId: "CLB202", description: "Hands-on robotics, microcontrollers, and IoT." },
    { id: "club_3", name: "Design Collective", code: "DESIGN_CLUB", category: "Design", leaderId: "CLB203", description: "UI/UX, visual design, and creative media." }
  ],

  currentUser: {
    id: "usr_student_01",
    studentId: "2023CS042",
    name: "Ritik Sharma",
    email: "ritik.sharma@campus.edu",
    department: "Computer Science & Engineering",
    year: "3rd Year • Sem 5",
    profileCompleteness: 80,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    role: "STUDENT",
    interests: ["Artificial Intelligence", "Robotics", "Hackathons", "Design Systems", "Competitive Programming"],
    preferences: {
      notifications: {
        urgentAlerts: true,
        eventReminders: true,
        clubUpdates: true,
        departmentNotices: true,
        sound: true
      },
      theme: "light",
      smartSortEnabled: true
    }
  },

  urgentStories: [
    {
      id: "story_1",
      title: "Mid-sem Exams Rescheduled",
      dept: "CS Dept",
      ringType: "urgent", // orange-red conic gradient
      badge: "URGENT",
      gradient: ["#EF4444", "#F59E0B"],
      avatar: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=200&q=80",
      expiresIn: "Expires in 2 hrs",
      summary: "Mid-semester exams pushed by 3 days due to festival conflict. New schedule starts Monday.",
      actionText: "View Datesheet",
      targetNoticeId: "notice_1"
    },
    {
      id: "story_2",
      title: "Campus Wi-Fi Maintenance",
      dept: "IT Services",
      ringType: "normal", // blue
      badge: "ALERT",
      gradient: ["#2D5BFF", "#06B6D4"],
      avatar: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80",
      expiresIn: "Today 11 PM",
      summary: "Hostel Wi-Fi will undergo maintenance tonight from 11 PM to 2 AM. Edge nodes unaffected.",
      actionText: "Details",
      targetNoticeId: "notice_4"
    },
    {
      id: "story_3",
      title: "Hackathon Registration Closes",
      dept: "GDSC Club",
      ringType: "urgent", // orange-red
      badge: "CLOSING",
      gradient: ["#F59E0B", "#EF4444"],
      avatar: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=200&q=80",
      expiresIn: "4 hours left",
      summary: "Only 12 team slots left for Smart Campus Hackathon 2026. Register before 6 PM.",
      actionText: "Register Team",
      targetNoticeId: "notice_2"
    },
    {
      id: "story_4",
      title: "24/7 Library Hours",
      dept: "Library Board",
      ringType: "expiring", // gray dashed
      badge: "INFO",
      gradient: ["#6B7280", "#9CA3AF"],
      avatar: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80",
      expiresIn: "Active",
      summary: "Central Library reading rooms are now open 24/7 with ID card tap for final revisions.",
      actionText: "Read Policy",
      targetNoticeId: "notice_5"
    }
  ],

  conflictBanner: {
    id: "clash_01",
    active: true,
    title: "⚠️ 2 events you follow clash today at 3 PM — tap to resolve",
    subtitle: "Robotics Workshop vs Guest Lecture overlap",
    events: [
      {
        id: "evt_robotics",
        title: "Robotics Workshop",
        time: "2:00 PM - 4:00 PM",
        venue: "Lab 402, Block C",
        registeredCount: 140,
        club: "Robotics Club",
        color: "#2D5BFF"
      },
      {
        id: "evt_guest",
        title: "Guest Lecture: AI & Quantum",
        time: "3:00 PM - 4:00 PM",
        venue: "Auditorium A",
        registeredCount: 210,
        club: "IEEE Student Branch",
        color: "#0F766E"
      }
    ],
    attendanceImpact: "87 others also registered for both",
    resolutionOptions: [
      { id: "keep_robotics", label: "Keep Robotics" },
      { id: "keep_lecture", label: "Keep Lecture" },
      { id: "notify_alternate", label: "Notify me of alternate slot" }
    ],
    resolvedAction: null
  },

  notices: [
    {
      id: "notice_1",
      title: "Mid-Sem Exams Rescheduled by 3 Days",
      category: "Academic",
      categoryColor: "#2D5BFF",
      urgency: "high",
      urgentPulse: true,
      department: "Official CS Dept",
      verified: true,
      verifiedTooltip: "Posted by Official CS Dept",
      aiSummary: "TL;DR: Mid-sem exams pushed by 3 days due to holiday clash",
      fullAiSummary: "Quick summary: Mid-sem exams pushed by 3 days due to holiday clash. Examinations now commence next Monday. All project submissions are likewise granted an automatic 72-hour grace period.",
      deadline: "2026-09-15T10:00:00Z",
      deadlineDaysLeft: 3,
      deadlineProgress: 0.75,
      views: 1420,
      saves: 184,
      bookmarked: false,
      reminderSet: true,
      relevanceScore: 98,
      postedAt: "2 hours ago",
      content: `Please note that in accordance with the Academic Council resolution and state festival observances, all Mid-Semester Examinations previously scheduled for Thursday have been rescheduled by 3 days.

Key highlights:
• Exams will now commence from Monday, 10:00 AM.
• Venue allotments remain identical to your admit cards.
• Lab submissions for CS301, CS304, and CS308 are extended until Friday 5:00 PM.
• Digital hall tickets will reflect updated timestamps automatically on your portal.`,
      attachments: [
        { name: "Revised_MidSem_Datesheet_Fall2026.pdf", size: "1.2 MB", type: "pdf" },
        { name: "Hall_Ticket_Notice.pdf", size: "450 KB", type: "pdf" }
      ],
      relatedIds: ["notice_2", "notice_3"]
    },
    {
      id: "notice_2",
      title: "Smart Campus Hackathon 2026: Team Final Call",
      category: "Clubs",
      categoryColor: "#8B5CF6",
      urgency: "high",
      urgentPulse: true,
      department: "GDSC Campus Chapter",
      verified: true,
      verifiedTooltip: "Posted by GDSC Official",
      aiSummary: "TL;DR: Hackathon registrations end tonight; $5K prize pool",
      fullAiSummary: "Quick summary: 36-hour hackathon focusing on IoT, campus intelligence, and sustainability. Registration caps at 80 teams; final 12 slots remaining.",
      deadline: "2026-09-10T18:00:00Z",
      deadlineDaysLeft: 1,
      deadlineProgress: 0.90,
      views: 980,
      saves: 120,
      bookmarked: true,
      reminderSet: false,
      relevanceScore: 95,
      postedAt: "5 hours ago",
      content: `The annual Smart Campus Hackathon is back! Build innovative solutions for campus energy optimization, student collaboration, and security.

Prizes include $5,000 cash, incubation support at the Campus Innovation Hub, and fast-track interviews with sponsor partners.`,
      attachments: [
        { name: "Hackathon_Rulebook_2026.pdf", size: "2.4 MB", type: "pdf" }
      ],
      relatedIds: ["notice_1", "notice_5"]
    },
    {
      id: "notice_3",
      title: "Amazon & Microsoft Campus Drive Orientation",
      category: "Placement",
      categoryColor: "#10B981",
      urgency: "normal",
      urgentPulse: false,
      department: "Training & Placement Cell",
      verified: true,
      verifiedTooltip: "Posted by Central T&P Cell",
      aiSummary: "TL;DR: Mandatory pre-placement session this Friday at 4 PM",
      fullAiSummary: "Quick summary: Orientation session outlining eligibility criteria, online assessment syllabus, and resume submission deadlines for upcoming tier-1 tech hiring.",
      deadline: "2026-09-18T16:00:00Z",
      deadlineDaysLeft: 9,
      deadlineProgress: 0.40,
      views: 2150,
      saves: 430,
      bookmarked: true,
      reminderSet: true,
      relevanceScore: 92,
      postedAt: "1 day ago",
      content: `The Training and Placement Cell invites all eligible 3rd and 4th-year engineering students for the pre-placement orientation. Representatives from tech talent acquisition will share expectations, coding test patterns, and behavioral interview tips.`,
      attachments: [
        { name: "Placement_Guidelines_2026.pdf", size: "850 KB", type: "pdf" }
      ],
      relatedIds: ["notice_1", "notice_4"]
    },
    {
      id: "notice_4",
      title: "Core Infrastructure: Scheduled Data Center Upgrade",
      category: "Administrative",
      categoryColor: "#0F766E",
      urgency: "normal",
      urgentPulse: false,
      department: "IT Infrastructure",
      verified: true,
      verifiedTooltip: "Posted by Campus IT Services",
      aiSummary: "TL;DR: Hostel Wi-Fi maintenance tonight 11 PM to 2 AM",
      fullAiSummary: "Quick summary: Routine maintenance on core distribution switches. High-speed library networks and cloud LMS will remain accessible without downtime.",
      deadline: "2026-09-08T23:00:00Z",
      deadlineDaysLeft: 1,
      deadlineProgress: 0.85,
      views: 640,
      saves: 34,
      bookmarked: false,
      reminderSet: false,
      relevanceScore: 68,
      postedAt: "1 day ago",
      content: `Campus IT is upgrading access switches across North & South residential halls to support 10Gbps fiber backbone. Service interruptions are expected between 23:00 and 02:00.`,
      attachments: [],
      relatedIds: ["notice_5"]
    },
    {
      id: "notice_5",
      title: "24/7 Silent Study Wings Opened for Exam Season",
      category: "Academic",
      categoryColor: "#2D5BFF",
      urgency: "low",
      urgentPulse: false,
      department: "University Library",
      verified: true,
      verifiedTooltip: "Posted by Chief Librarian",
      aiSummary: "TL;DR: 3rd floor study halls open 24/7 with smart access",
      fullAiSummary: "Quick summary: Central library study halls are accessible 24/7 via digital badge. Night cafe and printing stations will operate continuously.",
      deadline: "2026-10-01T00:00:00Z",
      deadlineDaysLeft: 22,
      deadlineProgress: 0.20,
      views: 790,
      saves: 95,
      bookmarked: false,
      reminderSet: false,
      relevanceScore: 84,
      postedAt: "2 days ago",
      content: `To accommodate study groups and individual revision during mid-sems, Floors 2 & 3 will remain open continuously. Silent pods are available on a reservation basis via the CampusPulse app.`,
      attachments: [],
      relatedIds: ["notice_1"]
    }
  ],

  events: [
    {
      id: "evt_1",
      title: "Edge AI & Embedded Robotics Workshop",
      organizerClub: "Robotics & AI Guild",
      clubLogo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=200&q=80",
      bannerImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
      date: "Tomorrow, Sep 08",
      ticketDate: "08 SEP",
      ticketDay: "TUE",
      time: "2:00 PM - 4:30 PM",
      location: "Turing Lab 402, Block C",
      status: "Filling Fast",
      statusColor: "#F59E0B",
      statusIcon: "flame",
      category: "Tech",
      isPast: false,
      isRegistered: true,
      isLive: false,
      liveCheckIns: 38,
      whyThis: "Because you attended 3 tech events this month and follow AI & Robotics",
      views: 1420,
      rsvps: 214,
      description: "Hands-on immersion into running quantized vision models on microcontrollers and embedded Linux boards. Learn real-time object classification and edge inference without internet connectivity.",
      schedule: [
        { time: "02:00 PM", title: "Keynote: Next-Gen Campus AI on the Edge", speaker: "Dr. Arvind Rao" },
        { time: "02:45 PM", title: "Hands-on: Quantizing Models with TFLite & PyTorch", speaker: "Priya Nair (AI Lead)" },
        { time: "03:45 PM", title: "Hardware Interfacing & Camera Vision Pipeline", speaker: "Karan Johal (Robotics)" },
        { time: "04:15 PM", title: "Demo Battle & Mini Certification", speaker: "Panel of Judges" }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80"
      ],
      discussion: [
        { id: "c1", user: "Kabir Verma", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80", comment: "Do we need to bring hardware kits or will boards be provided?", time: "25m ago" },
        { id: "c2", user: "Robotics Guild Team (Organizer)", avatar: "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=100&q=80", comment: "Hardware boards and sensors will be provided on-site! Just bring your laptop with VS Code and Python 3.10+.", time: "10m ago" }
      ]
    },
    {
      id: "evt_2",
      title: "Smart Campus Hackathon 2026 (Grand Finale)",
      organizerClub: "GDSC Student Chapter",
      clubLogo: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=200&q=80",
      bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
      date: "Sep 12 - 13",
      ticketDate: "12 SEP",
      ticketDay: "SAT",
      time: "9:00 AM - 9:00 PM (36 Hrs)",
      location: "Innovation Hub, Ground Floor",
      status: "Registration Open",
      statusColor: "#10B981",
      statusIcon: "check-circle",
      category: "Hackathon",
      isPast: false,
      isRegistered: false,
      isLive: false,
      liveCheckIns: 0,
      whyThis: "Matches your profile interest in Hackathons & Competitive Programming",
      views: 2480,
      rsvps: 340,
      description: "36-hour sprint to build intelligent campus digital solutions. Food, energy drinks, mentors, and cash pool provided.",
      schedule: [
        { time: "09:00 AM", title: "Opening Ceremony & Problem Statements Release", speaker: "Dean & Industry Sponsors" },
        { time: "12:00 PM", title: "Hacking Starts", speaker: "All Teams" },
        { time: "08:00 PM", title: "Mentorship Check-in 1", speaker: "Senior Engineers" }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=600&q=80"
      ],
      discussion: []
    },
    {
      id: "evt_3",
      title: "Live Tech Talk: Quantum Computing in 2026",
      organizerClub: "IEEE Student Branch",
      clubLogo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80",
      bannerImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
      date: "Today, Sep 07",
      ticketDate: "07 SEP",
      ticketDay: "MON",
      time: "3:00 PM - 4:00 PM",
      location: "Main Auditorium A",
      status: "Live Now",
      statusColor: "#EF4444",
      statusIcon: "radio",
      category: "Keynote",
      isPast: false,
      isRegistered: false,
      isLive: true,
      liveCheckIns: 124,
      whyThis: "Top trending keynote across campus today with 120+ attendees checked in",
      views: 1890,
      rsvps: 260,
      description: "Distinguished guest lecture on superconducting qubits and practical post-quantum cryptography protocols.",
      schedule: [
        { time: "03:00 PM", title: "Quantum Supremacy & Realities", speaker: "Prof. Vikram Sen" },
        { time: "03:40 PM", title: "Student Q&A", speaker: "Audience & Speaker" }
      ],
      gallery: [],
      discussion: []
    },
    {
      id: "evt_4",
      title: "Design Systems & Figma Component Architecture",
      organizerClub: "Design Collective",
      clubLogo: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=200&q=80",
      bannerImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
      date: "Aug 28, 2026",
      ticketDate: "28 AUG",
      ticketDay: "FRI",
      time: "4:00 PM - 6:00 PM",
      location: "Media Center Lab 2",
      status: "Ended",
      statusColor: "#9CA3AF",
      statusIcon: "history",
      category: "Design",
      isPast: true,
      isRegistered: true,
      isLive: false,
      liveCheckIns: 92,
      whyThis: "Past attended event based on your Design Systems interest",
      views: 920,
      rsvps: 110,
      description: "Hands-on crash course on token-based design systems, auto-layout variables, and code handoff for React Native.",
      schedule: [
        { time: "04:00 PM", title: "Tokens & Primitive Tokens", speaker: "Ananya Roy" },
        { time: "05:00 PM", title: "Figma to Code Pipeline", speaker: "Rohan Das" }
      ],
      gallery: [
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80"
      ],
      discussion: []
    }
  ],

  organizerStats: {
    overview: {
      totalViews: { value: "1,420", change: "+18% this week", sparkline: [22, 35, 48, 65, 89, 120, 168] },
      rsvps: { value: "380", change: "+24% this week", sparkline: [8, 14, 25, 41, 62, 85, 114] },
      attendanceRate: { value: "84%", change: "+6% vs benchmark", sparkline: [68, 70, 72, 75, 78, 81, 84] },
      conversionRate: { value: "26.7%", change: "+3.2% optimization", sparkline: [19, 21, 22, 23, 25, 26, 26.7] }
    },
    aiInsight: {
      id: "insight_1",
      badge: "AI Optimization",
      text: "💡 Insight: Events posted before 6 PM get 40% more RSVPs. Consider rescheduling your announcement.",
      score: "+40% Predicted Impact"
    },
    managedEvents: [
      {
        id: "evt_1",
        title: "Edge AI & Embedded Robotics Workshop",
        date: "Sep 08, 2026",
        rsvps: 214,
        capacity: 250,
        views: 1420,
        boosted: true,
        trend: [14, 28, 52, 98, 145, 182, 214]
      },
      {
        id: "evt_2",
        title: "Smart Campus Hackathon 2026 (Grand Finale)",
        date: "Sep 12, 2026",
        rsvps: 340,
        capacity: 400,
        views: 2480,
        boosted: false,
        trend: [40, 80, 140, 210, 270, 310, 340]
      },
      {
        id: "evt_3",
        title: "Live Tech Talk: Quantum Computing in 2026",
        date: "Sep 07, 2026",
        rsvps: 260,
        capacity: 300,
        views: 1890,
        boosted: false,
        trend: [30, 60, 110, 170, 220, 250, 260]
      }
    ],
    analytics: {
      evt_1: {
        viewsOverTime: [
          { day: "Mon", views: 45 },
          { day: "Tue", views: 92 },
          { day: "Wed", views: 165 },
          { day: "Thu", views: 240 },
          { day: "Fri", views: 390 },
          { day: "Sat", views: 680 },
          { day: "Sun", views: 1420 }
        ],
        funnel: [
          { stage: "Viewed", count: 1420, percentage: 100, color: "#2D5BFF" },
          { stage: "RSVP'd", count: 380, percentage: 26.7, color: "#0F766E" },
          { stage: "Attended", count: 319, percentage: 83.9, color: "#10B981" }
        ],
        departmentBreakdown: [
          { department: "Computer Science", count: 182, percentage: 48, color: "#2D5BFF" },
          { department: "Electronics (ECE)", count: 91, percentage: 24, color: "#0F766E" },
          { department: "Mechanical & Robotics", count: 65, percentage: 17, color: "#F59E0B" },
          { department: "Other Branches", count: 42, percentage: 11, color: "#8B5CF6" }
        ]
      }
    }
  },

  timetable: [
    {
      id: "tt_1",
      course: "CS301: Operating Systems & Kernel Architecture",
      time: "09:00 AM - 10:30 AM",
      venue: "Lecture Hall 101",
      faculty: "Prof. S. Sengupta",
      type: "lecture",
      isConflict: false
    },
    {
      id: "tt_2",
      course: "CS304: Distributed Systems & Cloud",
      time: "11:00 AM - 12:30 PM",
      venue: "Lab 3, CS Block",
      faculty: "Dr. Arvind Rao",
      type: "lab",
      isConflict: false
    },
    {
      id: "tt_3",
      course: "Edge AI & Embedded Robotics Workshop",
      time: "02:00 PM - 04:00 PM",
      venue: "Turing Lab 402",
      faculty: "Robotics Guild",
      type: "event",
      isConflict: true
    },
    {
      id: "tt_4",
      course: "Guest Lecture: AI & Quantum Computing",
      time: "03:00 PM - 04:00 PM",
      venue: "Auditorium A",
      faculty: "Prof. Vikram Sen",
      type: "event",
      isConflict: true
    },
    {
      id: "tt_5",
      course: "CS308: Competitive Programming Practice",
      time: "04:30 PM - 06:00 PM",
      venue: "Online Coding Lab",
      faculty: "Prof. Meera Kapoor",
      type: "practice",
      isConflict: false
    }
  ],

  quickPrompts: [
    { id: "qp_1", label: "Deadlines", icon: "calendar", prompt: "What deadlines do I have this week?" },
    { id: "qp_2", label: "Events Today", icon: "sparkles", prompt: "What events are happening on campus today?" },
    { id: "qp_3", label: "Latest Notices", icon: "megaphone", prompt: "Show me the latest official CS department notices." },
    { id: "qp_4", label: "Conflicts", icon: "warning", prompt: "Do I have any schedule clashes today?" }
  ],

  departments: [
    { id: "cs", name: "Computer Science & Engineering", icon: "code-slash", count: "1,240 students" },
    { id: "ece", name: "Electronics & Communication", icon: "hardware-chip", count: "890 students" },
    { id: "mech", name: "Mechanical Engineering", icon: "cog", count: "760 students" },
    { id: "ee", name: "Electrical & Electronics", icon: "flash", count: "650 students" },
    { id: "biotech", name: "Biotechnology & Bioinformatics", icon: "flask", count: "480 students" },
    { id: "civil", name: "Civil & Infrastructure Eng.", icon: "business", count: "420 students" }
  ],

  interestCategories: [
    { id: "tech", label: "Tech & AI", selected: true },
    { id: "robotics", label: "Robotics & Hardware", selected: true },
    { id: "hackathons", label: "Hackathons & Coding", selected: true },
    { id: "design", label: "Design Systems & UI/UX", selected: true },
    { id: "sports", label: "Sports & Athletics", selected: false },
    { id: "music", label: "Music & Cultural", selected: false },
    { id: "gaming", label: "Esports & Gaming", selected: false },
    { id: "entrepreneurship", label: "Startups & Venture", selected: true }
  ]
};
