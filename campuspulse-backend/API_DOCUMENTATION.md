# CampusPulse API Reference & Contract

Complete REST API documentation for the Smart Campus App.
Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication
*Note: Includes dev demo token fallback (`Authorization: Bearer demo-token` or automatic student session).*

- `POST /auth/login`
  - Body: `{ studentId, password }`
  - Returns: `{ user, token }`
- `POST /auth/logout`
  - Returns: `{ success: true }`

---

## 2. Student Profile & Preferences

- `GET /user/profile`
  - Returns: Student profile (Riya Sharma, 2023CS042, 80% completeness, interests, avatar, notification settings)
- `PUT /user/profile`
  - Body: `{ name, email, department, year }`
- `PUT /user/interests`
  - Body: `{ interests: ["Tech & AI", "Robotics & Hardware", ...] }`
- `PUT /user/preferences/notifications`
  - Body: `{ urgentAlerts: true, eventReminders: true, clubUpdates: true, departmentNotices: true }`
- `PATCH /user/onboarding`
  - Body: `{ department, interests, notificationsEnabled }`
- `GET /user/onboarding/meta`
  - Returns: Illustrated departments list and interest categories

---

## 3. Notices & Broadcasts

- `GET /notices`
  - Query Params:
    - `category`: `All` | `Academic` | `Clubs` | `Placement` | `Administrative`
    - `search`: free-text query
    - `smartSort`: `true` | `false` (reorders by predicted student relevance score)
  - Returns: Notice array with AI one-line summary badges (`TL;DR:...`), verified department checkmarks, engagement stats
- `GET /notices/stories/urgent`
  - Returns: Full-screen story-style urgent notice cards with countdown timers and conic ring categories
- `GET /notices/:id`
  - Returns: Notice detail with full AI executive summary, deadline progress ring metadata, attachments, department badges
- `GET /notices/:id/related`
  - Returns: Carousel notices ("You might also want to see")
- `PATCH /notices/:id/bookmark`
  - Toggles saved bookmark state
- `PATCH /notices/:id/reminder`
  - Toggles calendar push reminder

---

## 4. Events & Ticketing

- `GET /events`
  - Query Params:
    - `filter`: `upcoming` | `past` | `my_events`
    - `search`: free-text query
    - `category`: event category
  - Returns: Event timeline objects with torn-ticket badge metadata, status pills (`Filling Fast`, `Registration Open`, `Live Now`)
- `GET /events/near-you`
  - Returns: Glassmorphic live events with active pulsing dot and live check-in counts (e.g. `38 checked in now`)
- `GET /events/recommended`
  - Returns: AI-tailored events with `whyThis` recommendation logic
- `GET /events/:id`
  - Returns: Full event detail, agenda schedule blocks, gallery photo URLs, and attendee discussion thread
- `POST /events/:id/register`
  - Registers student, increments RSVPs, returns Digital QR Entry Pass payload
- `DELETE /events/:id/register`
  - Cancels event registration
- `GET /events/:id/ticket-qr`
  - Returns digital ticket payload and cryptographic validation token for gate entry scanners
- `POST /events/:id/comments`
  - Body: `{ comment: "string" }`
  - Adds a question/comment to the attendee Q&A thread

---

## 5. Organizer Intelligence Dashboard (Screen 8)

- `GET /organizer/dashboard/stats`
  - Returns:
    - `totalViews`: `1,420` (+18%) with 7-day sparkline array
    - `rsvps`: `380` (+24%) with 7-day sparkline array
    - `attendanceRate`: `84%` (+6%) with 7-day sparkline array
    - `conversionRate`: `26.7%` (+3.2%) with 7-day sparkline array
- `GET /organizer/ai-insight`
  - Returns: Highlighted card *"💡 Insight: Events posted before 6 PM get 40% more RSVPs. Consider rescheduling your announcement."*
- `GET /organizer/events`
  - Returns: Managed event list with mini bar charts and boost states
- `GET /organizer/events/:id/analytics`
  - Returns:
    - `viewsOverTime`: Line chart growth telemetry
    - `funnel`: Viewed → RSVP'd → Attended percentage drop-offs
    - `departmentBreakdown`: Donut chart percentages by major
- `PATCH /organizer/events/:id/boost`
  - Toggles visibility boost algorithm in student feeds (+60% reach)
- `GET /organizer/events/:id/export-report`
  - Generates downloadable event performance summary report
- `POST /organizer/events`
  - Creates and broadcasts a new campus event

---

## 6. Schedule & Conflict Resolution

- `GET /schedule/conflicts`
  - Returns: Active schedule clashes (`Robotics Workshop 2-4 PM` vs `Guest Lecture 3-4 PM`) and attendance impact (`87 others also registered for both`)
- `POST /schedule/conflicts/resolve`
  - Body: `{ action: "keep_robotics" | "keep_lecture" | "keep_both" | "notify_alternate" }`
  - Resolves conflict and updates student schedule
- `GET /schedule/timetable`
  - Returns: Fall 2026 academic timetable with conflicting slot flags in red and normal lecture blocks in blue

---

## 7. AI Smart Search & Campus Assistant Overlay (Screen 7)

- `GET /ai/assistant/quick-prompts`
  - Returns: `[📅 Deadlines, 🎉 Events Today, 📢 Latest Notices, ⚠️ Conflicts]`
- `POST /ai/assistant/chat`
  - Body: `{ message: "What exams are rescheduled?" }`
  - Returns: Deep natural language answer + rich embedded mini card (Notice, Conflict, or Event card)
- `POST /ai/assistant/transcribe`
  - Voice query transcription endpoint
- `POST /ai/recommendations/retrain`
  - Body: `{ interests: [...] }`
  - Recalculates student relevance embeddings and returns updated scores
