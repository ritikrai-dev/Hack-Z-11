import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    noticeId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true, default: "Academic" },
    categoryColor: { type: String, default: "#2D5BFF" },
    urgency: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", index: true },
    urgentPulse: { type: Boolean, default: false },
    department: { type: String, default: "Campus Administration", index: true },
    verified: { type: Boolean, default: true },
    verifiedTooltip: { type: String, default: "Verified Official Department Notice" },
    aiSummary: { type: String, default: "" },
    fullAiSummary: { type: String, default: "" },
    deadline: { type: String, default: null },
    deadlineDaysLeft: { type: Number, default: null },
    deadlineProgress: { type: Number, default: null },
    views: { type: Number, default: 1 },
    saves: { type: Number, default: 0 },
    bookmarked: { type: Boolean, default: false },
    reminderSet: { type: Boolean, default: false },
    relevanceScore: { type: Number, default: 85 },
    postedAt: { type: String, default: "Just now" },
    attachments: [{ name: String, url: String, size: String }],
    authorRole: { type: String, default: "ADMIN" },
    authorId: { type: String, default: "ADM001" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published", index: true }
  },
  { timestamps: true }
);

noticeSchema.index({ title: "text", content: "text", aiSummary: "text" });

export default mongoose.model("Notice", noticeSchema);
