// backend/src/modules/automations/automation.routes.js
import express from "express";
import automationController from "./automation.controller.js";
import { authenticate, requireOwner, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// All automation routes require authentication
router.use(authenticate);

// Get all automations for workspace
router.get("/", requireStaff, automationController.getAutomations);

// Get available triggers and actions (for building automation UI)
router.get("/triggers", requireStaff, automationController.getAvailableTriggers);
router.get("/actions", requireStaff, automationController.getAvailableActions);

// Create new automation (owner only)
router.post("/", requireOwner, automationController.createAutomation);

// Update automation (owner only)
router.patch("/:id", requireOwner, automationController.updateAutomation);

// Delete automation (owner only)
router.delete("/:id", requireOwner, automationController.deleteAutomation);

// Test automation
router.post("/:id/test", requireOwner, automationController.testAutomation);

// Get automation logs
router.get("/logs", requireStaff, automationController.getAutomationLogs);

export default router;
