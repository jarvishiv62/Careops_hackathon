// backend/src/modules/automations/automation.service.js
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import {
  getEmailProvider,
  getSMSProvider,
} from "../../integrations/integrationFactory.js";
import eventEmitter from "../../events/eventEmitter.js";
import notificationService from "../notifications/notification.service.js";

const prisma = new PrismaClient();

class AutomationService {
  constructor() {
    this.defaultAutomations = this.getDefaultAutomations();
  }

  getDefaultAutomations() {
    return [
      {
        name: "Welcome New Contact",
        trigger: "contact.created",
        isActive: true,
        actions: [
          {
            type: "send_email",
            config: {
              template: "welcome",
              delay: 0, // Send immediately
            },
          },
          {
            type: "create_conversation",
            config: {
              channel: "EMAIL",
              autoReply: true,
            },
          },
        ],
      },
      {
        name: "Booking Confirmation",
        trigger: "booking.created",
        isActive: true,
        actions: [
          {
            type: "send_email",
            config: {
              template: "booking_confirmation",
              delay: 0,
            },
          },
          {
            type: "update_booking_status",
            config: {
              status: "CONFIRMED",
            },
          },
        ],
      },
      {
        name: "Booking Reminder",
        trigger: "booking.reminder",
        isActive: true,
        actions: [
          {
            type: "send_email",
            config: {
              template: "booking_reminder",
              delay: 0,
            },
          },
          {
            type: "send_sms",
            config: {
              template: "booking_reminder_sms",
              delay: 0,
            },
          },
        ],
      },
      {
        name: "Form Submission Follow-up",
        trigger: "form.submitted",
        isActive: true,
        actions: [
          {
            type: "send_email",
            config: {
              template: "form_confirmation",
              delay: 0,
            },
          },
          {
            type: "create_task",
            config: {
              title: "Review Form Submission",
              priority: "MEDIUM",
            },
          },
        ],
      },
      {
        name: "Low Inventory Alert",
        trigger: "inventory.low",
        isActive: true,
        actions: [
          {
            type: "send_email",
            config: {
              template: "inventory_alert",
              delay: 0,
              recipients: ["admin"], // Send to workspace admin
            },
          },
          {
            type: "create_task",
            config: {
              title: "Restock Inventory",
              priority: "HIGH",
            },
          },
        ],
      },
    ];
  }

  async processEvent(eventType, data) {
    try {
      // Get workspace-specific automations
      const workspaceAutomations = await this.getWorkspaceAutomations(
        data.workspaceId,
      );

      // Get default automations for this event type
      const defaultAutomations = this.defaultAutomations.filter(
        (auto) => auto.trigger === eventType && auto.isActive,
      );

      // Combine workspace and default automations
      const allAutomations = [...workspaceAutomations, ...defaultAutomations];

      for (const automation of allAutomations) {
        await this.executeAutomation(automation, data);
      }
    } catch (error) {
      console.error(
        `Error processing automation for event ${eventType}:`,
        error,
      );
      throw error;
    }
  }

