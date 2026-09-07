import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { mockDatabase } from "../services/mockData.js";
import { examService } from "../services/exam.service.js";
import { defaulterService } from "../services/defaulter.service.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

// 1. Contextual Quick Prompts for College AI Assistant
router.get("/assistant/quick-prompts", (req, res) => {
  const quickPrompts = [
    { id: "qp_1", label: "📅 Upcoming Events", query: "What events are happening this week?" },
    { id: "qp_2", label: "📝 My Exams", query: "When is my BMMS exam?" },
    { id: "qp_3", label: "📢 Latest Notices", query: "Show me the latest college notices" },
    { id: "qp_4", label: "⚠️ Defaulter Status", query: "Am I on any defaulter list?" }
  ];

  return success(res, "Quick prompts fetched successfully", {
    prompts: quickPrompts
  });
});

// 2. Student-Authenticated, Database-Grounded AI Assistant
router.post("/assistant/chat", (req, res) => {
  const rawMsg = req.body.message || req.body.query || req.body.prompt;
  if (!rawMsg || !String(rawMsg).trim()) {
    return failure(res, "Prompt message is required", 400);
  }
  const message = String(rawMsg).trim();

  const student = req.user || mockDatabase.currentUser;
  const studentId = student.studentId || student.id || "2023CS042";
  const studentName = student.name || "Student";
  const studentRoll = student.rollNo || (studentId.match(/\d+$/) ? studentId.match(/\d+$/)[0] : "42");
  const query = message.toLowerCase().trim();

  let replyText = "";
  let embeddedCard = null;
  let intent = "general";

  // INTENT 1: EXAM TIMETABLE LOOKUP
  if (
    query.includes("exam") ||
    query.includes("bmms") ||
    query.includes("timetable") ||
    query.includes("schedule") ||
    query.includes("when is my") ||
    query.includes("test") ||
    query.includes("paper")
  ) {
    intent = "exam_timetable";

    if (query.includes("bmms")) {
      const bmmsExam = examService.findExamBySubject("bmms");
      if (bmmsExam) {
        replyText = `📚 Your BMMS exam is scheduled for ${bmmsExam.date} at ${bmmsExam.time.split("-")[0].trim()} in ${bmmsExam.room}.\n\nReporting time is ${bmmsExam.reportingTime}. Please ensure your physical Hall Ticket is verified before entry.`;
        embeddedCard = {
          type: "exam",
          data: bmmsExam
        };
      } else {
        replyText = "I couldn't find the BMMS exam in the latest college records.";
      }
    } else if (query.includes("network") || query.includes("cn")) {
      const cnExam = examService.findExamBySubject("computer networks");
      if (cnExam) {
        replyText = `📚 Your Computer Networks exam is on ${cnExam.date} from ${cnExam.time} in ${cnExam.room}.`;
        embeddedCard = { type: "exam", data: cnExam };
      }
    } else if (query.includes("dbms") || query.includes("database")) {
      const dbmsExam = examService.findExamBySubject("database");
      if (dbmsExam) {
        replyText = `📚 Your Database Management Systems exam is on ${dbmsExam.date} from ${dbmsExam.time} in ${dbmsExam.room}.`;
        embeddedCard = { type: "exam", data: dbmsExam };
      }
    } else if (query.includes("os") || query.includes("operating system")) {
      const osExam = examService.findExamBySubject("operating");
      if (osExam) {
        replyText = `📚 Your Operating Systems exam is on ${osExam.date} from ${osExam.time} in ${osExam.room}.`;
        embeddedCard = { type: "exam", data: osExam };
      }
    } else {
      // General Exam Timetable for Student
      const exams = examService.getExamsForStudent(student);
      if (exams.length > 0) {
        const nextExam = exams[0];
        replyText = `📝 Here is your upcoming exam schedule for ${nextExam.course} (${student.department || "Computer Science"}):\n\n` +
          exams.map((e, idx) => `${idx + 1}. ${e.subject}\n   📅 ${e.date} · ⏰ ${e.time}\n   📍 ${e.room}`).join("\n\n");
        embeddedCard = {
          type: "exam_list",
          data: {
            course: nextExam.course,
            totalExams: exams.length,
            exams: exams.slice(0, 3)
          }
        };
      } else {
        replyText = "I couldn't find any upcoming exams for your department in the college records.";
      }
    }
  }

  // INTENT 2: DEFAULTER LIST STATUS CHECK
  else if (
    query.includes("defaulter") ||
    query.includes("shortage") ||
    query.includes("blacklist") ||
    query.includes("detain") ||
    query.includes("detention")
  ) {
    intent = "defaulter_check";

    const studentSeat = student.seatNumber || student.studentId || student.id;
    const defaulterCheck = defaulterService.checkStudentDefaulter(studentSeat, studentName);

    if (defaulterCheck.isDefaulter) {
      const records = defaulterCheck.defaulterRecords;
      const subjects = records.map(r => r.subject).join(", ");

      replyText = `⚠️ Attention ${studentName}: You are currently listed on ${records.length} active Defaulter List(s) for: ${subjects}.\n\n` +
        records.map(r => `• ${r.subject} (${r.subjectCode || "N/A"})\n  Seat No: ${r.seatNumber} · Attendance: ${r.attendancePercentage}%\n  Flagged by: ${r.teacherName}\n  Notice: "${r.noticeTitle}"\n  Reason: ${r.reason}`).join("\n\n") +
        `\n\nPlease contact your course faculty (${records[0].teacherName}) immediately to resolve your status.`;

      embeddedCard = {
        type: "defaulter_alert",
        data: {
          isDefaulter: true,
          studentName,
          seatNumber: records[0]?.seatNumber || studentSeat,
          records
        }
      };
    } else {
      replyText = `✅ Good news, ${studentName}! You are NOT listed on any active defaulter lists in the college database. Your academic status is completely clear.`;

      embeddedCard = {
        type: "defaulter_clear",
        data: {
          isDefaulter: false,
          studentName,
          seatNumber: studentSeat,
          message: "All clear across all registered subjects"
        }
      };
    }
  }

  // INTENT 3: EVENTS & WORKSHOPS
  else if (
    query.includes("event") ||
    query.includes("hackathon") ||
    query.includes("workshop") ||
    query.includes("intra") ||
    query.includes("inter") ||
    query.includes("happening") ||
    query.includes("fests") ||
    query.includes("competition")
  ) {
    intent = "events";

    const events = mockDatabase.events || [];
    if (events.length > 0) {
      replyText = `🎉 Here are the highlighted campus events coming up:\n\n` +
        events.slice(0, 3).map((evt, idx) => `${idx + 1}. ${evt.title}\n   📅 ${evt.date} · ⏰ ${evt.time || "10:00 AM"}\n   📍 ${evt.location || evt.venue || "Campus Auditorium"}\n   🏷️ [${evt.scope || "CAMPUS"}]`).join("\n\n");

      embeddedCard = {
        type: "event",
        data: events[0]
      };
    } else {
      replyText = "I couldn't find any scheduled campus events at this time.";
    }
  }

  // INTENT 4: NOTICES & OFFICIAL CIRCULARS
  else if (
    query.includes("notice") ||
    query.includes("circular") ||
    query.includes("announcement") ||
    query.includes("deadline") ||
    query.includes("holiday") ||
    query.includes("update")
  ) {
    intent = "notices";

    const notices = mockDatabase.notices || [];
    if (notices.length > 0) {
      const topNotices = notices.slice(0, 3);
      replyText = `📢 Top official circulars from your college administration:\n\n` +
        topNotices.map((n, idx) => `${idx + 1}. ${n.title}\n   🏛️ ${n.department} · 📅 ${n.date || "Recent"}\n   ℹ️ ${n.summary || n.description || ""}`).join("\n\n");

      embeddedCard = {
        type: "notice",
        data: topNotices[0]
      };
    } else {
      replyText = "I couldn't find any active official circulars in the college records.";
    }
  }

  // GENERAL CAMPUS CONTEXT (GROUNDED)
  else {
    replyText = `Hello ${studentName}! I am your UniSync AI Assistant. I am directly connected to your official college database.\n\nYou can ask me:\n• "When is my exam schedule?"\n• "Am I in the defaulter list?"\n• "What events are happening this week?"\n• "Show me the latest college notices"`;

    embeddedCard = {
      type: "quick_actions",
      data: {
        suggested: ["When is my exam schedule?", "Am I a defaulter?", "What events are happening this week?"]
      }
    };
  }

  return success(res, "Assistant response generated", {
    query: message,
    intent,
    reply: replyText,
    replyText,
    embeddedCard,
    studentContext: {
      studentId,
      studentName,
      department: student.department
    },
    timestamp: new Date().toISOString()
  });
});

// 3. Voice Input Transcription
router.post("/assistant/transcribe", (req, res) => {
  const mockQueries = [
    "When is my BMMS exam?",
    "Am I on any defaulter list?",
    "What events are happening this week?",
    "Show me the latest notices"
  ];
  const sample = mockQueries[Math.floor(Math.random() * mockQueries.length)];

  return success(res, "Audio transcribed successfully", {
    transcription: sample,
    confidence: 0.98
  });
});

export default router;
