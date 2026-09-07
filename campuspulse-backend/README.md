# CampusPulse Backend

Node.js + Express backend using MySQL for relational data and MongoDB for notices/notifications.

## Authentication model

There is NO public student registration endpoint.

Students are created by an Admin/College and log in using:
- studentId
- password

Admin-only student provisioning:
- POST /api/v1/admin/students
- GET /api/v1/admin/students
- GET /api/v1/admin/students/:id
- PATCH /api/v1/admin/students/:id/status

## Main frontend contract

### Auth
- POST /api/v1/auth/login
- POST /api/v1/auth/logout

### User
- GET /api/v1/user/profile
- PUT /api/v1/user/profile
- PUT /api/v1/user/interests
- PUT /api/v1/user/preferences/notifications
- PATCH /api/v1/user/onboarding
- PATCH /api/v1/user/password

### Notices
- GET /api/v1/notices
- GET /api/v1/notices/:id
- PATCH /api/v1/notices/:id/bookmark
- PATCH /api/v1/notices/:id/reminder
- GET /api/v1/notices/stories/urgent
- GET /api/v1/notices/:id/related
- POST /api/v1/notices (admin)
- PUT /api/v1/notices/:id (admin)
- PATCH /api/v1/notices/:id/publish (admin)

### Events
- GET /api/v1/events
- GET /api/v1/events/:id
- POST /api/v1/events/:id/register
- DELETE /api/v1/events/:id/register
- GET /api/v1/events/:id/ticket-qr
- POST /api/v1/events/:id/comments
- GET /api/v1/events/near-you
- GET /api/v1/events/recommended

### Organizer
- POST /api/v1/organizer/events
- GET /api/v1/organizer/dashboard/stats
- GET /api/v1/organizer/events/:id/analytics
- PATCH /api/v1/organizer/events/:id/boost
- GET /api/v1/organizer/events/:id/export-report

### Schedule
- GET /api/v1/schedule/conflicts
- POST /api/v1/schedule/conflicts/resolve
- GET /api/v1/schedule/timetable

### AI
- POST /api/v1/ai/assistant/chat
- POST /api/v1/ai/assistant/transcribe
- POST /api/v1/ai/recommendations/retrain
- GET /api/v1/ai/assistant/quick-prompts

## Setup

1. Create MySQL database/tables by running `src/models/mysql/schema.sql`.
2. Create MongoDB database (the app creates collections automatically).
3. Copy `.env.example` to `.env` and configure credentials.
4. Run:
   npm install
   npm run dev

## Development URL

http://localhost:5000/api/v1

Health:
http://localhost:5000/health

## Frontend

Set:
VITE_API_BASE_URL=http://localhost:5000/api/v1

The production URL can remain:
https://api.campuspulse.edu/v1
