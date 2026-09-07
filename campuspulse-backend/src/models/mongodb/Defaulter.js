import mongoose from "mongoose";

const defaulterSchema = new mongoose.Schema(
  {
    seatNumber: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    subjectCode: { type: String, default: "SUB101" },
    attendancePercentage: { type: Number, required: true },
    teacherId: { type: String, required: true },
    teacherName: { type: String, default: "Faculty Member" },
    department: { type: String, default: "Academic Department" },
    term: { type: String, default: "Current Semester" },
    noticeTitle: { type: String, default: "Official Defaulter Notice" },
    reason: { type: String, default: "Critical Shortage / Submissions Incomplete" },
    verified: { type: Boolean, default: true },
    status: { type: String, enum: ["ACTIVE", "RESOLVED"], default: "ACTIVE", index: true },
    publishedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Defaulter || mongoose.model("Defaulter", defaulterSchema);
