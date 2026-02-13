// backend/src/modules/users/users.routes.js
import express from "express";
import usersController from "./users.controller.js";
import invitationRoutes from "./invitation.routes.js";
import { authenticate, requireOwner } from "../../middlewares/auth.js";
import {
  validate,
  inviteUserSchema,
  acceptInviteSchema,
} from "../../utils/validation.js";

const router = express.Router();

// Public route
router.post(
  "/accept-invite",
  validate(acceptInviteSchema),
  usersController.acceptInvite,
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUser);

// Owner-only routes
router.post(
  "/invite",
  requireOwner,
  validate(inviteUserSchema),
  usersController.inviteUser,
);
router.patch("/:id", requireOwner, usersController.updateUser);
router.delete("/:id", requireOwner, usersController.deleteUser);

// Invitation management routes (NEW)
router.use("/invitations", invitationRoutes);

export default router;
