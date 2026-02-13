// backend/src/modules/ai/aiInsights.service.js
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

class AIInsightsService {
  constructor() {
    this.insightCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive business insights
  async getBusinessInsights(workspaceId, timeRange = "30d") {
    try {
      const cacheKey = `${workspaceId}-${timeRange}`;
      
      // Check cache first
      if (this.insightCache.has(cacheKey)) {
        const cached = this.insightCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const insights = await this.generateInsights(workspaceId, timeRange);
      
      // Cache the results
      this.insightCache.set(cacheKey, {
        data: insights,
        timestamp: Date.now(),
      });

      return insights;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      throw error;
    }
  }

  async generateInsights(workspaceId, timeRange) {
    const endDate = new Date();
    const startDate = this.getStartDate(timeRange);

    // Fetch all relevant data
    const [
      bookings,
      contacts,
      conversations,
      inventory,
      bookingTypes,
    ] = await Promise.all([
      this.getBookingsData(workspaceId, startDate, endDate),
      this.getContactsData(workspaceId, startDate, endDate),
      this.getConversationsData(workspaceId, startDate, endDate),
      this.getInventoryData(workspaceId),
      this.getBookingTypesData(workspaceId),
    ]);

    // Generate insights
    const insights = {
      performance: this.analyzePerformance(bookings, timeRange),
      trends: this.analyzeTrends(bookings, contacts, timeRange),
      predictions: this.generatePredictions(bookings, contacts),
      recommendations: this.generateRecommendations(bookings, inventory, conversations),
      customerInsights: this.analyzeCustomerBehavior(contacts, conversations),
      operationalHealth: this.assessOperationalHealth(bookings, inventory),
    };

    return insights;
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case "7d":
        return dayjs(now).subtract(7, "days").toDate();
      case "30d":
        return dayjs(now).subtract(30, "days").toDate();
      case "90d":
        return dayjs(now).subtract(90, "days").toDate();
      default:
        return dayjs(now).subtract(30, "days").toDate();
    }
  }

  async getBookingsData(workspaceId, startDate, endDate) {
    return await prisma.booking.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        contact: true,
        bookingType: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getContactsData(workspaceId, startDate, endDate) {
    return await prisma.contact.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        conversations: {
          include: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getConversationsData(workspaceId, startDate, endDate) {
    return await prisma.conversation.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        messages: true,
        contact: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getInventoryData(workspaceId) {
    return await prisma.inventory.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });
  }

  async getBookingTypesData(workspaceId) {
    return await prisma.bookingType.findMany({
      where: { workspaceId, isActive: true },
      include: {
        bookings: {
          where: {
            createdAt: { gte: this.getStartDate("30d") },
          },
        },
      },
    });
  }

  // Performance Analysis
  analyzePerformance(bookings, timeRange) {
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED").length;
    const completedBookings = bookings.filter(b => b.status === "COMPLETED").length;
    const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length;
    const noShows = bookings.filter(b => b.status === "NO_SHOW").length;

    const confirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
    const completionRate = confirmedBookings > 0 ? (completedBookings / confirmedBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    const noShowRate = confirmedBookings > 0 ? (noShows / confirmedBookings) * 100 : 0;

    // Revenue estimation (simplified)
    const avgBookingValue = this.estimateAverageBookingValue(bookings);
    const totalRevenue = completedBookings * avgBookingValue;
    const projectedMonthlyRevenue = this.projectMonthlyRevenue(bookings, avgBookingValue);

    return {
      metrics: {
        totalBookings,
        confirmationRate: Math.round(confirmationRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        noShowRate: Math.round(noShowRate * 10) / 10,
      },
      revenue: {
        totalRevenue: Math.round(totalRevenue),
        projectedMonthlyRevenue: Math.round(projectedMonthlyRevenue),
        averageBookingValue: Math.round(avgBookingValue * 100) / 100,
      },
      grade: this.calculatePerformanceGrade(confirmationRate, completionRate, cancellationRate),
    };
  }

  // Trend Analysis
  analyzeTrends(bookings, contacts, timeRange) {
    const dailyBookings = this.groupByDay(bookings, "createdAt");
    const dailyContacts = this.groupByDay(contacts, "createdAt");

    const bookingGrowth = this.calculateGrowthRate(dailyBookings);
    const contactGrowth = this.calculateGrowthRate(dailyContacts);

    // Peak booking times
    const peakHours = this.analyzePeakHours(bookings);
    const peakDays = this.analyzePeakDays(bookings);

    // Seasonal patterns
    const seasonality = this.detectSeasonality(dailyBookings);

    return {
      growth: {
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        contactGrowth: Math.round(contactGrowth * 10) / 10,
      },
      patterns: {
        peakHours,
        peakDays,
        seasonality,
      },
      momentum: this.calculateMomentum(dailyBookings),
    };
  }

  // Predictive Analytics
  generatePredictions(bookings, contacts) {
    const recentBookings = bookings.slice(-30); // Last 30 bookings
    const recentContacts = contacts.slice(-30); // Last 30 contacts

    // Simple linear regression for booking trends
    const bookingTrend = this.calculateTrend(recentBookings.map(b => new Date(b.createdAt).getTime()));
    const contactTrend = this.calculateTrend(recentContacts.map(c => new Date(c.createdAt).getTime()));

    // Predict next month's performance
    const predictedBookings = Math.max(0, Math.round(recentBookings.length + (bookingTrend * 30)));
    const predictedContacts = Math.max(0, Math.round(recentContacts.length + (contactTrend * 30)));

    // Churn prediction
    const churnRisk = this.assessChurnRisk(contacts);

    return {
      nextMonth: {
        predictedBookings,
        predictedContacts,
        confidence: this.calculatePredictionConfidence(recentBookings.length),
      },
      trends: {
        bookingTrend: Math.round(bookingTrend * 100) / 100,
        contactTrend: Math.round(contactTrend * 100) / 100,
      },
      risks: {
        churnRisk,
        capacityRisk: this.assessCapacityRisk(bookings),
      },
    };
  }

  // Actionable Recommendations
  generateRecommendations(bookings, inventory, conversations) {
    const recommendations = [];

    // Booking performance recommendations
    const completionRate = bookings.filter(b => b.status === "COMPLETED").length / bookings.length;
    if (completionRate < 0.8) {
      recommendations.push({
        type: "performance",
        priority: "high",
        title: "Improve Booking Completion Rate",
        description: `Your completion rate is ${Math.round(completionRate * 100)}%. Consider sending reminder emails and SMS notifications.`,
        action: "Enable automated reminders in settings",
      });
    }

    // Inventory recommendations
    const lowStockItems = inventory.filter(item => item.quantity < 10);
    if (lowStockItems.length > 0) {
      recommendations.push({
        type: "inventory",
        priority: "medium",
        title: "Restock Low Inventory Items",
        description: `${lowStockItems.length} items are running low on stock.`,
        action: "Review inventory and place orders",
      });
    }

    // Conversation response time
    const avgResponseTime = this.calculateAverageResponseTime(conversations);
    if (avgResponseTime > 4) {
      recommendations.push({
        type: "customer_service",
        priority: "medium",
        title: "Improve Response Time",
        description: `Average response time is ${Math.round(avgResponseTime)} hours. Consider setting up auto-responses.`,
        action: "Configure automation rules for faster responses",
      });
    }

    // Peak time optimization
    const peakDays = this.analyzePeakDays(bookings);
    if (peakDays.length > 0) {
      recommendations.push({
        type: "optimization",
        priority: "low",
        title: "Optimize Peak Day Availability",
        description: `${peakDays[0].day} is your busiest day. Ensure adequate staff coverage.`,
        action: "Adjust staff schedules for peak days",
      });
    }

    return recommendations;
  }

  // Customer Behavior Analysis
  analyzeCustomerBehavior(contacts, conversations) {
    const customerSegments = this.segmentCustomers(contacts, conversations);
    const engagementMetrics = this.calculateEngagementMetrics(conversations);
    const conversionFunnel = this.analyzeConversionFunnel(contacts, conversations);

    return {
      segments: customerSegments,
      engagement: engagementMetrics,
      funnel: conversionFunnel,
      loyalty: this.assessCustomerLoyalty(contacts, conversations),
    };
  }

  // Operational Health Assessment
  assessOperationalHealth(bookings, inventory) {
    const healthScore = this.calculateHealthScore(bookings, inventory);
    const bottlenecks = this.identifyBottlenecks(bookings, inventory);
    const efficiency = this.assessEfficiency(bookings);

    return {
      score: healthScore,
      status: this.getHealthStatus(healthScore),
      bottlenecks,
      efficiency,
      alerts: this.generateHealthAlerts(bookings, inventory),
    };
  }

  // Helper methods
  groupByDay(items, dateField) {
    const grouped = {};
    items.forEach(item => {
      const date = dayjs(item[dateField]).format("YYYY-MM-DD");
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return grouped;
  }

  calculateGrowthRate(dailyData) {
    const days = Object.keys(dailyData).sort();
    if (days.length < 2) return 0;

    const firstWeek = days.slice(0, 7).reduce((sum, day) => sum + dailyData[day], 0) / 7;
    const lastWeek = days.slice(-7).reduce((sum, day) => sum + dailyData[day], 0) / 7;

    return firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;
  }

  calculatePerformanceGrade(confirmationRate, completionRate, cancellationRate) {
    const score = (confirmationRate * 0.3) + (completionRate * 0.4) + ((100 - cancellationRate) * 0.3);
    
    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  estimateAverageBookingValue(bookings) {
    // This would typically use actual pricing data
    // For demo purposes, we'll estimate based on booking types
    return 150; // Placeholder value
  }

  projectMonthlyRevenue(bookings, avgValue) {
    const recentBookings = bookings.slice(-30);
    const dailyAverage = recentBookings.length / 30;
    return dailyAverage * 30 * avgValue;
  }

  analyzePeakHours(bookings) {
    const hourCounts = {};
    bookings.forEach(booking => {
      const hour = new Date(booking.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }));
  }

  analyzePeakDays(bookings) {
    const dayCounts = {};
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    bookings.forEach(booking => {
      const day = new Date(booking.createdAt).getDay();
      const dayName = dayNames[day];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day, count]) => ({ day, bookings: count }));
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  calculatePredictionConfidence(sampleSize) {
    if (sampleSize < 10) return "low";
    if (sampleSize < 30) return "medium";
    return "high";
  }

  assessChurnRisk(contacts) {
    // Simplified churn assessment based on recent activity
    const recentContacts = contacts.filter(c => 
      dayjs().diff(dayjs(c.createdAt), 'days') < 30
    );
    
    return {
      risk: recentContacts.length < 5 ? "high" : "low",
      score: Math.max(0, Math.min(100, (recentContacts.length / 10) * 100)),
    };
  }

  assessCapacityRisk(bookings) {
    const recentBookings = bookings.slice(-7);
    const dailyAverage = recentBookings.length / 7;
    
    return {
      risk: dailyAverage > 10 ? "high" : "low",
      utilization: Math.min(100, (dailyAverage / 15) * 100),
    };
  }

  calculateAverageResponseTime(conversations) {
    const responseTimes = [];
    
    conversations.forEach(conv => {
      const messages = conv.messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      for (let i = 1; i < messages.length; i++) {
        const current = messages[i];
        const previous = messages[i - 1];
        
        if (current.senderType === "USER" && previous.senderType === "CONTACT") {
          const responseTime = dayjs(current.createdAt).diff(dayjs(previous.createdAt), 'hours');
          responseTimes.push(responseTime);
        }
      }
    });
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  }

  calculateHealthScore(bookings, inventory) {
    let score = 100;
    
    // Booking performance
    const completionRate = bookings.filter(b => b.status === "COMPLETED").length / bookings.length;
    score -= (1 - completionRate) * 30;
    
    // Inventory health
    const lowStockItems = inventory.filter(item => item.quantity < 5).length;
    score -= (lowStockItems / inventory.length) * 20;
    
    return Math.max(0, Math.round(score));
  }

  getHealthStatus(score) {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "fair";
    return "poor";
  }

  // Additional helper methods can be implemented here...
  segmentCustomers(contacts, conversations) {
    // Customer segmentation logic
    return {
      new: contacts.filter(c => dayjs().diff(dayjs(c.createdAt), 'days') < 30).length,
      active: contacts.filter(c => {
        const conv = conversations.find(conv => conv.contactId === c.id);
        return conv && dayjs().diff(dayjs(conv.updatedAt), 'days') < 7;
      }).length,
      atRisk: contacts.filter(c => {
        const conv = conversations.find(conv => conv.contactId === c.id);
        return conv && dayjs().diff(dayjs(conv.updatedAt), 'days') > 30;
      }).length,
    };
  }

  calculateEngagementMetrics(conversations) {
    return {
      averageMessagesPerConversation: conversations.reduce((sum, conv) => 
        sum + (conv.messages?.length || 0), 0) / conversations.length,
      totalConversations: conversations.length,
      responseRate: this.calculateResponseRate(conversations),
    };
  }

  calculateResponseRate(conversations) {
    let respondedConversations = 0;
    
    conversations.forEach(conv => {
      const hasUserResponse = conv.messages?.some(msg => msg.senderType === "USER");
      if (hasUserResponse) respondedConversations++;
    });
    
    return conversations.length > 0 ? (respondedConversations / conversations.length) * 100 : 0;
  }

  analyzeConversionFunnel(contacts, conversations) {
    return {
      contacts: contacts.length,
      conversations: conversations.length,
      bookings: 0, // Would need to join with bookings data
      conversionRate: 0, // Calculate based on actual data
    };
  }

  assessCustomerLoyalty(contacts, conversations) {
    // Simplified loyalty assessment
    return {
      repeatCustomers: 0, // Would track repeat bookings
      loyaltyScore: 85, // Placeholder
    };
  }

  identifyBottlenecks(bookings, inventory) {
    const bottlenecks = [];
    
    // Check for booking patterns that might indicate issues
    const cancelledBookings = bookings.filter(b => b.status === "CANCELLED");
    if (cancelledBookings.length > bookings.length * 0.2) {
      bottlenecks.push({
        type: "cancellations",
        description: "High cancellation rate detected",
        impact: "high",
      });
    }
    
    return bottlenecks;
  }

  assessEfficiency(bookings) {
    return {
      bookingEfficiency: 85, // Placeholder calculation
      resourceUtilization: 78, // Placeholder
      operationalCost: 45, // Placeholder
    };
  }

  generateHealthAlerts(bookings, inventory) {
    const alerts = [];
    
    // Low stock alerts
    inventory.forEach(item => {
      if (item.quantity < 5) {
        alerts.push({
          type: "inventory",
          message: `${item.name} is running low (${item.quantity} remaining)`,
          severity: item.quantity < 2 ? "critical" : "warning",
        });
      }
    });
    
    return alerts;
  }

  calculateMomentum(dailyBookings) {
    const days = Object.keys(dailyBookings).sort();
    if (days.length < 7) return "stable";
    
    const recent = days.slice(-7).reduce((sum, day) => sum + dailyBookings[day], 0);
    const previous = days.slice(-14, -7).reduce((sum, day) => sum + dailyBookings[day], 0);
    
    if (recent > previous * 1.2) return "accelerating";
    if (recent < previous * 0.8) return "decelerating";
    return "stable";
  }

  detectSeasonality(dailyBookings) {
    // Simple seasonality detection
    const days = Object.keys(dailyBookings).sort();
    if (days.length < 14) return "insufficient_data";
    
    // Check for weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(dailyBookings);
    return weeklyPattern;
  }

  analyzeWeeklyPattern(dailyBookings) {
    const dayOfWeek = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}; // Sun-Sat
    
    Object.entries(dailyBookings).forEach(([date, count]) => {
      const day = new Date(date).getDay();
      dayOfWeek[day] += count;
    });
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames.map((day, index) => ({
      day,
      bookings: dayOfWeek[index],
      average: dayOfWeek[index] / Math.max(1, Math.floor(Object.keys(dailyBookings).length / 7)),
    }));
  }
}

export default new AIInsightsService();
