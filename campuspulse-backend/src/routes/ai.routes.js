import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { mockDatabase } from "../services/mockData.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

// Quick Prompts for Campus Assistant
router.get("/assistant/quick-prompts", (req, res) => {
  return success(res, "Quick prompts fetched successfully", {
    prompts: mockDatabase.quickPrompts
  });
});

// AI Assistant Chat with Rich Embedded Mini Cards
router.post("/assistant/chat", (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return failure(res, "Prompt message is required", 400);
  }

  const query = message.toLowerCase();
  let replyText = "";
  let embeddedCard = null;

  if (query.includes("exam") || query.includes("deadline") || query.includes("mid-sem")) {
    replyText = "The Computer Science Department rescheduled Mid-Sem exams by 3 days. Your next exam commences on Monday at 10:00 AM in Hall 101. Lab deadlines are also extended by 72 hours.";
    embeddedCard = {
      type: "notice",
      data: mockDatabase.notices[0]
    };
  } else if (query.includes("wifi") || query.includes("internet") || query.includes("maintenance")) {
    replyText = "Campus IT will perform maintenance on hostel distribution switches tonight between 11 PM and 2 AM. Library networks and cloud services will remain operational.";
    embeddedCard = {
      type: "notice",
      data: mockDatabase.notices[3]
    };
  } else if (query.includes("conflict") || query.includes("clash")) {
    replyText = "You have 1 active schedule conflict today at 3 PM: 'Robotics Workshop' overlaps with 'Guest Lecture on Quantum Tech'. 87 other classmates also have this clash.";
    embeddedCard = {
      type: "conflict",
      data: mockDatabase.conflictBanner
    };
  } else if (query.includes("event") || query.includes("hackathon") || query.includes("workshop") || query.includes("today")) {
    replyText = "Here is the top event matching your tech interests: 'Edge AI & Embedded Robotics Workshop' tomorrow from 2:00 PM to 4:30 PM in Turing Lab 402. There are 38 students checked in live right now.";
    embeddedCard = {
      type: "event",
      data: mockDatabase.events[0]
    };
  } else {
    replyText = `I analyzed the campus feed for "${message}". You currently have 2 urgent notices and 1 registered workshop tomorrow. Let me know if you need assistance with hall tickets, faculty slots, or club registrations!`;
    embeddedCard = {
      type: "notice",
      data: mockDatabase.notices[1]
    };
  }

  return success(res, "Assistant response generated", {
    query: message,
    reply: replyText,
    embeddedCard,
    timestamp: new Date().toISOString()
  });
});

// Voice Input Transcription
router.post("/assistant/transcribe", (req, res) => {
  const mockQueries = [
    "What exams are scheduled for this week?",
    "Show me the Wi-Fi maintenance window",
    "Resolve my 3 PM schedule conflict",
    "Where is the Edge AI workshop happening?"
  ];
  const sample = mockQueries[Math.floor(Math.random() * mockQueries.length)];

  return success(res, "Audio transcribed successfully", {
    transcription: sample,
    confidence: 0.98
  });
});

// Retrain Recommendations Engine
router.post("/recommendations/retrain", (req, res) => {
  const interests = req.body.interests || mockDatabase.currentUser.interests;
  if (req.body.interests) {
    mockDatabase.currentUser.interests = interests;
  }

  // Recalculate notice relevance scores
  mockDatabase.notices.forEach(n => {
    let score = 70;
    if (interests.some(i => n.title.toLowerCase().includes(i.toLowerCase()))) score += 25;
    if (n.category === "Academic") score += 15;
    n.relevanceScore = Math.min(99, score);
  });

  return success(res, "Recommendation weights updated successfully", {
    interestsRetrained: interests,
    message: "Smart sorting feed refreshed with your latest learning vectors",
    updatedScores: mockDatabase.notices.map(n => ({ id: n.id, relevanceScore: n.relevanceScore }))
  });
});

export default router;
