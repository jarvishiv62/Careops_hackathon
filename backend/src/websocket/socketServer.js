// backend/src/websocket/socketServer.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class SocketServer {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            workspaces: {
              where: { role: { in: ["OWNER", "ADMIN", "MEMBER"] } },
            },
          },
        });

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.user = user;
        socket.workspaceIds = user.workspaces.map(w => w.workspaceId);
        next();
      } catch (error) {
        next(new Error("Invalid authentication token"));
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`🔌 User ${socket.user.email} connected (${socket.id})`);

      // Store user connection
      this.connectedUsers.set(socket.user.id, socket.id);

      // Join workspace rooms
      socket.workspaceIds.forEach(workspaceId => {
        socket.join(`workspace:${workspaceId}`);
      });

      // Join personal room for direct notifications
      socket.join(`user:${socket.user.id}`);

      // Handle joining specific workspace rooms
      socket.on("join_workspace", (workspaceId) => {
        if (socket.workspaceIds.includes(workspaceId)) {
          socket.join(`workspace:${workspaceId}`);
          console.log(`📂 User ${socket.user.email} joined workspace ${workspaceId}`);
        }
      });

      // Handle leaving workspace rooms
      socket.on("leave_workspace", (workspaceId) => {
        socket.leave(`workspace:${workspaceId}`);
        console.log(`📤 User ${socket.user.email} left workspace ${workspaceId}`);
      });

      // Handle real-time typing indicators
      socket.on("typing_start", (data) => {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit("user_typing", {
          userId: socket.user.id,
          userName: socket.user.name,
          conversationId,
        });
      });

      socket.on("typing_stop", (data) => {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit("user_stop_typing", {
          userId: socket.user.id,
          conversationId,
        });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 User ${socket.user.email} disconnected`);
        this.connectedUsers.delete(socket.user.id);
      });
    });

    console.log("🌐 WebSocket server initialized");
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Send notification to all users in workspace
  sendToWorkspace(workspaceId, event, data) {
    if (this.io) {
      this.io.to(`workspace:${workspaceId}`).emit(event, data);
    }
  }

  // Send notification to conversation participants
  sendToConversation(conversationId, event, data) {
    if (this.io) {
      this.io.to(`conversation:${conversationId}`).emit(event, data);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Create singleton instance
const socketServer = new SocketServer();

export default socketServer;
