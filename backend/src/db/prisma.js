import { PrismaClient } from "@prisma/client";

class PrismaService {
  constructor() {
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
      errorFormat: "pretty",
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log("✅ Database disconnected successfully");
    } catch (error) {
      console.error("❌ Database disconnection failed:", error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", timestamp: new Date().toISOString() };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  get client() {
    return this.prisma;
  }
}

// Create singleton instance
const prismaService = new PrismaService();

// Export both the service and the client directly
export default prismaService;
export const prisma = prismaService.client;
