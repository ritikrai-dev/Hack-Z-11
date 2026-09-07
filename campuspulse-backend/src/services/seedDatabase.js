import mongoose from "mongoose";
import { env } from "../config/env.js";
import Notice from "../models/mongodb/Notice.js";
import Story from "../models/mongodb/Story.js";

const initialNotices = [
  {
    noticeId: "notice_101",
    title: "Mid-Term Examination Schedule Rescheduled",
    content: "Due to the upcoming state holiday, the CS & IT Mid-Term examinations previously scheduled for October 12 have been shifted to October 16. Detailed room and seat allocation numbers will be published on the department portal by Friday 5 PM. Students are advised to bring their College ID cards.",
    category: "Exams",
    categoryColor: "#EF4444",
    urgency: "urgent",
    urgentPulse: true,
    department: "Computer Science Dept",
    verified: true,
    verifiedTooltip: "Verified by Controller of Examinations",
    aiSummary: "TL;DR: Mid-terms shifted from Oct 12 to Oct 16. Bring ID card.",
    fullAiSummary: "Examinations for CS & IT departments delayed by 4 days due to state holiday. Room allocations available Friday.",
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    deadlineDaysLeft: 4,
    deadlineProgress: 0.75,
    views: 342,
    saves: 89,
    bookmarked: true,
    reminderSet: true,
    relevanceScore: 98,
    postedAt: "2h ago",
    attachments: [
      { name: "revised_datesheet_fall2026.pdf", url: "https://campuspulse.edu/docs/datesheet.pdf", size: "245 KB" }
    ],
    authorRole: "TEACHER",
    authorId: "TCH101",
    status: "published"
  },
  {
    noticeId: "notice_102",
    title: "CS302 Algorithm Lab — Batch Allocations",
    content: "All 3rd Year CS students must check their respective lab batches for CS302 Advanced Algorithms. Batch A will report to Lab 2 on Tuesdays at 2 PM, while Batch B will report on Thursdays at 2 PM. Lab manual must be signed before each session.",
    category: "Academic",
    categoryColor: "#2D5BFF",
    urgency: "normal",
    urgentPulse: false,
    department: "Department of Computer Science",
    verified: true,
    verifiedTooltip: "Posted by Dr. Arvind Rao (Faculty Lead)",
    aiSummary: "TL;DR: Check Batch A (Tue 2PM) & Batch B (Thu 2PM) for CS302 Lab.",
    fullAiSummary: "Laboratory sessions starting this week. Manuals required at start of each session.",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    deadlineDaysLeft: 2,
    deadlineProgress: 0.6,
    views: 215,
    saves: 45,
    bookmarked: false,
    reminderSet: false,
    relevanceScore: 94,
    postedAt: "5h ago",
    attachments: [
      { name: "cs302_batch_list.pdf", url: "https://campuspulse.edu/docs/batches.pdf", size: "120 KB" }
    ],
    authorRole: "TEACHER",
    authorId: "TCH101",
    status: "published"
  },
  {
    noticeId: "notice_103",
    title: "HackSprint 2026: 48-Hour Open Campus Hackathon",
    content: "The Coding Club invites all undergraduate students to participate in HackSprint 2026! Themes include Edge AI, Decentralized Campus Systems, and Climate Tech. Total prize pool is $5,000 with internships from partner tech accelerators.",
    category: "Clubs",
    categoryColor: "#8B5CF6",
    urgency: "normal",
    urgentPulse: false,
    department: "Coding Club",
    verified: true,
    verifiedTooltip: "Official Coding Club Executive Notice",
    aiSummary: "TL;DR: 48h Hackathon with $5,000 prize pool. 4 members per team.",
    fullAiSummary: "Teams of 4 students can register free. Mentorship provided by alumni software engineers.",
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
    deadlineDaysLeft: 7,
    deadlineProgress: 0.3,
    views: 580,
    saves: 142,
    bookmarked: true,
    reminderSet: false,
    relevanceScore: 91,
    postedAt: "1d ago",
    attachments: [
      { name: "hackathon_guidelines_2026.pdf", url: "https://campuspulse.edu/docs/hack.pdf", size: "410 KB" }
    ],
    authorRole: "CLUB_LEADER",
    authorId: "CLB201",
    status: "published"
  },
  {
    noticeId: "notice_104",
    title: "Autonomous Drone & Rover Workshop Registration",
    content: "The Robotics Guild is hosting a weekend hands-on robotics boot camp. Participants will assemble obstacle avoidance drones using ROS2 and Raspberry Pi 5. Hardware kits provided for workshop duration.",
    category: "Clubs",
    categoryColor: "#8B5CF6",
    urgency: "normal",
    urgentPulse: false,
    department: "Robotics Guild",
    verified: true,
    verifiedTooltip: "Official Robotics Guild Announcement",
    aiSummary: "TL;DR: Hands-on drone boot camp with ROS2 & Raspberry Pi.",
    fullAiSummary: "Hardware kits included. Limited to 40 seats. Register via Events tab.",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    deadlineDaysLeft: 3,
    deadlineProgress: 0.5,
    views: 410,
    saves: 67,
    bookmarked: false,
    reminderSet: false,
    relevanceScore: 88,
    postedAt: "2d ago",
    attachments: [],
    authorRole: "CLUB_LEADER",
    authorId: "CLB201",
    status: "published"
  },
  {
    noticeId: "notice_105",
    title: "Central Library Book Return & Digital Lending Update",
    content: "All semester books borrowed before August must be renewed or returned to the Central Library circulation desk by this Friday to avoid overdue fines. The new digital IEEE & Springer portal is now accessible via student login credentials.",
    category: "Administrative",
    categoryColor: "#0F766E",
    urgency: "normal",
    urgentPulse: false,
    department: "Campus Administration",
    verified: true,
    verifiedTooltip: "Verified Central Library Notice",
    aiSummary: "TL;DR: Renew semester books by Friday to avoid overdue fines.",
    fullAiSummary: "Access IEEE Xplore digital papers directly through CampusPulse portal login.",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    deadlineDaysLeft: 5,
    deadlineProgress: 0.45,
    views: 180,
    saves: 20,
    bookmarked: false,
    reminderSet: false,
    relevanceScore: 82,
    postedAt: "3d ago",
    attachments: [],
    authorRole: "ADMIN",
    authorId: "ADM001",
    status: "published"
  }
];

