// backend/src/modules/ai/ai.routes.js
import express from "express";
import aiController from "./ai.controller.js";
import { authenticate, requireStaff } from "../../middlewares/auth.js";

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Smart replies
router.post(
  "/smart-replies/:conversationId",
  requireStaff,
  aiController.getSmartReplies,
);

// Sentiment analysis
router.post("/sentiment", requireStaff, aiController.analyzeSentiment);
router.post(
  "/sentiment/batch",
  requireStaff,
  aiController.batchAnalyzeSentiment,
);

// Conversation summary
router.get(
  "/summary/:conversationId",
  requireStaff,
  aiController.getConversationSummary,
);

// Business insights (NEW)
router.get("/insights", requireStaff, aiController.getBusinessInsights);
router.get(
  "/insights/performance",
  requireStaff,
  aiController.getPerformanceInsights,
);
router.get("/insights/predictions", requireStaff, aiController.getPredictions);
router.get(
  "/insights/recommendations",
  requireStaff,
  aiController.getRecommendations,
);

// Customer analytics (NEW)
router.get(
  "/customers/segments",
  requireStaff,
  aiController.getCustomerSegments,
);
router.get(
  "/customers/behavior",
  requireStaff,
  aiController.getCustomerBehavior,
);
router.get(
  "/customers/lifetime-value",
  requireStaff,
  aiController.getCustomerLifetimeValue,
);

export default router;
