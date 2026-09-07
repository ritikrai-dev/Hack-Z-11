// CampusPulse Teacher Defaulter Management Service
// Real-Time Seat Number Verification, Document Parsing & Targeted Sync
import { sendNotificationAndSync } from "./notificationService.js";

// Extended student database directory with official Seat Numbers (PRN)
export const studentDirectory = [
  {
    id: "usr_student_01",
    _id: "usr_student_01",
    studentId: "2023CS042",
    seatNumber: "S2023042",
    name: "Ritik Sharma",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    division: "A",
    email: "ritik.sharma@campus.edu"
  },
  {
    id: "usr_student_02",
    _id: "usr_student_02",
    studentId: "2024CS099",
    seatNumber: "S2024099",
    name: "Aarav Patel",
    department: "Computer Science & Engineering",
    year: "1st Year",
    semester: "Semester 1",
    division: "B",
    email: "aarav.patel@campus.edu"
  },
  {
    id: "usr_student_03",
    _id: "usr_student_03",
    studentId: "2026CS023",
    seatNumber: "S2026023",
    name: "Rahul Sharma",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    division: "A",
    email: "rahul.sharma@campus.edu"
  },
  {
    id: "usr_student_04",
    _id: "usr_student_04",
    studentId: "2026CS031",
    seatNumber: "S2026031",
    name: "Riya Shah",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    division: "A",
    email: "riya.shah@campus.edu"
  },
  {
    id: "usr_student_05",
    _id: "usr_student_05",
    studentId: "2026CS048",
    seatNumber: "S2026048",
    name: "Aditya Patil",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    division: "A",
    email: "aditya.patil@campus.edu"
  },
  {
    id: "usr_student_06",
    _id: "usr_student_06",
    studentId: "2026CS014",
    seatNumber: "S2026014",
    name: "Sneha Kulkarni",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    semester: "Semester 5",
    division: "B",
    email: "sneha.k@campus.edu"
  }
];

// Helper: Real-time DB lookup for Seat Number
export async function findStudentBySeatNumber(seatNum) {
  if (!seatNum) return null;
  const normalized = String(seatNum).trim().toUpperCase();

  // 1. Try MongoDB Student collection if active
  try {
    const StudentModel = (await import("../models/mongodb/Student.js")).default;
    const mongoStudent = await StudentModel.findOne({
      $or: [
        { seatNumber: { $regex: new RegExp(`^${normalized}$`, "i") } },
        { studentId: { $regex: new RegExp(`^${normalized}$`, "i") } }
      ]
    });
    if (mongoStudent) return mongoStudent;
  } catch (e) {
    // Fallback to in-memory directory
  }

  // 2. Deterministic lookup in studentDirectory
  return studentDirectory.find(s =>
    s.seatNumber.toUpperCase() === normalized ||
    s.studentId.toUpperCase() === normalized ||
    s.seatNumber.replace(/^S/i, "").toUpperCase() === normalized.replace(/^S/i, "")
  ) || null;
}

