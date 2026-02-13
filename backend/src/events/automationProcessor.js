import eventEmitter from "./eventEmitter.js";
import automationService from "../modules/automations/automation.service.js";

class AutomationProcessor {
  constructor() {
    this.automations = new Map();
    this.isProcessing = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen to all relevant events
    eventEmitter.on("contact:created", (contact) =>
      this.processEvent("contact.created", contact),
    );
    eventEmitter.on("contact:updated", (contact) =>
      this.processEvent("contact.updated", contact),
    );
    eventEmitter.on("message:received", (message) =>
      this.processEvent("message.received", message),
    );
    eventEmitter.on("booking:created", (booking) =>
      this.processEvent("booking.created", booking),
    );
    eventEmitter.on("form:submitted", (submission) =>
      this.processEvent("form.submitted", submission),
    );
    eventEmitter.on("inventory:low", (inventory) =>
      this.processEvent("inventory.low", inventory),
    );
  }

  async processEvent(eventType, data) {
    if (this.isProcessing) {
      // Queue the event if already processing
      setTimeout(() => this.processEvent(eventType, data), 100);
      return;
    }

    this.isProcessing = true;

    try {
      // Use the automation service to process the event
      await automationService.processEvent(eventType, data);
    } catch (error) {
      console.error(
        `Error processing automation for event ${eventType}:`,
        error,
      );
      eventEmitter.emitError(error, { eventType, data });
    } finally {
      this.isProcessing = false;
    }
  }

  async getAutomationsForEvent(eventType) {
    try {
      // This would typically query a database for automations
      // For now, return empty array as automations aren't implemented in schema yet
      return [];

      // Example implementation when automations table exists:
      // return await prismaService.client.automation.findMany({
      //   where: {
      //     trigger: eventType,
      //     isActive: true
      //   }
      // });
    } catch (error) {
      console.error("Error fetching automations:", error);
      return [];
    }
  }

  async executeAutomation(automation, data) {
    try {
      console.log(
        `Executing automation: ${automation.name} for event: ${automation.trigger}`,
      );

      // Parse automation actions
      const actions = automation.actions || [];

      for (const action of actions) {
        await this.executeAction(action, data, automation);
      }
    } catch (error) {
      console.error(`Error executing automation ${automation.id}:`, error);
      eventEmitter.emitError(error, { automation, data });
    }
  }

  async executeAction(action, data, automation) {
    const { type, config } = action;

    switch (type) {
      case "send_email":
        await this.sendEmailAction(config, data, automation);
        break;

      case "send_notification":
        await this.sendNotificationAction(config, data, automation);
        break;

      case "create_task":
        await this.createTaskAction(config, data, automation);
        break;

      case "update_contact":
        await this.updateContactAction(config, data, automation);
        break;

      case "webhook":
        await this.webhookAction(config, data, automation);
        break;

      case "delay":
        await this.delayAction(config, data, automation);
        break;

      default:
        console.warn(`Unknown automation action type: ${type}`);
    }
  }

  async sendEmailAction(config, data, automation) {
    // Placeholder for email sending logic
    console.log("Send email action:", { config, data });
    // Would integrate with email service like SendGrid, Nodemailer, etc.
  }

  async sendNotificationAction(config, data, automation) {
    // Placeholder for notification sending logic
    console.log("Send notification action:", { config, data });
    // Would integrate with notification service
  }

  async createTaskAction(config, data, automation) {
    // Placeholder for task creation logic
    console.log("Create task action:", { config, data });
    // Would create task in task management system
  }

  async updateContactAction(config, data, automation) {
    try {
      const { workspaceId, contactId } = data;
      const updates = config.updates || {};

      await prisma.contact.update({
        where: { id: contactId },
        data: updates,
      });

      console.log(`Updated contact ${contactId}:`, updates);
    } catch (error) {
      console.error("Error updating contact in automation:", error);
      throw error;
    }
  }

  async webhookAction(config, data, automation) {
    // Placeholder for webhook calling logic
    console.log("Webhook action:", { config, data });
    // Would make HTTP request to webhook URL
  }

  async delayAction(config, data, automation) {
    const { duration } = config; // duration in milliseconds
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  // Public methods for managing automations
  async registerAutomation(automation) {
    this.automations.set(automation.id, automation);
    console.log(`Registered automation: ${automation.name}`);
  }

  async unregisterAutomation(automationId) {
    this.automations.delete(automationId);
    console.log(`Unregistered automation: ${automationId}`);
  }

  async reloadAutomations() {
    // Reload all active automations from database
    try {
      const automations = await this.getAllAutomations();
      this.automations.clear();

      for (const automation of automations) {
        this.automations.set(automation.id, automation);
      }

      console.log(`Reloaded ${automations.length} automations`);
    } catch (error) {
      console.error("Error reloading automations:", error);
    }
  }

  async getAllAutomations() {
    // Placeholder for fetching all automations
    return [];

    // Example implementation:
    // return await prismaService.client.automation.findMany({
    //   where: { isActive: true }
    // });
  }

  // Get automation statistics
  getStats() {
    return {
      totalAutomations: this.automations.size,
      isProcessing: this.isProcessing,
      registeredTriggers: this.getRegisteredTriggers(),
    };
  }

  getRegisteredTriggers() {
    return eventEmitter.eventNames().filter((name) => name.includes(":"));
  }

  // Cleanup method
  cleanup() {
    this.automations.clear();
    eventEmitter.removeAllListeners();
  }
}

// Create singleton instance
const automationProcessor = new AutomationProcessor();

export default automationProcessor;