  async getWorkspaceAutomations(workspaceId) {
    try {
      const automations = await prisma.automation.findMany({
        where: {
          workspaceId,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return automations.map((auto) => ({
        id: auto.id,
        name: auto.name,
        trigger: auto.trigger,
        actions: auto.actions,
        conditions: auto.conditions,
        isActive: auto.isActive,
      }));
    } catch (error) {
      console.error("Error fetching workspace automations:", error);
      return [];
    }
  }

  async executeAutomation(automation, data) {
    try {
      console.log(`Executing automation: ${automation.name}`);

      // Log automation execution start
      const logId = await this.logAutomationExecution({
        automationId: automation.id,
        eventType: data.eventType || "unknown",
        status: "pending",
        inputData: data,
      });

      for (const action of automation.actions) {
        await this.executeAction(action, data, automation);
      }

      // Update log to success
      await this.updateAutomationLog(logId, {
        status: "success",
        outputData: { actionsExecuted: automation.actions.length },
      });
    } catch (error) {
      console.error(`Error executing automation ${automation.name}:`, error);

      // Log automation execution failure
      await this.logAutomationExecution({
        automationId: automation.id,
        eventType: data.eventType || "unknown",
        status: "failed",
        inputData: data,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  async executeAction(action, data, automation) {
    const { type, config } = action;

    switch (type) {
      case "send_email":
        await this.sendEmailAction(config, data);
        break;
      case "send_sms":
        await this.sendSMSAction(config, data);
        break;
      case "create_conversation":
        await this.createConversationAction(config, data);
        break;
      case "update_booking_status":
        await this.updateBookingStatusAction(config, data);
        break;
      case "create_task":
        await this.createTaskAction(config, data);
        break;
      case "webhook":
        await this.webhookAction(config, data);
        break;
      case "delay":
        await this.delayAction(config);
        break;
      default:
        console.warn(`Unknown automation action type: ${type}`);
    }
  }

  async sendEmailAction(config, data) {
    try {
      const { workspaceId } = data;

      // Get workspace email integration
      const emailIntegration = await this.getEmailIntegration(workspaceId);
      if (!emailIntegration) {
        console.log(`No email integration found for workspace ${workspaceId}`);
        return;
      }

      const emailProvider = getEmailProvider(emailIntegration);
      const emailContent = await this.generateEmailContent(
        config.template,
        data,
      );

      const result = await emailProvider.send({
        to: data.contact?.email || data.customerInfo?.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      console.log(`Email sent successfully: ${result.messageId}`);

      // Send real-time notification
      await notificationService.sendToWorkspace(workspaceId, {
        type: "automation",
        title: "Email Sent",
        message: `Email "${emailContent.subject}" sent to ${data.contact?.email || data.customerInfo?.email}`,
        data: {
          template: config.template,
          recipient: data.contact?.email || data.customerInfo?.email,
          messageId: result.messageId,
        },
      });

      // Log the automation
      await this.logAutomation({
        workspaceId,
        action: "send_email",
        template: config.template,
        recipient: data.contact?.email || data.customerInfo?.email,
        status: "success",
        metadata: result,
      });
    } catch (error) {
      console.error("Error sending email automation:", error);

      // Send failure notification
      await notificationService.sendToWorkspace(data.workspaceId, {
        type: "automation",
        title: "Email Failed",
        message: `Failed to send email: ${error.message}`,
        data: {
          template: config.template,
          recipient: data.contact?.email || data.customerInfo?.email,
          error: error.message,
        },
      });

      // Log failed automation
      await this.logAutomation({
        workspaceId: data.workspaceId,
        action: "send_email",
        template: config.template,
        recipient: data.contact?.email || data.customerInfo?.email,
        status: "failed",
        error: error.message,
      });
    }
  }

  async sendSMSAction(config, data) {
    try {
      const { workspaceId } = data;

      // Get workspace SMS integration
      const smsIntegration = await this.getSMSIntegration(workspaceId);
      if (!smsIntegration) {
        console.log(`No SMS integration found for workspace ${workspaceId}`);
        return;
      }

      const smsProvider = getSMSProvider(smsIntegration);
      const smsContent = await this.generateSMSContent(config.template, data);

      const result = await smsProvider.send({
        to: data.contact?.phone || data.customerInfo?.phone,
        message: smsContent,
      });

      console.log(`SMS sent successfully: ${result.messageId}`);

      // Log the automation
      await this.logAutomation({
        workspaceId,
        action: "send_sms",
        template: config.template,
        recipient: data.contact?.phone || data.customerInfo?.phone,
        status: "success",
        metadata: result,
      });
    } catch (error) {
      console.error("Error sending SMS automation:", error);

      await this.logAutomation({
        workspaceId: data.workspaceId,
        action: "send_sms",
        template: config.template,
        recipient: data.contact?.phone || data.customerInfo?.phone,
        status: "failed",
        error: error.message,
      });
    }
  }

  async createConversationAction(config, data) {
    try {
      const { workspaceId, contactId } = data;

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          workspaceId,
          contactId,
          status: "ACTIVE",
        },
      });

      if (existingConversation) {
        console.log(`Conversation already exists for contact ${contactId}`);
        return;
      }

      const conversation = await prisma.conversation.create({
        data: {
          workspaceId,
          contactId,
          channel: config.channel || "EMAIL",
          status: "ACTIVE",
          metadata: {
            source: "automation",
            automationType: "contact_created",
          },
        },
      });

      if (config.autoReply) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            content:
              "Thank you for reaching out! We've received your message and will get back to you soon.",
            senderType: "SYSTEM",
            messageType: "TEXT",
          },
        });
      }

      console.log(
        `Created conversation ${conversation.id} for contact ${contactId}`,
      );
    } catch (error) {
      console.error("Error creating conversation automation:", error);
      throw error;
    }
  }

  async updateBookingStatusAction(config, data) {
    try {
      const { bookingId } = data;

      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: config.status },
      });

      console.log(`Updated booking ${bookingId} status to ${config.status}`);
    } catch (error) {
      console.error("Error updating booking status automation:", error);
      throw error;
    }
  }

  async createTaskAction(config, data) {
    try {
      // For now, just log the task creation
      // In future, this would integrate with a task management system
      console.log(`Task creation action:`, {
        title: config.title,
        priority: config.priority,
        data,
      });

      // Could also create a notification for staff
      await this.createStaffNotification({
        workspaceId: data.workspaceId,
        title: config.title,
        message: `New task created: ${config.title}`,
        priority: config.priority,
        type: "TASK",
      });
    } catch (error) {
      console.error("Error creating task automation:", error);
      throw error;
    }
  }

  async webhookAction(config, data) {
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: JSON.stringify({
          event: data.eventType,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      console.log(`Webhook sent successfully to ${config.url}`);
    } catch (error) {
      console.error("Error sending webhook automation:", error);
      throw error;
    }
  }

  async delayAction(config) {
    const { duration = 1000 } = config; // Default 1 second
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  async getEmailIntegration(workspaceId) {
    try {
      return await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: { startsWith: "EMAIL" },
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Error fetching email integration:", error);
      return null;
    }
  }

  async getSMSIntegration(workspaceId) {
    try {
      return await prisma.integration.findFirst({
        where: {
          workspaceId,
          type: { startsWith: "SMS" },
          isActive: true,
        },
      });
    } catch (error) {
      console.error("Error fetching SMS integration:", error);
      return null;
    }
  }

  async generateEmailContent(template, data) {
    const templates = {
      welcome: {
        subject: `Welcome to ${data.workspaceName || "Our Service"}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome, ${data.contact?.firstName || data.customerInfo?.firstName}!</h2>
            <p>Thank you for reaching out to us. We've received your information and will be in touch shortly.</p>
            <p>If you have any questions in the meantime, feel free to reply to this email.</p>
            <br>
            <p>Best regards,<br>The ${data.workspaceName || "Team"} Team</p>
          </div>
        `,
        text: `Welcome, ${data.contact?.firstName || data.customerInfo?.firstName}! Thank you for reaching out. We'll be in touch shortly.`,
      },
      booking_confirmation: {
        subject: "Booking Confirmation",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Booking Confirmed!</h2>
            <p>Hi ${data.contact?.firstName || data.customerInfo?.firstName},</p>
            <p>Your booking has been confirmed:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> ${data.bookingType}</p>
              <p><strong>Date & Time:</strong> ${dayjs(data.startTime).format("MMMM D, YYYY [at] h:mm A")}</p>
              <p><strong>Reference Code:</strong> ${data.referenceCode}</p>
            </div>
            <p>We look forward to seeing you!</p>
          </div>
        `,
        text: `Booking confirmed! Service: ${data.bookingType}, Date: ${dayjs(data.startTime).format("MMMM D, YYYY [at] h:mm A")}, Reference: ${data.referenceCode}`,
      },
      booking_reminder: {
        subject: "Booking Reminder",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Booking Reminder</h2>
            <p>Hi ${data.contact?.firstName || data.customerInfo?.firstName},</p>
            <p>This is a friendly reminder about your upcoming booking:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> ${data.bookingType}</p>
              <p><strong>Date & Time:</strong> ${dayjs(data.startTime).format("MMMM D, YYYY [at] h:mm A")}</p>
            </div>
            <p>We look forward to seeing you!</p>
          </div>
        `,
        text: `Reminder: You have a booking for ${data.bookingType} on ${dayjs(data.startTime).format("MMMM D, YYYY [at] h:mm A")}`,
      },
      form_confirmation: {
        subject: "Form Submission Received",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Thank You!</h2>
            <p>Hi ${data.contact?.firstName || data.customerInfo?.firstName},</p>
            <p>We've received your form submission and will review it shortly.</p>
            <p>If we need any additional information, we'll reach out to you.</p>
          </div>
        `,
        text: "Thank you! We've received your form submission and will review it shortly.",
      },
      inventory_alert: {
        subject: "Low Inventory Alert",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f;">⚠️ Low Inventory Alert</h2>
            <p>The following item is running low on stock:</p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p><strong>Item:</strong> ${data.inventory?.name}</p>
              <p><strong>Current Stock:</strong> ${data.inventory?.quantity}</p>
              <p><strong>Threshold:</strong> ${data.inventory?.threshold}</p>
            </div>
            <p>Please restock this item soon to avoid running out.</p>
          </div>
        `,
        text: `Low inventory alert: ${data.inventory?.name} is running low (${data.inventory?.quantity} remaining)`,
      },
    };

    return templates[template] || templates.welcome;
  }

  async generateSMSContent(template, data) {
    const templates = {
      booking_reminder_sms: `Reminder: Your booking for ${data.bookingType} is scheduled for ${dayjs(data.startTime).format("MMM D [at] h:mm A")}. Reference: ${data.referenceCode}`,
      welcome_sms: `Welcome to ${data.workspaceName || "our service"}! We've received your information and will be in touch soon.`,
    };

    return templates[template] || "Thank you for contacting us!";
  }

  async logAutomation(logData) {
    try {
      // For now, just console log
      // In future, this would store in database
      console.log("Automation Log:", logData);
    } catch (error) {
      console.error("Error logging automation:", error);
    }
  }

  async logAutomationExecution(logData) {
    try {
      const log = await prisma.automationLog.create({
        data: {
          automationId: logData.automationId,
          eventType: logData.eventType,
          status: logData.status,
          inputData: logData.inputData,
          errorMessage: logData.errorMessage,
        },
      });

      return log.id;
    } catch (error) {
      console.error("Error creating automation log:", error);
      return null;
    }
  }

  async updateAutomationLog(logId, updateData) {
    try {
      await prisma.automationLog.update({
        where: { id: logId },
        data: updateData,
      });
    } catch (error) {
      console.error("Error updating automation log:", error);
    }
  }

  async createStaffNotification(notificationData) {
    try {
      // For now, just console log
      // In future, this would create notifications for staff users
      console.log("Staff Notification:", notificationData);
    } catch (error) {
      console.error("Error creating staff notification:", error);
    }
  }

  async createAutomation(automationData) {
    try {
      const automation = await prisma.automation.create({
        data: automationData,
      });

      return automation;
    } catch (error) {
      console.error("Error creating automation:", error);
      throw error;
    }
  }

  async updateAutomation(automationId, updateData) {
    try {
      const automation = await prisma.automation.updateMany({
        where: {
          id: automationId,
          workspaceId: updateData.workspaceId,
        },
        data: {
          name: updateData.name,
          description: updateData.description,
          trigger: updateData.trigger,
          actions: updateData.actions,
          conditions: updateData.conditions,
          isActive: updateData.isActive,
        },
      });

      return automation.count > 0 ? { id: automationId, ...updateData } : null;
    } catch (error) {
      console.error("Error updating automation:", error);
      throw error;
    }
  }

  async deleteAutomation(automationId, workspaceId) {
    try {
      const result = await prisma.automation.deleteMany({
        where: {
          id: automationId,
          workspaceId: workspaceId,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error("Error deleting automation:", error);
      throw error;
    }
  }

  async getAutomationLogs({ workspaceId, automationId, limit, offset }) {
    try {
      const where = {
        automation: {
          workspaceId: workspaceId,
        },
      };

      if (automationId) {
        where.automationId = automationId;
      }

      const logs = await prisma.automationLog.findMany({
        where,
        orderBy: {
          executedAt: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          automation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return logs;
    } catch (error) {
      console.error("Error fetching automation logs:", error);
      throw error;
    }
  }

  async testAutomation(automationId, workspaceId, testData) {
    try {
      // Get the automation
      const automation = await prisma.automation.findFirst({
        where: {
          id: automationId,
          workspaceId: workspaceId,
        },
      });

      if (!automation) {
        throw new Error("Automation not found");
      }

      // Execute the automation with test data
      const result = await this.executeAutomation(automation, {
        ...testData,
        workspaceId,
        eventType: automation.trigger,
        isTest: true,
      });

      return {
        success: true,
        message: "Automation test completed successfully",
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: "Automation test failed",
        error: error.message,
      };
    }
  }

  getAvailableTriggers() {
    return [
      {
        id: "contact.created",
        name: "Contact Created",
        description: "Triggered when a new contact is created",
        category: "contact",
      },
      {
        id: "booking.created",
        name: "Booking Created",
        description: "Triggered when a new booking is created",
        category: "booking",
      },
      {
        id: "booking.confirmed",
        name: "Booking Confirmed",
        description: "Triggered when a booking is confirmed",
        category: "booking",
      },
      {
        id: "form.submitted",
        name: "Form Submitted",
        description: "Triggered when a form is submitted",
        category: "form",
      },
      {
        id: "inventory.low",
        name: "Low Inventory",
        description: "Triggered when inventory falls below threshold",
        category: "inventory",
      },
      {
        id: "conversation.started",
        name: "Conversation Started",
        description: "Triggered when a new conversation begins",
        category: "conversation",
      },
    ];
  }

  getAvailableActions() {
    return [
      {
        id: "send_email",
        name: "Send Email",
        description: "Send an email to a recipient",
        category: "communication",
        configSchema: {
          template: { type: "string", required: true },
          recipient: { type: "string", required: true },
          delay: { type: "number", default: 0 },
        },
      },
      {
        id: "send_sms",
        name: "Send SMS",
        description: "Send an SMS message to a recipient",
        category: "communication",
        configSchema: {
          template: { type: "string", required: true },
          recipient: { type: "string", required: true },
          delay: { type: "number", default: 0 },
        },
      },
      {
        id: "create_task",
        name: "Create Task",
        description: "Create a task for staff members",
        category: "internal",
        configSchema: {
          title: { type: "string", required: true },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM",
          },
          assignee: { type: "string", required: false },
        },
      },
      {
        id: "update_contact",
        name: "Update Contact",
        description: "Update contact information",
        category: "contact",
        configSchema: {
          updates: { type: "object", required: true },
        },
      },
      {
        id: "webhook",
        name: "Call Webhook",
        description: "Make an HTTP request to an external URL",
        category: "integration",
        configSchema: {
          url: { type: "string", required: true },
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT"],
            default: "POST",
          },
          headers: { type: "object", required: false },
        },
      },
      {
        id: "delay",
        name: "Delay",
        description: "Wait for a specified duration",
        category: "flow_control",
        configSchema: {
          duration: { type: "number", required: true },
        },
      },
    ];
  }
}

export default new AutomationService();
