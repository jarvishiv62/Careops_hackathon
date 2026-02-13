import express from "express";
import dashboardController from "./dashboard.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import {
  workspaceMiddleware,
  requireWorkspace,
} from "../../middlewares/workspace.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply workspace middleware (but don't require workspace parameter)
router.use(workspaceMiddleware);

// Dashboard routes
router.get("/overview", dashboardController.getDashboardData);
router.get("/stats", dashboardController.getWorkspaceStats);
router.get("/activity", dashboardController.getActivityFeed);
router.get("/health", dashboardController.getWorkspaceHealth);

export default router;
