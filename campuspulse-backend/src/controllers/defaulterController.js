import * as XLSX from "xlsx";
import { defaulterService, findStudentBySeatNumber } from "../services/defaulter.service.js";
import { sendNotificationAndSync } from "../services/notificationService.js";
import { getIO } from "../services/socket.service.js";

// Header matching helper
function normalizeHeader(key) {
  return String(key || "").trim().toLowerCase().replace(/[_-]/g, " ");
}

function matchColumn(obj, candidateNames) {
  for (const key of Object.keys(obj)) {
    const norm = normalizeHeader(key);
    for (const cand of candidateNames) {
      if (norm === cand || norm.includes(cand)) {
        return obj[key];
      }
    }
  }
  return undefined;
}

// 1. Single / Manual Defaulter Entry
export async function createManualDefaulter(req, res) {
  try {
    const {
      seatNumber,
      studentName,
      subject,
      subjectCode,
      attendancePercentage,
      department,
      year,
      division,
      term,
      noticeTitle,
      reason
    } = req.body;

    // Validation & Sanitization
    if (!seatNumber || !String(seatNumber).trim()) {
      return res.status(400).json({ success: false, message: "Seat Number is required" });
    }
    if (!studentName || !String(studentName).trim()) {
      return res.status(400).json({ success: false, message: "Student Name is required" });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, message: "Subject is required" });
    }
    if (attendancePercentage === undefined || attendancePercentage === null || isNaN(Number(attendancePercentage))) {
      return res.status(400).json({ success: false, message: "Attendance Percentage is required and must be a number" });
    }

    const cleanAttendance = Number(attendancePercentage);
    if (cleanAttendance < 0 || cleanAttendance > 100) {
      return res.status(400).json({ success: false, message: "Attendance percentage must be between 0 and 100" });
    }

    const cleanSeatNumber = String(seatNumber).trim().toUpperCase();
    const cleanStudentName = String(studentName).trim();
    const cleanSubject = String(subject).trim();

    // Database lookup
    const student = await findStudentBySeatNumber(cleanSeatNumber);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "❌ Seat Number " + cleanSeatNumber + " not found in the official student database."
      });
    }

    const resolvedStudentId = student._id || student.id || student.studentId;
    const resolvedStudentName = student.name || cleanStudentName;
    const resolvedDepartment = department || student.department || req.user?.department || "Computer Science & Engineering";

    // Check for existing active record in same subject
    const existingIndex = defaulterService.defaulterRecords.findIndex(
      d => d.subject.toLowerCase() === cleanSubject.toLowerCase() &&
           (d.seatNumber === cleanSeatNumber || d.studentId === resolvedStudentId) &&
           d.status === "ACTIVE"
    );

    const newDefaulter = {
      id: existingIndex !== -1 ? defaulterService.defaulterRecords[existingIndex].id : "def_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      seatNumber: cleanSeatNumber,
      studentId: resolvedStudentId,
      studentName: resolvedStudentName,
      subject: cleanSubject,
      subjectCode: subjectCode || "SUB101",
      attendancePercentage: cleanAttendance,
      teacherId: req.user?.studentId || req.user?.id || "TCH101",
      teacherName: req.user?.name || "Faculty Member",
      department: resolvedDepartment,
      year: year || student.year || "3rd Year",
      division: division || student.division || "A",
      term: term || "Semester 5 - Autumn 2026",
      noticeTitle: noticeTitle || "Official Defaulter Notice",
      reason: reason || "Attendance shortage / Practical submissions incomplete",
      verified: true,
      status: "ACTIVE",
      publishedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      defaulterService.defaulterRecords[existingIndex] = newDefaulter;
    } else {
      defaulterService.defaulterRecords.unshift(newDefaulter);
    }

    // Persist to MongoDB Defaulter collection if available
    try {
      const DefaulterModel = (await import("../models/mongodb/Defaulter.js")).default;
      await DefaulterModel.findOneAndUpdate(
        { seatNumber: cleanSeatNumber, subject: cleanSubject, status: "ACTIVE" },
        newDefaulter,
        { upsert: true, new: true }
      );
    } catch (e) {
      // In-memory fallback
    }

    // Real-Time Socket Broadcast & Push Notification
    const io = getIO();
    if (io) {
      io.to("room:user_" + resolvedStudentId).emit("defaulter:updated", newDefaulter);
      if (cleanSeatNumber !== resolvedStudentId) {
        io.to("room:user_" + cleanSeatNumber).emit("defaulter:updated", newDefaulter);
      }
      io.to("room:user_" + resolvedStudentId).emit("ai:cache:invalidate", { type: "defaulter", studentId: resolvedStudentId });
    }

    sendNotificationAndSync({
      studentId: resolvedStudentId,
      seatNumber: cleanSeatNumber,
      department: newDefaulter.department,
      subject: newDefaulter.subject,
      attendancePercentage: cleanAttendance,
      message: "⚠️ Defaulter Warning: Your attendance in " + newDefaulter.subject + " is " + cleanAttendance + "%."
    });

    return res.status(201).json({
      success: true,
      message: "Student with Seat No " + cleanSeatNumber + " successfully verified and flagged as defaulter",
      data: {
        ...newDefaulter,
        defaulter: newDefaulter
      },
      defaulter: newDefaulter
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to process defaulter record"
    });
  }
}

