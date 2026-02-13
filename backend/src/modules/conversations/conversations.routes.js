// backend/src/modules/conversations/conversations.routes.js
import express from "express";
import conversationsController from "./conversations.controller.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/", conversationsController.getConversations);
router.get("/unread/count", conversationsController.getUnreadCount);
router.get(
  "/contact/:contactId",
  conversationsController.getConversationByContact,
);
router.get("/:id", conversationsController.getConversation);
router.post("/:id/messages", requireStaff, conversationsController.sendMessage);
router.patch("/:id/status", requireStaff, conversationsController.updateStatus);

export default router;
