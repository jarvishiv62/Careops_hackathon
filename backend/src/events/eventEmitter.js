import { EventEmitter } from "events";

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners to avoid memory leak warnings
  }

  // Workspace events
  emitWorkspaceCreated(workspace) {
    this.emit("workspace:created", workspace);
  }

  emitWorkspaceUpdated(workspace) {
    this.emit("workspace:updated", workspace);
  }

  emitWorkspaceDeleted(workspaceId) {
    this.emit("workspace:deleted", workspaceId);
  }

  // User events
  emitUserCreated(user) {
    this.emit("user:created", user);
  }

  emitUserUpdated(user) {
    this.emit("user:updated", user);
  }

  emitUserDeleted(userId) {
    this.emit("user:deleted", userId);
  }

  // Contact events
  emitContactCreated(contact) {
    this.emit("contact:created", contact);
  }

  emitContactUpdated(contact) {
    this.emit("contact:updated", contact);
  }

  emitContactDeleted(contactId) {
    this.emit("contact:deleted", contactId);
  }

  // Conversation events
  emitConversationCreated(conversation) {
    this.emit("conversation:created", conversation);
  }

  emitConversationUpdated(conversation) {
    this.emit("conversation:updated", conversation);
  }

  emitMessageReceived(message) {
    this.emit("message:received", message);
  }

  emitMessageSent(message) {
    this.emit("message:sent", message);
  }

  // Booking events
  emitBookingCreated(booking) {
    this.emit("booking:created", booking);
  }

  emitBookingUpdated(booking) {
    this.emit("booking:updated", booking);
  }

  emitBookingCancelled(booking) {
    this.emit("booking:cancelled", booking);
  }

  // Message events
  emitMessageReceived(message) {
    this.emit("message:received", message);
  }

  emitMessageSent(message) {
    this.emit("message:sent", message);
  }

  emitStaffReply(messageId, workspaceId, metadata) {
    this.emit("message:staffReply", { messageId, workspaceId, metadata });
  }

  // Form events
  emitFormSubmitted(submission) {
    this.emit("form:submitted", submission);
  }

  // Inventory events
  emitInventoryUpdated(inventory) {
    this.emit("inventory:updated", inventory);
  }

  emitInventoryLow(inventory) {
    this.emit("inventory:low", inventory);
  }

  // Integration events
  emitIntegrationConnected(integration) {
    this.emit("integration:connected", integration);
  }

  emitIntegrationDisconnected(integration) {
    this.emit("integration:disconnected", integration);
  }

  // Error events
  emitError(error, context = {}) {
    this.emit("error", { error, context, timestamp: new Date() });
  }

  // Utility methods
  async emitEvent(eventName, workspaceId, data, metadata = {}) {
    this.emit(eventName, {
      data,
      workspaceId,
      ...metadata,
      timestamp: new Date(),
    });
  }

  onWorkspaceCreated(callback) {
    this.on("workspace:created", callback);
  }

  onWorkspaceUpdated(callback) {
    this.on("workspace:updated", callback);
  }

  onWorkspaceDeleted(callback) {
    this.on("workspace:deleted", callback);
  }

  onContactCreated(callback) {
    this.on("contact:created", callback);
  }

  onMessageReceived(callback) {
    this.on("message:received", callback);
  }

  onBookingCreated(callback) {
    this.on("booking:created", callback);
  }

  onFormSubmitted(callback) {
    this.on("form:submitted", callback);
  }

  onError(callback) {
    this.on("error", callback);
  }

  // Remove all listeners for cleanup
  cleanup() {
    this.removeAllListeners();
  }
}

// Create singleton instance
const eventEmitter = new AppEventEmitter();

export default eventEmitter;