// 2. File Upload & Parser Engine (Excel, CSV, JSON)
export async function uploadDefaulters(req, res) {
  try {
    let rawRows = [];

    // Check if uploaded via multer (file buffer)
    if (req.file && req.file.buffer) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else if (Array.isArray(req.body.rows)) {
      rawRows = req.body.rows;
    } else if (Array.isArray(req.body.records)) {
      rawRows = req.body.records;
    } else if (Array.isArray(req.body.data)) {
      rawRows = req.body.data;
    } else if (typeof req.body.rawText === "string" && req.body.rawText.trim()) {
      const lines = req.body.rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const headerLine = lines[0].toLowerCase();
        const hasSeatHeader = headerLine.includes("seat") || headerLine.includes("prn") || headerLine.includes("seat number") || headerLine.includes("seat no");
        if (/^(seat|name|student|subject|attendance|roll)/i.test(headerLine) && !hasSeatHeader) {
          return res.status(400).json({
            success: false,
            message: "❌ File parsing rejected: Missing required 'Seat Number' column. Please include Seat Number / PRN."
          });
        }

        const headers = lines[0].split(/[,\t|]/).map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[,\t|]/).map(c => c.trim());
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx] || "";
          });
          rawRows.push(obj);
        }
      }
    }

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No defaulter data found. Please provide an Excel file or row data."
      });
    }

    const defaultSubject = req.body.subject || "General";
    const insertedRecords = [];
    const failedRows = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 1;

      // Header matching
      const rawSeat = matchColumn(row, ["seat number", "seat no", "seatno", "prn", "registration no", "seat_number", "seat"]);
      const rawName = matchColumn(row, ["student name", "name", "full name", "student_name"]);
      const rawSubject = matchColumn(row, ["subject name", "subject", "course", "subject_name"]) || defaultSubject;
      const rawAtt = matchColumn(row, ["attendance %", "attendance percentage", "attendance", "percentage", "attendance_pct"]);

      if (!rawSeat || !String(rawSeat).trim()) {
        failedRows.push({
          row: rowNum,
          seatNumber: "N/A",
          reason: "Missing Seat Number in row data"
        });
        continue;
      }

      const cleanSeat = String(rawSeat).trim().toUpperCase();
      let cleanAtt = 50;
      if (rawAtt !== undefined && rawAtt !== null && rawAtt !== "") {
        const parsed = Number(String(rawAtt).replace(/%/g, "").trim());
        if (!isNaN(parsed)) cleanAtt = parsed;
      }

      // Verify Seat Number against Database
      const student = await findStudentBySeatNumber(cleanSeat);
      if (!student) {
        failedRows.push({
          row: rowNum,
          seatNumber: cleanSeat,
          reason: "Seat Number not found in official student database"
        });
        continue;
      }

      const resolvedStudentId = student._id || student.id || student.studentId;
      const resolvedStudentName = student.name || String(rawName || "").trim() || "Student";
      const cleanSubject = String(rawSubject || defaultSubject).trim();

      const existingIdx = defaulterService.defaulterRecords.findIndex(
        d => d.subject.toLowerCase() === cleanSubject.toLowerCase() &&
             (d.seatNumber === cleanSeat || d.studentId === resolvedStudentId) &&
             d.status === "ACTIVE"
      );

      const recordId = existingIdx !== -1 ? defaulterService.defaulterRecords[existingIdx].id : ("def_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));

      const newDefaulter = {
        id: recordId,
        seatNumber: cleanSeat,
        studentId: resolvedStudentId,
        studentName: resolvedStudentName,
        subject: cleanSubject,
        subjectCode: req.body.subjectCode || "SUB101",
        attendancePercentage: cleanAtt,
        teacherId: req.user?.studentId || req.user?.id || "TCH101",
        teacherName: req.user?.name || "Faculty Member",
        department: student.department || req.body.department || "Computer Science & Engineering",
        year: student.year || "3rd Year",
        division: student.division || "A",
        term: req.body.term || "Semester 5 - Autumn 2026",
        noticeTitle: req.body.noticeTitle || ("Defaulter List - " + cleanSubject),
        reason: req.body.reason || "Attendance shortage",
        verified: true,
        status: "ACTIVE",
        publishedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        defaulterService.defaulterRecords[existingIdx] = newDefaulter;
      } else {
        defaulterService.defaulterRecords.unshift(newDefaulter);
      }

      // Persist to MongoDB
      try {
        const DefaulterModel = (await import("../models/mongodb/Defaulter.js")).default;
        await DefaulterModel.findOneAndUpdate(
          { seatNumber: cleanSeat, subject: cleanSubject, status: "ACTIVE" },
          newDefaulter,
          { upsert: true, new: true }
        );
      } catch (e) {}

      // Socket & Notification
      const io = getIO();
      if (io) {
        io.to("room:user_" + resolvedStudentId).emit("defaulter:updated", newDefaulter);
        io.to("room:user_" + cleanSeat).emit("defaulter:updated", newDefaulter);
        io.to("room:user_" + resolvedStudentId).emit("ai:cache:invalidate", { type: "defaulter", studentId: resolvedStudentId });
      }

      sendNotificationAndSync({
        studentId: resolvedStudentId,
        seatNumber: cleanSeat,
        department: newDefaulter.department,
        subject: newDefaulter.subject,
        attendancePercentage: cleanAtt,
        message: "⚠️ Defaulter Warning: Your attendance in " + newDefaulter.subject + " is " + cleanAtt + "%."
      });

      insertedRecords.push(newDefaulter);
    }

    const summary = {
      total: rawRows.length,
      matched: insertedRecords.length,
      invalidSeatNumbers: failedRows.length
    };

    return res.status(200).json({
      success: true,
      totalRows: rawRows.length,
      insertedCount: insertedRecords.length,
      failedRows,
      summary,
      stagingResults: insertedRecords,
      data: {
        records: insertedRecords,
        stagingResults: insertedRecords,
        summary
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process defaulters upload"
    });
  }
}

