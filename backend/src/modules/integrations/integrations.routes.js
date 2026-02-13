// backend/src/modules/integrations/integrations.routes.js
import express from "express";
import integrationsController from "./integrations.controller.js";
import { authenticate, requireOwner } from "../../middlewares/auth.js";
import { validate, createIntegrationSchema } from "../../utils/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get integrations (all staff can view)
router.get("/", integrationsController.getIntegrations);
router.get("/:id", integrationsController.getIntegration);

// Owner-only routes
router.post(
  "/",
  requireOwner,
  validate(createIntegrationSchema),
  integrationsController.createIntegration,
);
router.patch("/:id", requireOwner, integrationsController.updateIntegration);
router.delete("/:id", requireOwner, integrationsController.deleteIntegration);
router.post("/:id/test", requireOwner, integrationsController.testIntegration);
router.patch("/:id/toggle", requireOwner, integrationsController.toggleActive);

export default router;
