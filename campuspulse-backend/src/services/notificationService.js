// Unified Multi-Channel Notification Dispatcher & Real-Time Sync Engine
import { getIO, formatRoomName } from "./socket.service.js";
import { mockDatabase } from "./mockData.js";

// Ensure mockDatabase.notifications exists
if (!mockDatabase.notifications) {
  mockDatabase.notifications = [];
}

class NotificationService {
  // 1. Unified Dispatch Utility: Writes to DB & Emits to Targeted Rooms
  async sendNotificationAndSync(options = {}) {
    let { sender = {}, target = {}, payload = {} } = options;

    // Backward-compatibility: if called with flat options (e.g. legacy defaulter dispatcher)
    if (options.studentId || options.seatNumber || options.message) {
      if (!target.studentId && (options.studentId || options.seatNumber)) {
        target = {
          type: "INDIVIDUAL",
          studentId: options.studentId || options.seatNumber,
          userId: options.studentId || options.seatNumber,
          seatNumber: options.seatNumber,
          department: options.department || target.department
        };
      }
      if (!payload.type) {
        payload = {
          type: options.type || "defaulter:alert",
          title: options.title || "⚠️ Official Defaulter Warning",
          message: options.message || `Defaulter notice for ${options.subject || "course"}.`,
          data: options,
          metadata: {
            seatNumber: options.seatNumber,
            studentId: options.studentId,
            subject: options.subject,
            attendancePercentage: options.attendancePercentage
          }
        };
      }
    }

    const notificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientGroup: target.type || (target.studentId ? "INDIVIDUAL" : target.department ? "DEPARTMENT" : "ALL"),
      targetAudience: {
        department: target.department || null,
        year: target.year || null,
        division: target.division || null,
        studentId: target.studentId || target.userId || null,
        seatNumber: target.seatNumber || null
      },
      senderRole: sender.role || "AUTHORITY",
      senderName: sender.name || "CampusPulse Authority",
      type: payload.type || "notice:created", // "notice:created" | "event:created" | "story:created" | "defaulter:alert" | "admin:alert"
      title: payload.title || "New Campus Update",
      message: payload.message || "A new update has been posted to your campus feed.",
      attachmentUrl: payload.attachmentUrl || null,
      isRead: false,
      metadata: payload.metadata || payload.data || {},
      createdAt: new Date().toISOString()
    };

    // A. Persist to MongoDB if connected
    try {
      const NotificationModel = (await import("../models/mongodb/Notification.js")).default;
      await NotificationModel.create(notificationRecord);
    } catch (e) {
      // In-memory fallback
    }

    // B. Save to In-Memory Notification Store
    mockDatabase.notifications.unshift(notificationRecord);

    // C. Determine Target Socket Rooms
    const io = getIO();
    const targetRooms = [];

    if (notificationRecord.recipientGroup === "ALL" || notificationRecord.recipientGroup === "GLOBAL") {
      targetRooms.push(formatRoomName.global());
    } else if (notificationRecord.recipientGroup === "DEPARTMENT" && target.department) {
      targetRooms.push(formatRoomName.dept(target.department));
      targetRooms.push(`room:dept_${String(target.department).replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`);
    } else if (notificationRecord.recipientGroup === "CLASS") {
      targetRooms.push(formatRoomName.classRoom(target.department, target.year, target.division));
    } else if (notificationRecord.recipientGroup === "INDIVIDUAL") {
      const recipientId = target.studentId || target.userId;
      if (recipientId) {
        targetRooms.push(formatRoomName.user(recipientId));
      }
      if (target.seatNumber && target.seatNumber !== recipientId) {
        targetRooms.push(formatRoomName.user(target.seatNumber));
      }
      // Also match student's user ID from mockDatabase if exists
      const foundUser = mockDatabase.users?.find(
        u => u.studentId === recipientId || u.seatNumber === recipientId || u.id === recipientId
      );
      if (foundUser) {
        if (foundUser.id) targetRooms.push(formatRoomName.user(foundUser.id));
        if (foundUser.studentId) targetRooms.push(formatRoomName.user(foundUser.studentId));
        if (foundUser.seatNumber) targetRooms.push(formatRoomName.user(foundUser.seatNumber));
      }
    }

    // Always fallback to global if no specific room resolved
    if (targetRooms.length === 0) {
      targetRooms.push(formatRoomName.global());
    }

    // D. Real-Time WebSocket Emission
    if (io) {
      for (const room of targetRooms) {
        // 1. Emit specific action event (e.g. notice:created, event:created, defaulter:alert)
        io.to(room).emit(notificationRecord.type, {
          notification: notificationRecord,
          data: payload.data || payload.metadata || {},
          timestamp: notificationRecord.createdAt
        });

        // 2. Emit global notification toast event
        io.to(room).emit("notification:new", notificationRecord);

        // 3. AI Assistant cache invalidation signal
        io.to(room).emit("ai:cache:invalidate", {
          type: notificationRecord.type,
          invalidatedAt: notificationRecord.createdAt
        });

        console.log(`📢 Dispatched [${notificationRecord.type}] to ${room} ("${notificationRecord.title}")`);
      }
    }

    return notificationRecord;
  }

  // 2. Fetch Notifications for Authenticated User
  async getUserNotifications(user = {}) {
    const userId = user.id || user.studentId;
    const studentId = user.studentId || user.id;
    const userDept = (user.department || "").toUpperCase();

    // Query in-memory notifications filtered by targeting
    const filtered = mockDatabase.notifications.filter((n) => {
      // Global broadcast
      if (n.recipientGroup === "ALL" || n.recipientGroup === "GLOBAL") return true;

      // Department broadcast
      if (n.recipientGroup === "DEPARTMENT") {
        const notifDept = (n.targetAudience?.department || "").toUpperCase();
        return notifDept === userDept || notifDept.includes("GENERAL");
      }

      // Class broadcast
      if (n.recipientGroup === "CLASS") {
        const notifDept = (n.targetAudience?.department || "").toUpperCase();
        return notifDept === userDept;
      }

      // Individual targeted notification
      if (n.recipientGroup === "INDIVIDUAL") {
        const targetId = n.targetAudience?.studentId || n.targetAudience?.userId;
        return targetId === userId || targetId === studentId;
      }

      return false;
    });

    return filtered;
  }

  // 3. Mark Notification as Read
  async markAsRead(notificationId) {
    const item = mockDatabase.notifications.find((n) => n.id === notificationId);
    if (item) {
      item.isRead = true;
    }

    try {
      const NotificationModel = (await import("../models/mongodb/Notification.js")).default;
      await NotificationModel.findOneAndUpdate({ id: notificationId }, { isRead: true });
    } catch (e) {}

    return item || { id: notificationId, isRead: true };
  }

  // 4. Mark All as Read for User
  async markAllAsRead(user = {}) {
    const list = await this.getUserNotifications(user);
    list.forEach((n) => {
      n.isRead = true;
    });
    return { success: true, count: list.length };
  }

  // 5. Get Unread Count for User
  async getUnreadCount(user = {}) {
    const list = await this.getUserNotifications(user);
    return list.filter((n) => !n.isRead).length;
  }
}

export const notificationService = new NotificationService();
export const sendNotificationAndSync = notificationService.sendNotificationAndSync.bind(notificationService);
