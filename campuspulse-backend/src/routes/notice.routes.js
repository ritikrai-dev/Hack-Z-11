import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  listNotices,
  getUrgentStories,
  getNotice,
  getRelatedNotices,
  toggleBookmark,
  toggleReminder,
  createNotice,
  updateNotice,
  publishNotice
} from "../controllers/notice.controller.js";

const router = Router();
router.use(authenticate);

// Specific paths must precede parameter routes
router.get("/", listNotices);
router.get("/stories/urgent", getUrgentStories);
router.get("/:id/related", getRelatedNotices);
router.patch("/:id/bookmark", toggleBookmark);
router.patch("/:id/reminder", toggleReminder);
router.get("/:id", getNotice);

// Notice publishing & management actions
router.post("/", authorize("ADMIN", "TEACHER", "CLUB_LEADER"), createNotice);
router.put("/:id", authorize("ADMIN", "TEACHER", "CLUB_LEADER"), updateNotice);
router.patch("/:id/publish", authorize("ADMIN", "TEACHER"), publishNotice);

export default router;