// 3. Get Student Defaulters (queries BOTH studentId AND seatNumber)
export function getStudentDefaulters(req, res) {
  try {
    const { studentId } = req.params;
    const result = defaulterService.checkStudentDefaulter(studentId);
    return res.status(200).json({
      success: true,
      isDefaulter: result.isDefaulter,
      count: result.count,
      defaulters: result.defaulterRecords,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 4. Get Authenticated User Defaulters (/me)
export function getMyDefaulters(req, res) {
  try {
    const identifier = req.user?.seatNumber || req.user?.studentId || req.user?.id;
    const result = defaulterService.checkStudentDefaulter(identifier, req.user?.name);
    return res.status(200).json({
      success: true,
      isDefaulter: result.isDefaulter,
      count: result.count,
      defaulters: result.defaulterRecords,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 5. Get Teacher Defaulters
export function getTeacherDefaulters(req, res) {
  try {
    const teacherId = req.user?.studentId || req.user?.id || "TCH101";
    const { subject } = req.query;
    const defaulters = defaulterService.getTeacherDefaulters(teacherId, subject);
    return res.status(200).json({
      success: true,
      count: defaulters.length,
      defaulters,
      data: defaulters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 6. Resolve Defaulter
export function resolveDefaulter(req, res) {
  try {
    const { id } = req.params;
    const resolved = defaulterService.resolveDefaulter(id, req.user?.studentId);
    if (!resolved) {
      return res.status(404).json({ success: false, message: "Defaulter entry not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Student " + resolved.studentName + " removed from defaulter list",
      resolved,
      data: resolved
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 7. Check Student
export function checkStudent(req, res) {
  try {
    const { studentId } = req.params;
    const { seatNumber, name } = req.query;
    const result = defaulterService.checkStudentDefaulter(seatNumber || studentId, name);
    return res.status(200).json({
      success: true,
      data: result,
      ...result
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// 8. Admin Defaulters
export function getAdminDefaulters(req, res) {
  try {
    const { department } = req.query;
    const defaulters = defaulterService.getAllDefaulters(department);
    return res.status(200).json({
      success: true,
      totalCount: defaulters.length,
      defaulters,
      data: defaulters
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
