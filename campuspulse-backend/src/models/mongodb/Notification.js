import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true, index: true },
    type: { type: String, required: true },
    title: String,
    message: String,
    read: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
