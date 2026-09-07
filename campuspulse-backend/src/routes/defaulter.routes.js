import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createManualDefaulter,
  uploadDefaulters,
  getStudentDefaulters,
  getMyDefaulters,
  getTeacherDefaulters,
  resolveDefaulter,
  checkStudent,
  getAdminDefaulters
} from "../controllers/defaulterController.js";
import { defaulterService } from "../services/defaulter.service.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 1. Manual Single Defaulter Entry (both /manual and /)
router.post("/manual", createManualDefaulter);
router.post("/", createManualDefaulter);

// 2. File Upload & Excel / CSV / JSON Parser (both /upload and /parse)
router.post("/upload", upload.single("file"), uploadDefaulters);
router.post("/parse", upload.single("file"), uploadDefaulters);

// 3. Confirm and Batch Publish Defaulters (Legacy backward compatibility)
router.post("/publish", async (req, res) => {
  try {
    const { subject, subjectCode, term, noticeTitle, reason, records } = req.body;

    if (!subject?.trim()) {
      return failure(res, "Subject is required to publish defaulters", 400);
    }

    if (!Array.isArray(records) || records.length === 0) {
      return failure(res, "No confirmed student records provided to publish", 400);
    }

    const result = await defaulterService.publishDefaultersBatch({
      subject: subject.trim(),
      subjectCode,
      term,
      noticeTitle,
      reason,
      records,
      teacher: req.user
    });

    return success(res, `Published ${result.count} verified students to ${subject} Defaulter List`, result);
  } catch (error) {
    return failure(res, error.message || "Failed to publish defaulters", 500);
  }
});

// 4. Student Defaulters by Student ID or Seat Number
router.get("/student/:studentId", getStudentDefaulters);

// 5. Authenticated Student Defaulters
router.get("/me", getMyDefaulters);

// 6. Get Defaulters for Logged-In Teacher
router.get("/teacher", getTeacherDefaulters);

// 7. Resolve / Remove Defaulter Entry
router.delete("/:id", resolveDefaulter);

// 8. Check Student Defaulter Status
router.get("/check-student/:studentId", checkStudent);

// 9. Admin Overview of All Defaulters
router.get("/admin/all", getAdminDefaulters);

export default router;
