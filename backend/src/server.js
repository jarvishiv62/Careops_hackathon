require("dotenv").config();
const http = require("http");
const app = require("./app");
const prismaService = require("./db/prisma");
const socketServer = require("./websocket/socketServer");

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await prismaService.connect();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    socketServer.initialize(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 WebSocket server initialized`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prismaService.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await prismaService.disconnect();
  process.exit(0);
});

startServer();
