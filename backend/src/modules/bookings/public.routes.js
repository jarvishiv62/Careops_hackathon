import express from "express";
import publicController from "./public.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public/:workspaceId/types", publicController.getPublicBookingTypes);
router.get("/public/:workspaceId/availability", publicController.getAvailableSlots);
router.post("/public/:workspaceId", publicController.createPublicBooking);

export default router;