// In-Memory Defaulter Storage
class DefaulterService {
  constructor() {
    this.defaulterRecords = [
      {
        id: "def_seed_1",
        seatNumber: "S2026023",
        studentId: "2026CS023",
        studentName: "Rahul Sharma",
        subject: "Computer Networks",
        subjectCode: "CS501",
        attendancePercentage: 62,
        teacherId: "TCH101",
        teacherName: "Dr. Arvind Rao",
        department: "Computer Science & Engineering",
        term: "Semester 5 - Autumn 2026",
        noticeTitle: "CN Practical Defaulter Circular #03",
        reason: "Submissions pending / minimum required practical work not met",
        verified: true,
        status: "ACTIVE",
        publishedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "def_seed_2",
        seatNumber: "S2026031",
        studentId: "2026CS031",
        studentName: "Riya Shah",
        subject: "Computer Networks",
        subjectCode: "CS501",
        attendancePercentage: 58,
        teacherId: "TCH101",
        teacherName: "Dr. Arvind Rao",
        department: "Computer Science & Engineering",
        term: "Semester 5 - Autumn 2026",
        noticeTitle: "CN Practical Defaulter Circular #03",
        reason: "Submissions pending / minimum required practical work not met",
        verified: true,
        status: "ACTIVE",
        publishedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }

  getStudents() {
    return studentDirectory;
  }

  // 1. Manual Single Defaulter Entry with Real-Time Database Verification
  async createManualDefaulter({
    seatNumber,
    studentName,
    subject,
    subjectCode = "SUB101",
    attendancePercentage,
    term = "Semester 5 - Autumn 2026",
    noticeTitle = "Official Subject Defaulter Notice",
    reason = "Attendance shortage / Practical submissions incomplete",
    teacher = {}
  }) {
    if (!seatNumber || !String(seatNumber).trim()) {
      throw new Error("Seat Number is required");
    }
    if (!studentName || !String(studentName).trim()) {
      throw new Error("Student Name is required");
    }
    if (!subject || !String(subject).trim()) {
      throw new Error("Subject is required");
    }
    if (attendancePercentage === undefined || attendancePercentage === null || isNaN(Number(attendancePercentage))) {
      throw new Error("Attendance Percentage is required and must be a valid number");
    }

    const cleanSeatNumber = String(seatNumber).trim().toUpperCase();
    const cleanStudentName = String(studentName).trim();
    const cleanAttendance = Number(attendancePercentage);

    // REAL-TIME DATABASE LOOKUP
    const student = await findStudentBySeatNumber(cleanSeatNumber);
    if (!student) {
      const error = new Error(`❌ Seat Number ${cleanSeatNumber} not found in the official student database.`);
      error.statusCode = 404;
      throw error;
    }

    // Name verification check
    const dbName = student.name.toLowerCase();
    const inputName = cleanStudentName.toLowerCase();
    const nameMatches = dbName.includes(inputName) || inputName.includes(dbName);
    const resolvedName = nameMatches ? student.name : cleanStudentName;
    const resolvedStudentId = student._id || student.id || student.studentId;

    // Check for existing active record in same subject
    const existingIndex = this.defaulterRecords.findIndex(
      d => d.subject.toLowerCase() === subject.toLowerCase() &&
           (d.seatNumber === cleanSeatNumber || d.studentId === resolvedStudentId) &&
           d.status === "ACTIVE"
    );

    const defaulterEntry = {
      id: existingIndex !== -1 ? this.defaulterRecords[existingIndex].id : `def_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      seatNumber: cleanSeatNumber,
      studentId: resolvedStudentId,
      studentName: resolvedName,
      subject: subject.trim(),
      subjectCode,
      attendancePercentage: cleanAttendance,
      teacherId: teacher.studentId || teacher.id || "TCH101",
      teacherName: teacher.name || "Faculty Member",
      department: teacher.department || student.department || "Academic Department",
      term,
      noticeTitle,
      reason,
      verified: true,
      status: "ACTIVE",
      publishedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.defaulterRecords[existingIndex] = defaulterEntry;
    } else {
      this.defaulterRecords.unshift(defaulterEntry);
    }

    // Persist to MongoDB Defaulter if active
    try {
      const DefaulterModel = (await import("../models/mongodb/Defaulter.js")).default;
      await DefaulterModel.findOneAndUpdate(
        { seatNumber: cleanSeatNumber, subject: subject.trim(), status: "ACTIVE" },
        defaulterEntry,
        { upsert: true, new: true }
      );
    } catch (e) {
      // MongoDB optional
    }

    // REAL-TIME TARGETED ALERTS & STUDENT SYNC
    sendNotificationAndSync({
      studentId: resolvedStudentId,
      seatNumber: cleanSeatNumber,
      department: defaulterEntry.department,
      subject: defaulterEntry.subject,
      attendancePercentage: cleanAttendance,
      message: `⚠️ Defaulter Warning: Your attendance in ${defaulterEntry.subject} is ${cleanAttendance}%.`
    });

    return defaulterEntry;
  }

  // 2. File Upload Parser with Strict Seat Number Enforcement
  async parseAndMatchWithSeatNumber({ subject, rawText, rows = [], teacher = {} }) {
    let rawLines = [];

    if (Array.isArray(rows) && rows.length > 0) {
      rawLines = rows;
    } else if (typeof rawText === "string" && rawText.trim()) {
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error("No data provided to parse");
      }

      // Check header row for Seat Number column
      const headerLine = lines[0].toLowerCase();
      const hasSeatHeader = headerLine.includes("seat") || headerLine.includes("prn") || headerLine.includes("seat number") || headerLine.includes("seat no");

      // If headers present and Seat Number is missing, REJECT PARSING
      if (/^(seat|name|student|subject|attendance|roll)/i.test(headerLine) && !hasSeatHeader) {
        const error = new Error("❌ File parsing rejected: Missing required 'Seat Number' column. Please include Seat Number / PRN.");
        error.statusCode = 400;
        throw error;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && /^(seat|name|student|subject|attendance|prn)/i.test(line)) continue;

        const parts = line.split(/[,|\t;]/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 3) {
          // Format: Seat Number | Student Name | Attendance %
          rawLines.push({
            seatNumber: parts[0],
            studentName: parts[1],
            attendancePercentage: parts[2].replace(/%/g, "")
          });
        } else if (parts.length === 2) {
          // Format: Seat Number | Student Name
          rawLines.push({
            seatNumber: parts[0],
            studentName: parts[1],
            attendancePercentage: 65
          });
        } else if (parts.length === 1) {
          rawLines.push({
            seatNumber: parts[0],
            studentName: "",
            attendancePercentage: 65
          });
        }
      }
    }

    if (rawLines.length === 0) {
      const error = new Error("❌ File parsing rejected: Missing required 'Seat Number' column. Please include Seat Number / PRN.");
      error.statusCode = 400;
      throw error;
    }

    // REAL-TIME DATABASE VERIFICATION FOR EVERY ROW
    const stagingResults = [];
    for (let idx = 0; idx < rawLines.length; idx++) {
      const item = rawLines[idx];
      const seatNum = item.seatNumber ? String(item.seatNumber).trim().toUpperCase() : "";
      const attendance = Number(item.attendancePercentage) || 65;

      const student = await findStudentBySeatNumber(seatNum);

      if (student) {
        const dbName = student.name.toLowerCase();
        const inputName = (item.studentName || "").toLowerCase();
        const nameMatches = inputName ? (dbName.includes(inputName) || inputName.includes(dbName)) : true;

        stagingResults.push({
          tempId: `staging_${idx}_${Date.now()}`,
          seatNumber: seatNum,
          studentName: student.name,
          inputName: item.studentName || student.name,
          subject: subject || "General Subject",
          attendancePercentage: attendance,
          matchType: nameMatches ? "MATCHED" : "REVIEW_REQUIRED",
          verified: true,
          matchedStudent: {
            id: student.id || student._id,
            studentId: student.studentId,
            seatNumber: student.seatNumber,
            name: student.name,
            department: student.department,
            year: student.year,
            division: student.division
          },
          selectedForPublish: true
        });
      } else {
        // Seat Number not found in DB
        stagingResults.push({
          tempId: `staging_${idx}_${Date.now()}`,
          seatNumber: seatNum,
          studentName: item.studentName || "Unknown",
          inputName: item.studentName || "Unknown",
          subject: subject || "General Subject",
          attendancePercentage: attendance,
          matchType: "INVALID_SEAT_NUMBER",
          verified: false,
          matchedStudent: null,
          validationError: `❌ Invalid Seat Number: ${seatNum} does not exist in the official student database.`,
          selectedForPublish: false
        });
      }
    }

    const summary = {
      total: stagingResults.length,
      matched: stagingResults.filter(r => r.matchType === "MATCHED").length,
      reviewRequired: stagingResults.filter(r => r.matchType === "REVIEW_REQUIRED").length,
      invalidSeatNumbers: stagingResults.filter(r => r.matchType === "INVALID_SEAT_NUMBER").length
    };

    return { stagingResults, summary };
  }

  // 3. Confirm and Batch Publish Defaulters
  async publishDefaultersBatch({
    subject,
    subjectCode = "SUB101",
    term = "Semester 5 - Autumn 2026",
    noticeTitle = "Official Defaulter Notice",
    reason = "Critical Shortage / Lab Submissions Incomplete",
    records = [],
    teacher = {}
  }) {
    const published = [];

    for (const rec of records) {
      if (!rec.verified && rec.matchType === "INVALID_SEAT_NUMBER") {
        continue; // Block unverified seat numbers
      }

      const seatNumber = rec.seatNumber || rec.matchedStudent?.seatNumber;
      const studentId = rec.matchedStudent?.id || rec.studentId || rec.matchedStudent?.studentId;
      const studentName = rec.matchedStudent?.name || rec.studentName || rec.inputName;
      const attendancePercentage = Number(rec.attendancePercentage) || 65;

      const entry = {
        id: `def_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        seatNumber,
        studentId,
        studentName,
        subject: subject.trim(),
        subjectCode,
        attendancePercentage,
        teacherId: teacher.studentId || teacher.id || "TCH101",
        teacherName: teacher.name || "Faculty Member",
        department: teacher.department || rec.matchedStudent?.department || "Academic Department",
        term,
        noticeTitle,
        reason,
        verified: true,
        status: "ACTIVE",
        publishedAt: new Date().toISOString()
      };

      // Remove previous duplicate for same subject & student
      this.defaulterRecords = this.defaulterRecords.filter(
        d => !(d.subject.toLowerCase() === subject.toLowerCase() &&
               (d.seatNumber === seatNumber || d.studentId === studentId) &&
               d.status === "ACTIVE")
      );

      this.defaulterRecords.unshift(entry);
      published.push(entry);

      // Trigger targeted socket emission for this student
      sendNotificationAndSync({
        studentId,
        seatNumber,
        department: entry.department,
        subject: entry.subject,
        attendancePercentage,
        message: `⚠️ Defaulter Warning: Your attendance in ${entry.subject} is ${attendancePercentage}%.`
      });
    }

    return {
      success: true,
      count: published.length,
      published
    };
  }

  // 4. Get defaulters for a teacher
  getTeacherDefaulters(teacherId, subject = null) {
    return this.defaulterRecords.filter(d => {
      const matchTeacher = !teacherId || d.teacherId === teacherId || teacherId === "ADM001";
      const matchSubject = !subject || d.subject.toLowerCase() === subject.toLowerCase();
      return matchTeacher && matchSubject && d.status === "ACTIVE";
    });
  }

  // 5. Resolve Defaulter
  resolveDefaulter(id, teacherId) {
    const cleanId = String(id || "").trim();
    const index = this.defaulterRecords.findIndex(d =>
      (d.id === cleanId || d.seatNumber?.toUpperCase() === cleanId.toUpperCase()) &&
      d.status === "ACTIVE"
    );
    if (index === -1) {
      // Check even if already resolved or fallback match
      const fallbackIdx = this.defaulterRecords.findIndex(d => d.id === cleanId || d.seatNumber?.toUpperCase() === cleanId.toUpperCase());
      if (fallbackIdx !== -1) return this.defaulterRecords[fallbackIdx];
      return null;
    }

    const removed = this.defaulterRecords[index];
    this.defaulterRecords[index].status = "RESOLVED";
    this.defaulterRecords[index].resolvedAt = new Date().toISOString();
    return removed;
  }

  // 6. Check Student Defaulter Status (by Seat Number or Student ID)
  checkStudentDefaulter(studentIdOrSeat, name = null) {
    const query = String(studentIdOrSeat || "").trim().toUpperCase();
    const cleanName = name ? String(name).trim().toLowerCase() : "";

    // Find student in directory to link all identifiers
    const matchedStudent = studentDirectory.find(s =>
      s.seatNumber.toUpperCase() === query ||
      s.studentId.toUpperCase() === query ||
      s.id.toUpperCase() === query ||
      (cleanName && s.name.toLowerCase().includes(cleanName))
    );

    const keys = new Set([query]);
    if (matchedStudent) {
      if (matchedStudent.seatNumber) keys.add(matchedStudent.seatNumber.toUpperCase());
      if (matchedStudent.studentId) keys.add(matchedStudent.studentId.toUpperCase());
      if (matchedStudent.id) keys.add(matchedStudent.id.toUpperCase());
      if (matchedStudent._id) keys.add(String(matchedStudent._id).toUpperCase());
    }

    const active = this.defaulterRecords.filter(d => {
      if (d.status !== "ACTIVE") return false;
      const dSeat = (d.seatNumber || "").toUpperCase();
      const dStudId = (d.studentId || "").toUpperCase();
      const dId = (d.id || "").toUpperCase();

      for (const k of keys) {
        if (k && (dSeat === k || dStudId === k || dId === k)) return true;
      }
      if (cleanName && d.studentName?.toLowerCase() === cleanName) return true;
      return false;
    });

    return {
      isDefaulter: active.length > 0,
      count: active.length,
      defaulterRecords: active
    };
  }

  // 7. Get All Defaulters for Admin
  getAllDefaulters(department = null) {
    return this.defaulterRecords.filter(d => {
      const matchDept = !department || d.department.toLowerCase() === department.toLowerCase();
      return matchDept && d.status === "ACTIVE";
    });
  }
}

export const defaulterService = new DefaulterService();
