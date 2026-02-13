// backend/src/modules/users/invitation.routes.js
import express from "express";
import invitationController from "./invitation.controller.js";
import { authenticate, requireOwner, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// All invitation routes require authentication
router.use(authenticate);

// Create invitation (Owner only)
router.post("/", requireOwner, invitationController.createInvitation);

// Get pending invitations (Owner/Staff)
router.get("/pending", requireStaff, invitationController.getPendingInvitations);

// Accept invitation (public route - no auth required)
router.post("/accept/:token", invitationController.acceptInvitation);

// Cancel invitation (Owner only)
router.delete("/:invitationId", requireOwner, invitationController.cancelInvitation);

// Resend invitation (Owner only)
router.post("/:invitationId/resend", requireOwner, invitationController.resendInvitation);

// Get invitation details (for validation)
router.get("/:token", invitationController.getInvitationDetails);

export default router;
