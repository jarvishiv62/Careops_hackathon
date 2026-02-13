// backend/src/modules/contacts/contacts.routes.js
import express from "express";
import contactsController from "./contacts.controller.js";
import publicController from "./public.controller.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/public/:workspaceId", publicController.submitPublicContact);
router.get("/public/:workspaceId/info", publicController.getWorkspaceInfo);

// Protected routes
router.use(authenticate);

router.post("/", contactsController.createContact);
router.get("/", contactsController.getContacts);
router.get("/:id", contactsController.getContact);
router.get("/:id/stats", contactsController.getContactStats);
router.patch("/:id", requireStaff, contactsController.updateContact);
router.delete("/:id", requireStaff, contactsController.deleteContact);

export default router;
