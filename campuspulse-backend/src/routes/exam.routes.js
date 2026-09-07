import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { examService } from "../services/exam.service.js";
import { success, failure } from "../utils/response.js";

const router = Router();
router.use(authenticate);

// Get exams for logged-in student
router.get("/my-exams", (req, res) => {
  try {
    const student = req.user;
    const exams = examService.getExamsForStudent(student);

    return success(res, `Fetched ${exams.length} upcoming exams`, {
      studentId: student.studentId,
      department: student.department,
      exams,
      count: exams.length
    });
  } catch (error) {
    return failure(res, error.message || "Failed to fetch student exams", 500);
  }
});

// Search exams by keyword
router.get("/search", (req, res) => {
  try {
    const { q } = req.query;
    const exams = examService.searchExams(q);

    return success(res, `Found ${exams.length} matching exams`, {
      query: q || "",
      exams
    });
  } catch (error) {
    return failure(res, error.message || "Failed to search exams", 500);
  }
});

export default router;
