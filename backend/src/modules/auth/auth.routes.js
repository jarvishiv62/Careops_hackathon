// backend/src/modules/auth/auth.routes.js
import express from "express";
import authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import {
  validate,
  registerSchema,
  loginSchema,
} from "../../utils/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);

// Protected routes
router.get("/me", authenticate, authController.getMe);
router.patch("/profile", authenticate, authController.updateProfile);
router.post("/change-password", authenticate, authController.changePassword);

export default router;
