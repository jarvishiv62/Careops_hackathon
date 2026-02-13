import express from "express";
import workspaceController from "./workspace.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Workspace CRUD operations
router.post("/", workspaceController.createWorkspace);
router.get("/", workspaceController.getWorkspaces);
router.get("/stats/:id", workspaceController.getWorkspaceStats);
router.get("/:id", workspaceController.getWorkspace);
router.put("/:id", workspaceController.updateWorkspace);
router.delete("/:id", workspaceController.deleteWorkspace);

// Workspace member management
router.get("/:id/members", workspaceController.getWorkspaceMembers);
router.post("/:id/invite", workspaceController.inviteUser);
router.delete("/:id/users/:userId", workspaceController.removeUser);
router.put("/:id/users/:userId/role", workspaceController.updateUserRole);
router.post("/:id/leave", workspaceController.leaveWorkspace);

export default router;
