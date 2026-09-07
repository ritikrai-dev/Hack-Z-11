import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    recipientGroup: {
      type: String,
      enum: ["ALL", "DEPARTMENT", "CLASS", "INDIVIDUAL"],
      default: "ALL",
      index: true
    },
    targetAudience: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // { department, year, division, studentId, userId }
    },
    senderRole: { type: String, default: "FACULTY" },
    senderName: { type: String, default: "CampusPulse Authority" },
    type: {
      type: String,
      required: true,
      index: true // "notice:created" | "event:created" | "story:created" | "defaulter:alert" | "admin:alert"
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    attachmentUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
