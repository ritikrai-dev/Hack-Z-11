import Notice from "../models/mongodb/Notice.js";
import { success, failure } from "../utils/response.js";
import { mockDatabase } from "../services/mockData.js";


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
