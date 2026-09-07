import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { mockDatabase } from "../services/mockData.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

// Get schedule conflicts
router.get("/conflicts", (req, res) => {
  return success(res, "Schedule conflicts fetched successfully", {
    hasConflicts: mockDatabase.conflictBanner.active,
    conflictBanner: mockDatabase.conflictBanner
  });
});

// Resolve a schedule conflict
router.post("/conflicts/resolve", (req, res) => {
  const { action, conflictId } = req.body;
  if (!action) {
    return failure(res, "Action is required (e.g. keep_robotics, keep_lecture, notify_alternate)", 400);
  }

  mockDatabase.conflictBanner.resolvedAction = action;
  if (action !== "keep_both") {
    mockDatabase.conflictBanner.active = false;
  }

  let message = "Conflict resolved successfully";
  if (action === "keep_robotics") message = "Kept Robotics Workshop. Calendar updated.";
  if (action === "keep_lecture") message = "Kept Guest Lecture. Calendar updated.";
  if (action === "notify_alternate") message = "You will be alerted if an alternate time slot opens.";

  return success(res, message, {
    conflictId: conflictId || mockDatabase.conflictBanner.id,
    resolvedAction: action,
    conflictBanner: mockDatabase.conflictBanner
  });
});

// Get timetable
router.get("/timetable", (req, res) => {
  return success(res, "Timetable fetched successfully", {
    timetable: mockDatabase.timetable,
    day: "Tuesday, Sep 08",
    activeTerm: "Fall 2026 • Mid-Semester"
  });
});

export default router;
