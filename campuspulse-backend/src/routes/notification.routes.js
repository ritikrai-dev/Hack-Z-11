import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { notificationService } from "../services/notificationService.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

// 1. Get targeted notifications for logged-in user
router.get("/", async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return success(res, `Fetched ${notifications.length} notifications`, {
      notifications,
      unreadCount,
      count: notifications.length
    });
  } catch (error) {
    return failure(res, error.message || "Failed to fetch notifications", 500);
  }
});

// 2. Get unread badge count
router.get("/unread-count", async (req, res) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user);
    return success(res, "Unread notifications count", { unreadCount });
  } catch (error) {
    return failure(res, error.message || "Failed to get unread count", 500);
  }
});

// 3. Mark single notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await notificationService.markAsRead(id);
    return success(res, "Notification marked as read", { notification: updated });
  } catch (error) {
    return failure(res, error.message || "Failed to update notification", 500);
  }
});

// 4. Mark all as read
router.post("/mark-all-read", async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user);
    return success(res, "All notifications marked as read", result);
  } catch (error) {
    return failure(res, error.message || "Failed to mark all as read", 500);
  }
});

export default router;
