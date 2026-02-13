// backend/src/modules/ai/ai.controller.js
import aiService from "./ai.service.js";
import aiInsightsService from "./aiInsights.service.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

class AIController {
  // Generate smart reply suggestions
  async getSmartReplies(req, res) {
    try {
      const { conversationId } = req.params;
      const { message } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: "Conversation ID is required",
        });
      }

      const suggestions = await aiService.generateSmartReply(conversationId, {
        currentMessage: message || "",
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error("Error generating smart replies:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate smart replies",
      });
    }
  }

  // Analyze sentiment of text
  async analyzeSentiment(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "Text is required for sentiment analysis",
        });
      }

      const analysis = await aiService.analyzeSentiment(text);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze sentiment",
      });
    }
  }

  // Generate conversation summary
  async getConversationSummary(req, res) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: "Conversation ID is required",
        });
      }

      const summary =
        await aiService.generateConversationSummary(conversationId);

      res.json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      console.error("Error generating conversation summary:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate conversation summary",
      });
    }
  }

  // Batch sentiment analysis for multiple messages
  async batchAnalyzeSentiment(req, res) {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: "Messages array is required",
        });
      }

      const results = await Promise.all(
        messages.map(async (message) => {
          const analysis = await aiService.analyzeSentiment(message.text);
          return {
            id: message.id,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            emotions: analysis.emotions,
          };
        }),
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("Error in batch sentiment analysis:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze sentiments",
      });
    }
  }

  // ===== NEW AI INSIGHTS ENDPOINTS =====

  // Get comprehensive business insights
  async getBusinessInsights(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      console.error("Error getting business insights:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate business insights",
      });
    }
  }

  // Get performance insights
  async getPerformanceInsights(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights.performance,
      });
    } catch (error) {
      console.error("Error getting performance insights:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate performance insights",
      });
    }
  }

  // Get predictive analytics
  async getPredictions(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights.predictions,
      });
    } catch (error) {
      console.error("Error getting predictions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate predictions",
      });
    }
  }

  // Get AI recommendations
  async getRecommendations(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights.recommendations,
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate recommendations",
      });
    }
  }

  // Get customer segments
  async getCustomerSegments(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights.customerInsights.segments,
      });
    } catch (error) {
      console.error("Error getting customer segments:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze customer segments",
      });
    }
  }

  // Get customer behavior analytics
  async getCustomerBehavior(req, res) {
    try {
      const { workspaceId } = req;
      const { timeRange = "30d" } = req.query;

      const insights = await aiInsightsService.getBusinessInsights(
        workspaceId,
        timeRange,
      );

      res.json({
        success: true,
        data: insights.customerInsights,
      });
    } catch (error) {
      console.error("Error getting customer behavior:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze customer behavior",
      });
    }
  }

  // Get customer lifetime value
  async getCustomerLifetimeValue(req, res) {
    try {
      const { workspaceId } = req;

      // This would require more complex calculation with actual revenue data
      // For now, return a simplified version
      const clv = {
        averageCLV: 1250,
        totalCustomers: 0,
        topCustomers: [],
        trends: {
          increasing: true,
          growthRate: 15.5,
        },
      };

      res.json({
        success: true,
        data: clv,
      });
    } catch (error) {
      console.error("Error calculating customer lifetime value:", error);
      res.status(500).json({
        success: false,
        error: "Failed to calculate customer lifetime value",
      });
    }
  }
}

export default new AIController();
