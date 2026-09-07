import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    storyId: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    tag: { type: String, default: "Notice" },
    author: { type: String, default: "Campus Admin" },
    avatar: { type: String, default: "" },
    hasUnseen: { type: Boolean, default: true },
    urgent: { type: Boolean, default: false },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
  },
  { timestamps: true }
);

export default mongoose.model("Story", storySchema);
