// backend/src/modules/notifications/notification.controller.js
import notificationService from "./notification.service.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

class NotificationController {
  // SSE endpoint for real-time notifications
  async subscribeToNotifications(req, res) {
    const { workspace } = req;
    
    if (!workspace) {
      return res.status(400).json({
        success: false,
        error: "Workspace not found",
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Register client
    notificationService.registerClient(workspace.id, res);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      message: 'Connected to notification stream',
      timestamp: new Date().toISOString(),
    })}\n\n`);

    // Send a ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString(),
      })}\n\n`);
    }, 30000);

    // Clean up on disconnect
    req.on('close', () => {
      clearInterval(pingInterval);
    });
  }

  // Get user notifications
  async getNotifications(req, res) {
    try {
      const { workspace } = req;
      const { user } = req;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      const notifications = await notificationService.getUserNotifications(
        user.id,
        workspace.id,
        {
          limit: parseInt(limit),
          offset: parseInt(offset),
          unreadOnly: unreadOnly === 'true',
        }
      );

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch notifications",
      });
    }
  }

  // Mark notifications as read
  async markAsRead(req, res) {
    try {
      const { user } = req;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Notification IDs array is required",
        });
      }

      const success = await notificationService.markAsRead(notificationIds, user.id);

      res.json({
        success: true,
        data: { markedRead: success },
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({
        success: false,
        error: "Failed to mark notifications as read",
      });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const { workspace } = req;
      const { user } = req;

      const count = await notificationService.getUnreadCount(user.id, workspace.id);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get unread count",
      });
    }
  }

  // Send test notification (for development)
  async sendTestNotification(req, res) {
    try {
      const { workspace } = req;
      const { title, message, type = 'info' } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: "Title and message are required",
        });
      }

      await notificationService.sendToWorkspace(workspace.id, {
        title,
        message,
        type,
        isTest: true,
      });

      res.json({
        success: true,
        message: "Test notification sent",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send test notification",
      });
    }
  }
}

export default new NotificationController();
