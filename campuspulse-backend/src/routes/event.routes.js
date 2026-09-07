import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
  list,
  getNearYou,
  getRecommended,
  details,
  register,
  unregister,
  getTicketQR,
  addComment,
  create,
  listRegistrations,
  exportRegistrations
} from "../controllers/event.controller.js";

const router = Router();
router.use(authenticate);

// Specific paths must precede parameter routes
router.get("/", list);
router.get("/near-you", getNearYou);
router.get("/recommended", getRecommended);

// Dynamic routes
router.get("/:id", details);
router.post("/:id/register", register);
router.delete("/:id/register", unregister);
router.get("/:id/ticket-qr", getTicketQR);
router.post("/:id/comments", addComment);

// Registration roster & export for teachers / admins / club leaders
router.get("/:id/registrations", authorize("ADMIN", "TEACHER", "CLUB_LEADER"), listRegistrations);
router.get("/:id/registrations/export", authorize("ADMIN", "TEACHER", "CLUB_LEADER"), exportRegistrations);

// Create event (strictly Admin, Teacher, Club Leader)
router.post("/", authorize("ADMIN", "TEACHER", "CLUB_LEADER"), create);

export default router;
