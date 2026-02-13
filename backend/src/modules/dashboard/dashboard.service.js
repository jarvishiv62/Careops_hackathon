// backend/src/modules/dashboard/dashboard.service.js
import { prisma } from "../../db/prisma.js";
import dayjs from "dayjs";

class DashboardService {
  // Get comprehensive dashboard statistics
  async getDashboardStats(workspaceId) {
    try {
      const [
        totalContacts,
        totalConversations,
        totalBookings,
        totalForms,
        totalInventory,
        totalIntegrations,
        recentBookings,
        recentConversations,
        allFormSubmissions,
        bookingStats,
        inventoryAlerts,
      ] = await Promise.all([
        // Total counts
        prisma.contact.count({ where: { workspaceId } }),
        prisma.conversation.count({ where: { workspaceId } }),
        prisma.booking.count({ where: { workspaceId } }),
        prisma.form.count({ where: { workspaceId } }),
        prisma.inventory.count({ where: { workspaceId } }),
        prisma.integration.count({ where: { workspaceId, isActive: true } }),

        // Recent data for activity feed
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

        prisma.formSubmission.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            form: {
              select: {
                id: true,
                name: true,
                workspaceId: true,
              },
            },
          },
        }),

        // Booking statistics
        prisma.booking.groupBy({
          by: ["status"],
          where: {
            workspaceId,
            startTime: {
              gte: dayjs().subtract(30, "days").toDate(),
            },
          },
          _count: true,
        }),

        // Low inventory alerts
        prisma.inventory.findMany({
          where: {
            workspaceId,
            quantity: { lte: 10 }, // Low stock threshold
          },
          take: 10,
        }),
      ]);

      // Filter form submissions by workspace
      const recentFormSubmissions = allFormSubmissions.filter(
        (submission) => submission.form.workspaceId === workspaceId,
      );

      // Calculate today's stats
      const today = dayjs().startOf("day").toDate();
      const tomorrow = dayjs().add(1, "day").startOf("day").toDate();

      const [
        todayBookings,
        todayContacts,
        todayConversations,
        upcomingBookings,
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
            createdAt: { gte: today },
          },
        }),
        prisma.conversation.count({
          where: {
            workspaceId,
            createdAt: { gte: today },
          },
        }),
        prisma.booking.count({
          where: {
            workspaceId,
            startTime: { gte: today },
            status: "CONFIRMED",
          },
        }),
      ]);

      // Calculate monthly growth
      const lastMonth = dayjs().subtract(1, "month").startOf("month").toDate();
      const thisMonth = dayjs().startOf("month").toDate();

      const [
        lastMonthContacts,
        thisMonthContacts,
        lastMonthBookings,
        thisMonthBookings,
      ] = await Promise.all([
        prisma.contact.count({
          where: {
            workspaceId,
            createdAt: { gte: lastMonth, lt: thisMonth },
          },
        }),
        prisma.contact.count({
          where: {
            workspaceId,
            createdAt: { gte: thisMonth },
          },
        }),
        prisma.booking.count({
          where: {
            workspaceId,
            startTime: { gte: lastMonth, lt: thisMonth },
          },
        }),
        prisma.booking.count({
          where: {
            workspaceId,
            startTime: { gte: thisMonth },
          },
        }),
      ]);

      // Calculate growth percentages
      const contactGrowth =
        lastMonthContacts > 0
          ? (
              ((thisMonthContacts - lastMonthContacts) / lastMonthContacts) *
              100
            ).toFixed(1)
          : 0;

      const bookingGrowth =
        lastMonthBookings > 0
          ? (
              ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) *
              100
            ).toFixed(1)
          : 0;

      return {
        overview: {
          totalContacts,
          totalConversations,
          totalBookings,
          totalForms,
          totalInventory,
          totalIntegrations,
          todayBookings,
          todayContacts,
          todayConversations,
          upcomingBookings,
        },
        growth: {
          contactGrowth: parseFloat(contactGrowth),
          bookingGrowth: parseFloat(bookingGrowth),
        },
        bookingStats: bookingStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {}),
        recentActivity: {
          bookings: recentBookings,
          conversations: recentConversations,
          formSubmissions: recentFormSubmissions,
        },
        alerts: {
          inventoryLow: inventoryAlerts,
          inventoryAlertCount: inventoryAlerts.length,
        },
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard statistics");
    }
  }

  // Get analytics data for charts
  async getAnalyticsData(workspaceId, period = "30d") {
    try {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = dayjs().subtract(days, "days").startOf("day").toDate();

      // Get daily booking counts using Prisma
      const bookings = await prisma.booking.findMany({
        where: {
          workspaceId,
          startTime: { gte: startDate },
        },
        select: {
          startTime: true,
        },
      });

      // Group bookings by day
      const dailyBookingsMap = bookings.reduce((acc, booking) => {
        const date = dayjs(booking.startTime).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const dailyBookings = Object.entries(dailyBookingsMap).map(
        ([date, count]) => ({
          date,
          count,
        }),
      );

      // Get daily contact counts using Prisma
      const contacts = await prisma.contact.findMany({
        where: {
          workspaceId,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
        },
      });

      // Group contacts by day
      const dailyContactsMap = contacts.reduce((acc, contact) => {
        const date = dayjs(contact.createdAt).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const dailyContacts = Object.entries(dailyContactsMap).map(
        ([date, count]) => ({
          date,
          count,
        }),
      );

      // Get conversation volume by channel
      const conversationByChannel = await prisma.conversation.groupBy({
        by: ["channel"],
        where: { workspaceId },
        _count: true,
      });

      // Get booking type performance
      const bookingTypePerformance = await prisma.booking.groupBy({
        by: ["bookingTypeId"],
        where: {
          workspaceId,
          startTime: { gte: startDate },
        },
        _count: true,
      });

      // Get booking type details
      const bookingTypes = await prisma.bookingType.findMany({
        where: {
          id: { in: bookingTypePerformance.map((p) => p.bookingTypeId) },
        },
        select: { id: true, name: true },
      });

      return {
        dailyBookings,
        dailyContacts,
        conversationByChannel,
        bookingTypePerformance: bookingTypePerformance.map((p) => ({
          bookingTypeId: p.bookingTypeId,
          count: p._count,
          name:
            bookingTypes.find((bt) => bt.id === p.bookingTypeId)?.name ||
            "Unknown",
        })),
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw new Error("Failed to fetch analytics data");
    }
  }

  // Get recent activity feed
  async getActivityFeed(workspaceId, limit = 20) {
    try {
      // Get recent bookings
      const recentBookings = await prisma.booking.findMany({
        where: { workspaceId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { firstName: true, lastName: true } },
          bookingType: { select: { name: true } },
        },
      });

      // Get recent conversations with latest message
      const recentConversations = await prisma.conversation.findMany({
        where: { workspaceId },
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          contact: { select: { firstName: true, lastName: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true, senderType: true },
          },
        },
      });

      // Get recent form submissions
      const recentFormSubmissions = await prisma.formSubmission.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          form: {
            select: {
              id: true,
              name: true,
              workspaceId: true,
            },
          },
        },
      });

      // Filter form submissions by workspace
      const filteredFormSubmissions = recentFormSubmissions.filter(
        (submission) => submission.form.workspaceId === workspaceId,
      );

      // Combine and sort all activities
      const activities = [
        ...recentBookings.map((booking) => ({
          id: `booking-${booking.id}`,
          type: "booking",
          title: `New booking: ${booking.bookingType.name}`,
          description: `with ${booking.contact.firstName} ${booking.contact.lastName || ""}`,
          timestamp: booking.createdAt,
          status: booking.status,
          data: booking,
        })),
        ...recentConversations.map((conversation) => ({
          id: `conversation-${conversation.id}`,
          type: "conversation",
          title: `Conversation with ${conversation.contact.firstName} ${conversation.contact.lastName || ""}`,
          description:
            conversation.messages[0]?.content?.substring(0, 100) ||
            "No messages yet",
          timestamp: conversation.updatedAt,
          channel: conversation.channel,
          data: conversation,
        })),
        ...filteredFormSubmissions.map((submission) => ({
          id: `form-${submission.id}`,
          type: "form",
          title: `Form submitted: ${submission.form.name}`,
          description: "New form submission received",
          timestamp: submission.createdAt,
          data: submission,
        })),
      ];

      return activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching activity feed:", error);
      throw new Error("Failed to fetch activity feed");
    }
  }

  // Get workspace health metrics
  async getWorkspaceHealth(workspaceId) {
    try {
      const [
        totalBookings,
        confirmedBookings,
        completedBookings,
        totalConversations,
        activeConversations,
        totalContacts,
        integrations,
      ] = await Promise.all([
        prisma.booking.count({ where: { workspaceId } }),
        prisma.booking.count({ where: { workspaceId, status: "CONFIRMED" } }),
        prisma.booking.count({ where: { workspaceId, status: "COMPLETED" } }),
        prisma.conversation.count({ where: { workspaceId } }),
        prisma.conversation.count({ where: { workspaceId, status: "ACTIVE" } }),
        prisma.contact.count({ where: { workspaceId } }),
        prisma.integration.count({ where: { workspaceId, isActive: true } }),
      ]);

      // Calculate metrics
      const bookingConfirmationRate =
        totalBookings > 0
          ? ((confirmedBookings / totalBookings) * 100).toFixed(1)
          : 0;

      const bookingCompletionRate =
        confirmedBookings > 0
          ? ((completedBookings / confirmedBookings) * 100).toFixed(1)
          : 0;

      const conversationEngagementRate =
        totalContacts > 0
          ? ((activeConversations / totalContacts) * 100).toFixed(1)
          : 0;

      return {
        bookingConfirmationRate: parseFloat(bookingConfirmationRate),
        bookingCompletionRate: parseFloat(bookingCompletionRate),
        conversationEngagementRate: parseFloat(conversationEngagementRate),
        totalBookings,
        confirmedBookings,
        completedBookings,
        activeConversations,
        totalContacts,
        activeIntegrations: integrations,
      };
    } catch (error) {
      console.error("Error fetching workspace health:", error);
      throw new Error("Failed to fetch workspace health metrics");
    }
  }
}

export default new DashboardService();
