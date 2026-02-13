import express from "express";
import publicController from "./public.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/public/:workspaceId", publicController.submitPublicContact);
router.get("/public/:workspaceId/info", publicController.getWorkspaceInfo);

export default router;
