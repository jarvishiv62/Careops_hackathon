// backend/src/modules/notifications/notification.routes.js
import express from "express";
import notificationController from "./notification.controller.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// SSE endpoint for real-time notifications
router.get("/stream", notificationController.subscribeToNotifications);

// Get notifications for user
router.get("/", requireStaff, notificationController.getNotifications);

// Get unread count
router.get("/unread-count", requireStaff, notificationController.getUnreadCount);

// Mark notifications as read
router.patch("/read", requireStaff, notificationController.markAsRead);

// Send test notification (development only)
router.post("/test", requireStaff, notificationController.sendTestNotification);

export default router;
