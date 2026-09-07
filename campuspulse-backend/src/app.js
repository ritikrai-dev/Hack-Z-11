import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import noticeRoutes from "./routes/notice.routes.js";
import eventRoutes from "./routes/event.routes.js";
import organizerRoutes from "./routes/organizer.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import fileRoutes from "./routes/file.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads serving
app.use("/uploads", express.static(path.resolve(__dirname, "../public/uploads")));

// Health Check
app.get("/health", (req, res) => {
  res.json({ success: true, status: "healthy", message: "CampusPulse API is running", timestamp: new Date().toISOString() });
});

// Root & API Base Welcome Endpoints
const baseInfoHandler = (req, res) => {
  res.json({
    success: true,
    message: "CampusPulse API v1 is active & operational",
    version: "1.0.0",
    environment: env.nodeEnv,
    health: "/health",
    availableEndpoints: {
      notices: `${env.apiPrefix}/notices`,
      urgentStories: `${env.apiPrefix}/notices/stories/urgent`,
      events: `${env.apiPrefix}/events`,
      nearbyEvents: `${env.apiPrefix}/events/near-you`,
      recommendedEvents: `${env.apiPrefix}/events/recommended`,
      organizerStats: `${env.apiPrefix}/organizer/dashboard/stats`,
      organizerEvents: `${env.apiPrefix}/organizer/events`,
      scheduleConflicts: `${env.apiPrefix}/schedule/conflicts`,
      scheduleTimetable: `${env.apiPrefix}/schedule/timetable`,
      aiChat: `${env.apiPrefix}/ai/assistant/chat`,
      aiPrompts: `${env.apiPrefix}/ai/assistant/quick-prompts`,
      userProfile: `${env.apiPrefix}/user/profile`,
      onboarding: `${env.apiPrefix}/user/onboarding/meta`
    }
  });
};

app.get("/", baseInfoHandler);
app.get("/api", baseInfoHandler);
app.get(`${env.apiPrefix}`, baseInfoHandler);

// Mount routes on both root and /api/v1
app.use("/auth", authRoutes);
app.use(`${env.apiPrefix}/auth`, authRoutes);

app.use("/user", userRoutes);
app.use(`${env.apiPrefix}/user`, userRoutes);

app.use("/notices", noticeRoutes);
app.use(`${env.apiPrefix}/notices`, noticeRoutes);

app.use("/events", eventRoutes);
app.use(`${env.apiPrefix}/events`, eventRoutes);

app.use("/organizer", organizerRoutes);
app.use(`${env.apiPrefix}/organizer`, organizerRoutes);

app.use("/schedule", scheduleRoutes);
app.use(`${env.apiPrefix}/schedule`, scheduleRoutes);

app.use("/ai", aiRoutes);
app.use(`${env.apiPrefix}/ai`, aiRoutes);

app.use("/admin", adminRoutes);
app.use(`${env.apiPrefix}/admin`, adminRoutes);

app.use("/files", fileRoutes);
app.use(`${env.apiPrefix}/files`, fileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
