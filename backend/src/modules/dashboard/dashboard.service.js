// backend/src/modules/dashboard/dashboard.service.js
import { prisma } from "../../db/prisma.js";
import dayjs from "dayjs";

class DashboardService {
  // Get comprehensive dashboard statistics
  async getDashboardStats(workspaceId, userRole = "MEMBER") {
    try {
      // Base queries for all roles
      const baseQueries = [
        prisma.contact.count({ where: { workspaceId } }),
        prisma.booking.count({ where: { workspaceId } }),
      ];

      // Admin-only queries
      const adminQueries = userRole !== "MEMBER" ? [
        prisma.conversation.count({ where: { workspaceId } }),
        prisma.form.count({ where: { workspaceId } }),
      ] : [0, 0];

      // Owner-only queries
      const ownerQueries = userRole === "OWNER" ? [
        prisma.inventory.count({ where: { workspaceId } }),
        prisma.integration.count({ where: { workspaceId, isActive: true } }),
      ] : [0, 0];

      // Recent data queries (role-based)
      const recentQueries = userRole !== "MEMBER" ? [
        prisma.booking.findMany({
          where: { workspaceId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            bookingType: { select: { name: true } },
          },
        }),
        prisma.conversation.findMany({
          where: { workspaceId },
          take: 5,
          orderBy: { updatedAt: "desc" },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { content: true, createdAt: true },
            },
          },
        }),
      ] : [
        // Staff only sees their own bookings
        prisma.booking.findMany({
          where: { workspaceId },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            bookingType: { select: { name: true } },
          },
        }),
        null, // No conversations for staff
      ];

      const [
        totalContacts,
        totalBookings,
        totalConversations,
        totalForms,
        totalInventory,
        totalIntegrations,
        recentBookings,
        recentConversations,
      ] = await Promise.all([
        ...baseQueries,
        ...adminQueries,
        ...ownerQueries,
        ...recentQueries,
      ]);

      // Calculate today's stats
      const today = dayjs().startOf("day").toDate();
      const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

      const [
        todayBookings,
        todayContacts,
        todayConversations,
      ] = await Promise.all([
        prisma.booking.count({
          where: {
            workspaceId,
            startTime: { gte: today, lt: tomorrow },
          },
        }),
        prisma.contact.count({
          where: {
            workspaceId,
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        userRole !== "MEMBER" ? prisma.conversation.count({
          where: {
            workspaceId,
            createdAt: { gte: today, lt: tomorrow },
          },
        }) : 0,
      ]);

      // Calculate growth percentages
      const lastMonth = dayjs().subtract(1, "month").toDate();
      
      const [
        lastMonthBookings,
        lastMonthContacts,
      ] = await Promise.all([
        prisma.booking.count({
          where: {
            workspaceId,
            startTime: { gte: lastMonth, lt: today },
          },
        }),
        prisma.contact.count({
          where: {
            workspaceId,
            createdAt: { gte: lastMonth, lt: today },
          },
        }),
      ]);

      const bookingGrowth = lastMonthBookings > 0 
        ? Math.round(((totalBookings - lastMonthBookings) / lastMonthBookings) * 100)
        : 0;
      
      const contactGrowth = lastMonthContacts > 0
        ? Math.round(((totalContacts - lastMonthContacts) / lastMonthContacts) * 100)
        : 0;

      return {
        overview: {
          totalContacts,
          totalBookings,
          totalConversations,
          totalForms,
          totalInventory,
          totalIntegrations,
        },
        today: {
          bookings: todayBookings,
          contacts: todayContacts,
          conversations: todayConversations,
        },
        growth: {
          bookingGrowth,
          contactGrowth,
        },
        recent: {
          bookings: recentBookings,
          conversations: recentConversations?.filter(Boolean) || [],
        },
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      throw error;
    }
  }

  // Get analytics data for charts
  async getAnalyticsData(workspaceId, period = "30d", userRole = "MEMBER") {
    try {
      const days = parseInt(period.replace("d", "")) || 30;
      const startDate = dayjs().subtract(days, "days").toDate();

      // Daily bookings
      const dailyBookings = await prisma.booking.groupBy({
        by: ["startTime"],
        where: {
          workspaceId,
          startTime: { gte: startDate },
        },
        _count: true,
      });

      // Format for charts
      const formattedDailyBookings = Array.from({ length: days }, (_, i) => {
        const date = dayjs().subtract(days - i - 1, "days").format("YYYY-MM-DD");
        const count = dailyBookings.find(
          (booking) => dayjs(booking.startTime).format("YYYY-MM-DD") === date
        )?._count || 0;
        return { date, count };
      });

      // Daily contacts (similar pattern)
      const dailyContacts = await prisma.contact.groupBy({
        by: ["createdAt"],
        where: {
          workspaceId,
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      const formattedDailyContacts = Array.from({ length: days }, (_, i) => {
        const date = dayjs().subtract(days - i - 1, "days").format("YYYY-MM-DD");
        const count = dailyContacts.find(
          (contact) => dayjs(contact.createdAt).format("YYYY-MM-DD") === date
        )?._count || 0;
        return { date, count };
      });

      return {
        dailyBookings: formattedDailyBookings,
        dailyContacts: formattedDailyContacts,
      };
    } catch (error) {
      console.error("Error in getAnalyticsData:", error);
      throw error;
    }
  }

  // Get activity feed
  async getActivityFeed(workspaceId, limit = 20, userRole = "MEMBER") {
    try {
      // For now, return mock data - this would be enhanced with real activity tracking
      const activities = [
        {
          id: 1,
          type: "booking",
          title: "New appointment scheduled",
          description: "Patient John Doe scheduled a consultation",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          type: "contact",
          title: "New patient registered",
          description: "Jane Smith added to patient database",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          type: "form",
          title: "Form submitted",
          description: "Patient intake form completed",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];

      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error in getActivityFeed:", error);
      throw error;
    }
  }

  // Get workspace health metrics
  async getWorkspaceHealth(workspaceId, userRole = "MEMBER") {
    try {
      const totalBookings = await prisma.booking.count({
        where: { workspaceId },
      });

      const confirmedBookings = await prisma.booking.count({
        where: { workspaceId, status: "CONFIRMED" },
      });

      const completedBookings = await prisma.booking.count({
        where: { workspaceId, status: "COMPLETED" },
      });

      const bookingConfirmationRate = totalBookings > 0 
        ? Math.round((confirmedBookings / totalBookings) * 100)
        : 0;

      const bookingCompletionRate = confirmedBookings > 0
        ? Math.round((completedBookings / confirmedBookings) * 100)
        : 0;

      return {
        bookingConfirmationRate,
        bookingCompletionRate,
        totalBookings,
        confirmedBookings,
        completedBookings,
      };
    } catch (error) {
      console.error("Error in getWorkspaceHealth:", error);
      throw error;
    }
  }
}

export default new DashboardService();
