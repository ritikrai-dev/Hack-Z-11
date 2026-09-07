# 🎓 UniSync (formerly CampusPulse)
> **Next-Gen Real-Time Smart Campus Management & Communication Platform**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo%2052%2B-blue.svg)](https://reactnative.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8%2B-black.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Ready-green.svg)](https://www.mongodb.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-sky.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)

UniSync is an enterprise-grade university operating ecosystem connecting **Students**, **Faculty Educators**, **Club Leaders**, and **College Administrators** in real-time. It replaces fragmented circulars, manual defaulter entry, and disconnected chat groups with an intelligent, database-grounded platform featuring live WebSocket broadcasting, automated file/Excel parsing, AI assistant context, and digital QR ticketing.

---

## 📑 Table of Contents
- [System Architecture](#-system-architecture)
- [Monorepo Directory Structure](#-monorepo-directory-structure)
- [Key Features](#-key-features)
  - [1. Real-Time WebSocket Engine](#1-real-time-websocket-engine-socketio)
  - [2. Automated Defaulter Management System](#2-automated-defaulter-management-system)
  - [3. UniSync AI Campus Assistant](#3-unisync-ai-campus-assistant)
  - [4. Role-Gated Multi-Portal Architecture](#4-role-gated-multi-portal-architecture)
  - [5. 24-Hour Campus Stories & Digital Event Passes](#5-24-hour-campus-stories--digital-event-passes)
- [Getting Started & Local Setup](#-getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone and Install Dependencies](#step-1-clone-and-install-dependencies)
  - [Step 2: Start the Backend Server](#step-2-start-the-backend-server)
  - [Step 3: Start Frontend Applications](#step-3-start-frontend-applications)
- [Demo Credentials](#-demo-credentials)
- [API Reference](#-api-reference)
- [Automated Testing & Quality Assurance](#-automated-testing--quality-assurance)

---

## 🏛 System Architecture

```
                                  ┌────────────────────────┐
                                  │   UniSync Mobile App   │ (React Native / Expo)
                                  └───────────▲────────────┘
                                              │ REST + WebSockets
                                              ▼
┌───────────────────────┐         ┌────────────────────────┐         ┌───────────────────────┐
│   Admin Web Portal    ├────────►│  UniSync API & Engine  │◄────────┤   Student Web Portal  │
│ (React + Vite + TW)   │REST+WS  │(Node/Express+Socket.io)│ REST+WS │ (React + Vite + TW)   │
└───────────────────────┘         └───────────┬────────────┘         └───────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
         ┌─────────────────────┐                             ┌─────────────────────┐
         │  PostgreSQL Relational │                             │   MongoDB Atlas     │
         │     (Supabase)      │                             │ (Notices & Stories) │
         └─────────────────────┘                             └─────────────────────┘
```

---

## 📂 Monorepo Directory Structure

```
Hack/
├── campuspulse-backend/       # Node.js + Express API & Socket.io server (Port 5000)
│   ├── src/
│   │   ├── config/           # Database & environment configurations
│   │   ├── controllers/      # Route controllers (Defaulter, Notice, Event, User, Auth)
│   │   ├── middleware/       # JWT auth, role authorization & error handlers
│   │   ├── models/           # MongoDB / Mongoose models (Defaulter, Student, Notice)
│   │   ├── routes/           # Express route handlers
│   │   ├── services/         # Socket.io, notification dispatcher, seed database
│   │   └── server.js         # HTTP server entry point
│   └── package.json
│
├── campuspulse-mobile/        # React Native / Expo Universal Mobile App (UniSync)
│   ├── src/
│   │   ├── api/              # Unified API client (ApiClient)
│   │   ├── components/       # HeaderCard, NoticeCard, EventCard, StoryCarousel
│   │   ├── context/          # Real-time NotificationContext (Socket.io client)
│   │   ├── screens/          # Role-based screens (HomeScreen, DefaulterList, Login)
│   │   └── theme/            # Design system, colors & shadows
│   ├── app.json              # Expo configuration (UniSync)
│   ├── metro.config.js       # Metro bundler config
│   └── package.json
│
├── admin-portal/              # Vite + React Admin & Faculty Web Portal (Port 5174)
│   ├── src/                  # Bulk Defaulter upload, Circulars publisher, Roster export
│   └── package.json
│
├── student-portal/            # Vite + React Student Web Interface (Port 5173)
│   ├── src/                  # Timetables, exam passes, notice feed, QR ticket modal
│   └── package.json
│
├── test_defaulter_sync_rebrand.cjs   # E2E Defaulter & real-time sync test suite
├── test_realtime_notifications.js    # Multi-room Socket.io push notification suite
├── test_advanced_features.js         # Role logins, file attachments, and XLSX exports
└── test_defaulter_ai.js              # Database-grounded AI assistant test suite
```

---

## ✨ Key Features

### 1. Real-Time WebSocket Engine (Socket.io)
- **JWT Connection Handshake**: Decodes token and verifies user role upon connection.
- **Smart Room Hierarchy**:
  - `room:global`: All university students, faculty, and administrators.
  - `room:dept_<DEPT>`: Department broadcasts (`room:dept_CSE`, `room:dept_ECE`, etc.).
  - `room:class_<DEPT>_<YEAR>_<DIV>`: Cohort and section-specific circulars.
  - `room:user_<USER_ID>`: Individual targeted notifications by Student ID and Seat Number.
- **Multi-Room Dispatch**: Unified `sendNotificationAndSync()` dispatches targeted events, in-app toast banners, and triggers AI cache invalidation signals.

### 2. Automated Defaulter Management System
- **Real-Time Seat Number Database Verification**:
  - Requires official **Seat Number / PRN** and **Student Name** (Roll Number is deprecated).
  - Validates in real time against the active Student database.
  - Rejects unknown seat numbers immediately with **HTTP 404 Not Found** (`❌ Seat Number [SEAT_NO] not found in the official student database.`).
  - Commits valid records with **HTTP 201 Created** and links unique student identifiers.
- **Dynamic Excel & File Upload Parser**:
  - Accepts spreadsheets (`.xlsx`, `.xls`), CSV, and JSON row arrays.
  - Dynamically normalizes column headers (matches variations like `seat no`, `prn`, `student name`, `course`, `attendance %`).
  - Returns structured verification summaries:
    ```json
    {
      "success": true,
      "totalRows": 15,
      "insertedCount": 13,
      "failedRows": [
        { "row": 4, "seatNumber": "S9999999", "reason": "Seat Number not found in official student database" }
      ],
      "data": [ ...insertedRecords ]
    }
    ```
- **Instant Student Dashboard Synchronization**:
  - Real-time warning banners render on the student's mobile dashboard upon being flagged.
  - Dual-key retrieval via `GET /api/v1/defaulters/student/:studentId` and `GET /api/v1/defaulters/me`.

### 3. UniSync AI Campus Assistant
- **Database-Grounded Answers**: Directly cross-references active university records:
  - *"When is my Operating Systems exam?"* -> Retrieves date, time slot, and room hall.
  - *"Am I in the defaulter list?"* -> Informs student of flagged courses, faculty member, and attendance percentage.
  - *"Show latest circulars"* -> Summarizes unread university notices with AI TL;DR.
- **Dynamic Cache Invalidation**: Listens to `ai:cache:invalidate` socket events to refresh state when new notices or defaulter lists are posted.

### 4. Role-Gated Multi-Portal Architecture
- **Strict Role-Gated Logins**: Rejects unauthorized portal cross-access with HTTP 403.
- **Supported Roles**:
  - `STUDENT`: Timetable, attendance status, notice feed, registered events, digital passes.
  - `TEACHER`: Defaulter management, circular publishing, event attendee rosters, Excel export.
  - `CLUB_LEADER`: 24-hour campus stories, club event announcements, registration tracking.
  - `ADMIN`: Global broadcasts, department rosters, institute-wide defaulter oversight.

### 5. 24-Hour Campus Stories & Digital Event Passes
- **Live Stories Feed**: Instagram/WhatsApp-style 24-hour disappearing announcements for urgent alerts and hackathons.
- **Intra & Inter-College Events**: Supports custom question forms, registration capacity limits, and external registration links.
- **QR Digital Ticketing**: Instant cryptographic QR code pass generated upon registration.
- **Native Excel (.xlsx) Attendee Export**: One-click download of student registrations with custom form answers.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Expo CLI**: (optional, for running on mobile devices)

---

### Step 1: Clone and Install Dependencies

```bash
# 1. Backend dependencies
cd campuspulse-backend
npm install

# 2. Mobile App dependencies
cd ../campuspulse-mobile
npm install

# 3. Admin Portal dependencies
cd ../admin-portal
npm install

# 4. Student Portal dependencies
cd ../student-portal
npm install
```

---

### Step 2: Start the Backend Server

```bash
cd campuspulse-backend
npm start
```
* The backend API runs at: **`http://localhost:5000/api/v1`**
* WebSocket server listens on: **`http://localhost:5000`**
* Health check endpoint: **`http://localhost:5000/health`**

---

### Step 3: Start Frontend Applications

#### A. Start Mobile App (UniSync / Expo)
```bash
cd campuspulse-mobile
npm run web       # Run in web browser
# or
npm run android   # Run on Android emulator / device
```

#### B. Start Admin Web Portal
```bash
cd admin-portal
npm run dev
```
* Admin portal available at: **`http://localhost:5174`**

#### C. Start Student Web Portal
```bash
cd student-portal
npm run dev
```
* Student portal available at: **`http://localhost:5173`**

---

## 🔑 Demo Credentials

| Role | User ID / Email | Password | Portal / View |
|:---|:---|:---|:---|
| **Student** | `2023CS042` (or `ritik.sharma@campus.edu`) | `student123` | Student App / Portal |
| **Student (Defaulter Demo)** | `2026CS023` (Seat: `S2026023`) | `student123` | Defaulter Alerts Demo |
| **Teacher / Faculty** | `TCH101` (or `arvind.rao@campus.edu`) | `teacher123` | Admin & Faculty Portal |
| **Club Leader** | `LEAD201` (or `lead.gdg@campus.edu`) | `leader123` | Stories & Club Portal |
| **Administrator** | `ADM001` (or `admin@campus.edu`) | `admin123` | Full Admin Oversight |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT token |
| `GET` | `/api/v1/user/profile` | Get profile of logged-in user |

### Defaulter Management
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/defaulters/manual` | Single manual entry with real-time Seat No check |
| `POST` | `/api/v1/defaulters/upload` | Upload & parse Excel/CSV/JSON with dynamic headers |
| `GET` | `/api/v1/defaulters/student/:studentId` | Query defaulters by studentId or seatNumber |
| `GET` | `/api/v1/defaulters/me` | Get defaulter records for authenticated student |
| `GET` | `/api/v1/defaulters/teacher` | Get defaulters flagged by logged-in faculty |
| `DELETE`| `/api/v1/defaulters/:id` | Resolve / remove student from defaulter list |

### Real-Time Notifications
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/notifications` | Get notifications for authenticated user |
| `GET` | `/api/v1/notifications/unread-count`| Get live unread notifications count |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark specific notification as read |
| `POST` | `/api/v1/notifications/mark-all-read`| Mark all notifications as read |

### Campus Notices & Stories
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/notices` | List notices with priority & category filters |
| `POST` | `/api/v1/notices` | Publish official notice with optional file attachment |
| `GET` | `/api/v1/notices/stories/urgent` | Get active 24-hour campus stories |
| `POST` | `/api/v1/notices/stories` | Create new 24-hour story broadcast |

### Events & Registrations
| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/v1/events` | List campus events (intra/inter-college) |
| `POST` | `/api/v1/events` | Create event with custom questions or external URL |
| `POST` | `/api/v1/events/:id/register` | Register for event & generate digital QR ticket |
| `GET` | `/api/v1/events/:id/roster` | View attendees roster (Faculty only) |
| `GET` | `/api/v1/events/:id/export/xlsx`| Export attendee roster to Excel spreadsheet |

### UniSync AI Assistant
| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/v1/ai/assistant/chat` | Database-grounded context Q&A |
| `GET` | `/api/v1/ai/assistant/quick-prompts` | Contextual quick action prompts |

---

## 🧪 Automated Testing & Quality Assurance

All features are covered by automated integration test suites:

```bash
# Run Defaulter & Real-Time Sync E2E Suite (30 tests)
node scratch/test_defaulter_sync_rebrand.cjs

# Run Socket.io Real-Time Notification Suite (17 tests)
node test_realtime_notifications.js

# Run Advanced Features & XLSX Export Suite (9 tests)
node test_advanced_features.js

# Run AI Assistant & Seat Number Validation Suite (9 tests)
node test_defaulter_ai.js

# Verify Mobile App Android Metro Bundling (828 modules)
cd campuspulse-mobile && npx expo export --platform android --no-bytecode
```

---

## 📄 License
MIT License. Built for Smart University Campuses.
