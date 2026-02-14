// backend/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./modules/auth/auth.routes.js";
import workspaceRoutes from "./modules/workspace/workspace.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import contactsRoutes from "./modules/contacts/contacts.routes.js";
import conversationsRoutes from "./modules/conversations/conversations.routes.js";
import bookingsRoutes from "./modules/bookings/bookings.routes.js";
import bookingTypesRoutes from "./modules/bookings/bookingTypes.routes.js";
import formsRoutes from "./modules/forms/forms.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import integrationsRoutes from "./modules/integrations/integrations.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import automationRoutes from "./modules/automations/automation.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import serviceRequestRoutes from "./routes/serviceRequests.js";
import publicConversationsRoutes from "./routes/publicConversations.js";
import emailTestRoutes from "./routes/emailTest.js";

// Import middleware
import { errorHandler } from "./middlewares/errorHandler.js";

// Import automation processor to initialize event listeners
import "./events/automationProcessor.js";

// Import background jobs
import bookingReminderJob from "./jobs/bookingReminderJob.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded forms)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "VitalFlow API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/bookings/types", bookingTypesRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/automations", automationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/public-conversations", publicConversationsRoutes);
app.use("/api/email-test", emailTestRoutes);
app.use("/api/conversations", conversationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);

  // Start background jobs with delay
  setTimeout(() => {
    bookingReminderJob.start();
    console.log(`📅 Background jobs started`);
  }, 3000); // Wait 3 seconds for database to be ready
});

export default app;
