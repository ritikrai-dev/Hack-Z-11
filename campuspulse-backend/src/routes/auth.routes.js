import { Router } from "express";
import { loginController, logoutController, changePasswordController, meController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", loginController);
router.post("/logout", logoutController);
router.patch("/password", authenticate, changePasswordController);
router.get("/me", authenticate, meController);

export default router;

