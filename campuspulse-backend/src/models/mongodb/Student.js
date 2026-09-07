import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    seatNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    year: { type: String, default: "3rd Year" },
    semester: { type: String, default: "Semester 5" },
    division: { type: String, default: "A" },
    email: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
