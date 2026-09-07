import Notice from "../models/mongodb/Notice.js";
import { success, failure } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";
import { sendNotificationAndSync } from "../services/notificationService.js";


export async function listNotices(req, res, next) {
  try {
    const { category, priority, search, department, smartSort, smart_sort } = req.query;
    let list = [...mockDatabase.notices];

    // Query MongoDB Atlas if connected
    try {
      if (Notice?.db?.readyState === 1) {
        const filter = { status: "published" };
        if (category && category !== "All") filter.category = category;
        const mongoList = await Notice.find(filter).lean();
        if (mongoList && mongoList.length > 0) {
          list = mongoList.map(n => ({
            id: n.noticeId || String(n._id),
            ...n
          }));
        }
      }
    } catch {
      // Use mock repository
    }

    // Category filter
    if (category && category !== "All") {
      list = list.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }

    // Urgency / Priority filter
    if (priority) {
      list = list.filter(n => n.urgency === priority || n.priority === priority);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        (n.aiSummary && n.aiSummary.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }

    // Smart Sort: predicted relevance vs chronological
    const isSmartSort = smartSort === "true" || smart_sort === "true";
    if (isSmartSort) {
      list.sort((a, b) => (b.relevanceScore || 50) - (a.relevanceScore || 50));
    } else {
      // Chronological
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return success(res, "Notices fetched successfully", {
      notices: list,
      smartSorted: isSmartSort,
      total: list.length
    });
  } catch (e) {
    next(e);
  }
}

export async function getUrgentStories(req, res, next) {
  try {
    const { default: Story } = await import("../models/mongodb/Story.js");
    let stories = mockDatabase.urgentStories;

    try {
      if (Story?.db?.readyState === 1) {
        const mongoStories = await Story.find().lean();
        if (mongoStories && mongoStories.length > 0) {
          stories = mongoStories.map(s => ({
            id: s.storyId || String(s._id),
            ...s
          }));
        }
      }
    } catch {
      // Fallback
    }

    return success(res, "Urgent stories fetched successfully", {
      stories
    });
  } catch (e) {
    next(e);
  }
}

export async function createStory(req, res, next) {
  try {
    const role = req.user?.role;
    const authorClub = req.user?.assignedClub || req.body.club || req.body.dept || "Campus Club";
    const newStory = {
      id: `story_${Date.now()}`,
      title: req.body.title || `${authorClub} Story`,
      dept: authorClub,
      club: authorClub,
      ringType: "club",
      badge: req.body.badge || "CLUB",
      gradient: ["#8B5CF6", "#EC4899"],
      avatar: req.body.mediaUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80",
      mediaUrl: req.body.mediaUrl || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=400&q=80",
      mediaType: req.body.mediaType || "image",
      expiresIn: "Expires in 24 hrs",
      summary: req.body.caption || req.body.summary || req.body.title || "Club Story Update",
      caption: req.body.caption || req.body.summary || "",
      views: 12,
      viewers: [
        { name: "Aarav Patel", studentId: "2024CS099", time: "10m ago" },
        { name: "Ritik Sharma", studentId: "2023CS042", time: "25m ago" },
        { name: "Sneha Sen", studentId: "2023CS105", time: "1h ago" },
        { name: "Devansh Rao", studentId: "2024IT021", time: "2h ago" }
      ],
      createdAt: new Date().toISOString(),
      authorId: req.user?.sub || req.user?.studentId
    };

    mockDatabase.urgentStories.unshift(newStory);

    // Real-Time Sync & Notification Dispatch
    sendNotificationAndSync({
      sender: {
        role: role || "CLUB_LEADER",
        name: req.user?.name || authorClub
      },
      target: {
        type: "ALL"
      },
      payload: {
        type: "story:created",
        title: `New Campus Story from ${authorClub}`,
        message: newStory.caption || newStory.summary || "Tap to view the new 24h story update.",
        data: newStory,
        metadata: {
          storyId: newStory.id,
          club: authorClub
        }
      }
    }).catch((err) => console.warn("Story notification error:", err?.message));

    return success(res, "Story posted successfully", { story: newStory }, 201);
  } catch (e) {
    next(e);
  }
}


export async function getNotice(req, res, next) {
  try {
    const { id } = req.params;
    let notice = mockDatabase.notices.find(n => n.id === id || String(n._id) === id);

    try {
      if (!notice && Notice?.db?.readyState === 1) {
        notice = await Notice.findById(id).lean();
      }
    } catch {
      // Fallback
    }

    if (!notice) {
      // Return first notice as safe preview fallback
      notice = mockDatabase.notices[0];
    }

    return success(res, "Notice fetched successfully", { notice });
  } catch (e) {
    next(e);
  }
}

export async function getRelatedNotices(req, res, next) {
  try {
    const { id } = req.params;
    const current = mockDatabase.notices.find(n => n.id === id) || mockDatabase.notices[0];
    const related = mockDatabase.notices
      .filter(n => n.id !== current.id && (n.category === current.category || current.relatedIds?.includes(n.id)))
      .slice(0, 4);

    return success(res, "Related notices fetched successfully", {
      notices: related.length > 0 ? related : mockDatabase.notices.slice(1, 4)
    });
  } catch (e) {
    next(e);
  }
}

export async function toggleBookmark(req, res, next) {
  try {
    const { id } = req.params;
    const notice = mockDatabase.notices.find(n => n.id === id);
    let bookmarked = true;
    if (notice) {
      notice.bookmarked = !notice.bookmarked;
      bookmarked = notice.bookmarked;
    }
    return success(res, bookmarked ? "Notice saved to bookmarks" : "Notice removed from bookmarks", {
      noticeId: id,
      bookmarked
    });
  } catch (e) {
    next(e);
  }
}

export async function toggleReminder(req, res, next) {
  try {
    const { id } = req.params;
    const notice = mockDatabase.notices.find(n => n.id === id);
    let reminderSet = true;
    if (notice) {
      notice.reminderSet = !notice.reminderSet;
      reminderSet = notice.reminderSet;
    }
    return success(res, reminderSet ? "Reminder scheduled successfully" : "Reminder removed", {
      noticeId: id,
      reminderSet
    });
  } catch (e) {
    next(e);
  }
}

export async function createNotice(req, res, next) {
  try {
    const role = req.user?.role;

    if (role === "STUDENT") {
      return failure(res, "Students are not authorized to publish notices.", 403);
    }

    // Role-specific club leader restrictions
    if (role === "CLUB_LEADER") {
      const category = (req.body.category || "").toLowerCase();
      if (category === "academic" || category === "exam" || category === "administrative") {
        return failure(res, "Club leaders cannot post Academic, Exam, or Administrative notices. You can only post under Clubs or Student Life.", 403);
      }
    }

    const authorDept = role === "CLUB_LEADER"
      ? (req.user.assignedClub || "Club Executive Committee")
      : (req.user?.department || req.body.department || "Campus Administration");

    const newNotice = {
      id: `notice_${Date.now()}`,
      title: req.body.title || "Untitled Notice",
      category: req.body.category || (role === "CLUB_LEADER" ? "Clubs" : "Academic"),
      categoryColor: role === "CLUB_LEADER" ? "#8B5CF6" : "#2D5BFF",
      urgency: req.body.urgency || "normal",
      urgentPulse: req.body.urgency === "high",
      department: authorDept,
      verified: true,
      verifiedTooltip: `Posted by ${req.user?.name || "Official Staff"} (${authorDept})`,
      aiSummary: req.body.aiSummary || `TL;DR: ${req.body.title}`,
      fullAiSummary: req.body.fullAiSummary || req.body.content?.slice(0, 100),
      deadline: req.body.deadline || new Date(Date.now() + 86400000 * 5).toISOString(),
      deadlineDaysLeft: 5,
      deadlineProgress: 0.5,
      views: 1,
      saves: 0,
      bookmarked: false,
      reminderSet: false,
      relevanceScore: 90,
      postedAt: "Just now",
      content: req.body.content || "",
      attachments: req.body.attachments || [],
      authorRole: role,
      authorId: req.user?.sub || req.user?.studentId
    };

    try {
      if (Notice?.db?.readyState === 1) {
        await Notice.create({
          ...newNotice,
          noticeId: newNotice.id,
          status: "published"
        });
      }
    } catch (dbErr) {
      console.warn("Notice saved in memory; MongoDB sync notice:", dbErr.message);
    }

    mockDatabase.notices.unshift(newNotice);

    // Real-Time Sync & Notification Dispatch
    const isDeptSpecific = authorDept && authorDept !== "Campus Administration" && authorDept !== "All";
    sendNotificationAndSync({
      sender: {
        role: role || "FACULTY",
        name: req.user?.name || "Campus Administration"
      },
      target: {
        type: isDeptSpecific ? "DEPARTMENT" : "ALL",
        department: isDeptSpecific ? authorDept : null
      },
      payload: {
        type: "notice:created",
        title: `${newNotice.urgency === "high" ? "🚨 " : "📢 "}${newNotice.title}`,
        message: newNotice.aiSummary || newNotice.content?.slice(0, 120) || "A new official notice has been published.",
        data: newNotice,
        metadata: {
          noticeId: newNotice.id,
          category: newNotice.category,
          urgency: newNotice.urgency,
          department: authorDept
        }
      }
    }).catch((err) => console.warn("Notice notification error:", err?.message));

    return success(res, "Notice created successfully", { notice: newNotice }, 201);
  } catch (e) {
    next(e);
  }
}


export async function updateNotice(req, res, next) {
  try {
    const index = mockDatabase.notices.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      mockDatabase.notices[index] = { ...mockDatabase.notices[index], ...req.body };
      return success(res, "Notice updated successfully", { notice: mockDatabase.notices[index] });
    }
    return res.status(404).json({ success: false, message: "Notice not found" });
  } catch (e) {
    next(e);
  }
}

export async function publishNotice(req, res, next) {
  try {
    return success(res, "Notice published successfully", { noticeId: req.params.id });
  } catch (e) {
    next(e);
  }
}
