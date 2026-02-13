// backend/src/modules/notifications/notification.service.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.clients = new Map(); // workspaceId -> Set of response objects
  }

  // Register a client for real-time notifications
  registerClient(workspaceId, response) {
    if (!this.clients.has(workspaceId)) {
      this.clients.set(workspaceId, new Set());
    }
    
    this.clients.get(workspaceId).add(response);
    
    // Set up cleanup on connection close
    response.on('close', () => {
      this.clients.get(workspaceId)?.delete(response);
      if (this.clients.get(workspaceId)?.size === 0) {
        this.clients.delete(workspaceId);
      }
    });

    console.log(`Client registered for workspace ${workspaceId}`);
  }

  // Send notification to all clients in a workspace
  async sendToWorkspace(workspaceId, notification) {
    const workspaceClients = this.clients.get(workspaceId);
    if (!workspaceClients || workspaceClients.size === 0) {
      return;
    }

    const data = JSON.stringify({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    workspaceClients.forEach(client => {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error('Error sending to client:', error);
        // Remove problematic client
        workspaceClients.delete(client);
      }
    });

    // Store notification in database
    await this.storeNotification(workspaceId, notification);
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    // Get user's workspaces
    const userWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    // Send to all user's workspaces
    for (const workspaceUser of userWorkspaces) {
      await this.sendToWorkspace(workspaceUser.workspaceId, {
        ...notification,
        userId,
        isPersonal: true,
      });
    }
  }

  // Store notification in database
  async storeNotification(workspaceId, notificationData) {
    try {
      await prisma.notification.create({
        data: {
          workspaceId,
          userId: notificationData.userId || null,
          type: notificationData.type || 'info',
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data || {},
          isRead: false,
        },
      });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, workspaceId, options = {}) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;
      
      const where = {
        workspaceId,
        userId: userId || null,
      };

      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds, userId) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId,
        },
        data: {
          isRead: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  // Get unread count for user
  async getUnreadCount(userId, workspaceId) {
    try {
      const count = await prisma.notification.count({
        where: {
          workspaceId,
          userId: userId || null,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Broadcast system-wide notification
  async broadcastSystemNotification(notification) {
    const workspaces = await prisma.workspace.findMany({
      where: { isActive: true },
    });

    for (const workspace of workspaces) {
      await this.sendToWorkspace(workspace.id, {
        ...notification,
        type: 'system',
        isSystem: true,
      });
    }
  }

  // Handle different event types
  async handleEvent(eventType, data) {
    switch (eventType) {
      case 'new_message':
        await this.handleNewMessage(data);
        break;
      case 'new_booking':
        await this.handleNewBooking(data);
        break;
      case 'booking_confirmed':
        await this.handleBookingConfirmed(data);
        break;
      case 'new_contact':
        await this.handleNewContact(data);
        break;
      case 'automation_failed':
        await this.handleAutomationFailed(data);
        break;
      case 'inventory_low':
        await this.handleInventoryLow(data);
        break;
      default:
        console.log(`Unknown event type: ${eventType}`);
    }
  }

  async handleNewMessage(data) {
    const notification = {
      type: 'message',
      title: 'New Message',
      message: `New message from ${data.contactName || 'Customer'}`,
      data: {
        conversationId: data.conversationId,
        contactId: data.contactId,
        message: data.message,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }

  async handleNewBooking(data) {
    const notification = {
      type: 'booking',
      title: 'New Booking',
      message: `New booking: ${data.serviceName}`,
      data: {
        bookingId: data.bookingId,
        contactId: data.contactId,
        serviceName: data.serviceName,
        startTime: data.startTime,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }

  async handleBookingConfirmed(data) {
    const notification = {
      type: 'booking',
      title: 'Booking Confirmed',
      message: `Booking confirmed: ${data.serviceName}`,
      data: {
        bookingId: data.bookingId,
        serviceName: data.serviceName,
        startTime: data.startTime,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }

  async handleNewContact(data) {
    const notification = {
      type: 'contact',
      title: 'New Contact',
      message: `New contact: ${data.contactName}`,
      data: {
        contactId: data.contactId,
        conversationId: data.conversationId,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }

  async handleAutomationFailed(data) {
    const notification = {
      type: 'automation',
      title: 'Automation Failed',
      message: `Automation "${data.automationName}" failed`,
      data: {
        automationId: data.automationId,
        error: data.error,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }

  async handleInventoryLow(data) {
    const notification = {
      type: 'inventory',
      title: 'Low Inventory Alert',
      message: `${data.itemName} is running low (${data.currentQuantity} remaining)`,
      data: {
        inventoryId: data.inventoryId,
        itemName: data.itemName,
        currentQuantity: data.currentQuantity,
        threshold: data.threshold,
      },
    };

    await this.sendToWorkspace(data.workspaceId, notification);
  }
}

export default new NotificationService();
