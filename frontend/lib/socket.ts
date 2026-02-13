// frontend/lib/socket.ts
import { io, Socket } from "socket.io-client";

interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
}

interface BookingData {
  id: string;
  contactId: string;
  bookingType: string;
  startTime: string;
}

interface ContactData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MessageData {
  id: string;
  conversationId: string;
  content: string;
  senderType: string;
}

interface AutomationData {
  automationId: string;
  type: string;
  status: string;
}

interface TypingData {
  userId: string;
  userName: string;
  conversationId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.token = token;

    this.socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      {
        auth: {
          token,
        },
        transports: ["websocket"],
      },
    );

    this.setupEventListeners();

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("🔌 Connected to WebSocket server");
    });

    this.socket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket server");
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("🔌 WebSocket connection error:", error);
    });

    // Notification events
    this.socket.on("notification", (data: NotificationData) => {
      console.log("📢 New notification:", data);
      this.handleNotification(data);
    });

    // Real-time updates
    this.socket.on("booking_created", (data: BookingData) => {
      console.log("📅 New booking:", data);
      this.handleBookingCreated(data);
    });

    this.socket.on("contact_created", (data: ContactData) => {
      console.log("👤 New contact:", data);
      this.handleContactCreated(data);
    });

    this.socket.on("message_received", (data: MessageData) => {
      console.log("💬 New message:", data);
      this.handleMessageReceived(data);
    });

    this.socket.on("automation_executed", (data: AutomationData) => {
      console.log("🤖 Automation executed:", data);
      this.handleAutomationExecuted(data);
    });

    // Typing indicators
    this.socket.on("user_typing", (data: TypingData) => {
      this.handleUserTyping(data);
    });

    this.socket.on("user_stop_typing", (data: TypingData) => {
      this.handleUserStopTyping(data);
    });
  }

  // Event handlers
  private handleNotification(data: NotificationData): void {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent("notification", { detail: data }));
  }

  private handleBookingCreated(data: BookingData): void {
    window.dispatchEvent(new CustomEvent("booking_created", { detail: data }));
  }

  private handleContactCreated(data: ContactData): void {
    window.dispatchEvent(new CustomEvent("contact_created", { detail: data }));
  }

  private handleMessageReceived(data: MessageData): void {
    window.dispatchEvent(new CustomEvent("message_received", { detail: data }));
  }

  private handleAutomationExecuted(data: AutomationData): void {
    window.dispatchEvent(
      new CustomEvent("automation_executed", { detail: data }),
    );
  }

  private handleUserTyping(data: TypingData): void {
    window.dispatchEvent(new CustomEvent("user_typing", { detail: data }));
  }

  private handleUserStopTyping(data: TypingData): void {
    window.dispatchEvent(new CustomEvent("user_stop_typing", { detail: data }));
  }

  // Public methods for sending events
  joinWorkspace(workspaceId: string): void {
    this.socket?.emit("join_workspace", workspaceId);
  }

  leaveWorkspace(workspaceId: string): void {
    this.socket?.emit("leave_workspace", workspaceId);
  }

  startTyping(conversationId: string): void {
    this.socket?.emit("typing_start", { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit("typing_stop", { conversationId });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