const initialStories = [
  { storyId: "st_1", title: "Dean's Fall Address", tag: "Admin", author: "Office of the Dean", avatar: "🎓", urgent: true },
  { storyId: "st_2", title: "Robotics Showcase", tag: "Tech", author: "Robotics Guild", avatar: "🤖", urgent: false },
  { storyId: "st_3", title: "Hackathon Reveal", tag: "Code", author: "Coding Club", avatar: "💻", urgent: true },
  { storyId: "st_4", title: "Design Sprint Recap", tag: "Creative", author: "Design Collective", avatar: "🎨", urgent: false }
];

export async function seedMongoDB() {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!env.mongoUri) return;
      await mongoose.connect(env.mongoUri);
    }

    const count = await Notice.countDocuments();
    if (count === 0) {
      console.log("🌱 Seeding initial notices into MongoDB Atlas...");
      for (const n of initialNotices) {
        await Notice.findOneAndUpdate({ noticeId: n.noticeId }, n, { upsert: true, new: true });
      }
      console.log(`✅ Seeded ${initialNotices.length} production notices in MongoDB Atlas.`);
    }

    const storyCount = await Story.countDocuments();
    if (storyCount === 0) {
      console.log("🌱 Seeding urgent campus stories into MongoDB Atlas...");
      for (const s of initialStories) {
        await Story.findOneAndUpdate({ storyId: s.storyId }, s, { upsert: true, new: true });
      }
      console.log(`✅ Seeded ${initialStories.length} urgent stories in MongoDB Atlas.`);
    }

    return true;
  } catch (err) {
    console.warn("⚠️ MongoDB seeding skipped/error:", err.message);
    return false;
  }
}

// Allow running directly: node src/services/seedDatabase.js
if (process.argv[1]?.endsWith("seedDatabase.js")) {
  seedMongoDB().then(() => {
    console.log("MongoDB Seeding complete.");
    process.exit(0);
  });
}
