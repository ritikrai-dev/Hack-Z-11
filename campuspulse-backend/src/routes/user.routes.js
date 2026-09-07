import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  profile,
  updateProfile,
  updateInterests,
  updateNotifications,
  completeOnboarding,
  changePassword,
  getOnboardingData
} from "../controllers/user.controller.js";

const router = Router();
router.use(authenticate);

router.get("/profile", profile);
router.put("/profile", updateProfile);
router.put("/interests", updateInterests);
router.put("/preferences/notifications", updateNotifications);
router.patch("/onboarding", completeOnboarding);
router.get("/onboarding/meta", getOnboardingData);
router.patch("/password", changePassword);

export default router;
