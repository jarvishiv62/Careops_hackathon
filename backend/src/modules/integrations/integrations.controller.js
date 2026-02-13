// backend/src/modules/integrations/integrations.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import integrationsService from "./integrations.service.js";

class IntegrationsController {
  /**
   * GET /api/integrations
   * Get all integrations
   */
  getIntegrations = asyncHandler(async (req, res) => {
    const integrations = await integrationsService.getIntegrations(
      req.workspaceId,
    );

    res.json({
      success: true,
      data: integrations,
    });
  });

  /**
   * GET /api/integrations/:id
   * Get integration by ID
   */
  getIntegration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const integration = await integrationsService.getIntegration(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      data: integration,
    });
  });

  /**
   * POST /api/integrations
   * Create new integration (OWNER only)
   */
  createIntegration = asyncHandler(async (req, res) => {
    const data = req.validatedData;

    const integration = await integrationsService.createIntegration(
      req.workspaceId,
      data,
    );

    res.status(201).json({
      success: true,
      message: "Integration created successfully",
      data: integration,
    });
  });

  /**
   * PATCH /api/integrations/:id
   * Update integration (OWNER only)
   */
  updateIntegration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { provider, config, isActive } = req.body;

    const integration = await integrationsService.updateIntegration(
      id,
      req.workspaceId,
      { provider, config, isActive },
    );

    res.json({
      success: true,
      message: "Integration updated successfully",
      data: integration,
    });
  });

  /**
   * DELETE /api/integrations/:id
   * Delete integration (OWNER only)
   */
  deleteIntegration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await integrationsService.deleteIntegration(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * POST /api/integrations/:id/test
   * Test integration configuration
   */
  testIntegration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await integrationsService.testIntegrationConfig(
      id,
      req.workspaceId,
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Integration verified successfully with ${result.provider}`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  });

  /**
   * PATCH /api/integrations/:id/toggle
   * Toggle integration active status
   */
  toggleActive = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const integration = await integrationsService.toggleActive(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: `Integration ${integration.isActive ? "activated" : "deactivated"}`,
      data: integration,
    });
  });
}

export default new IntegrationsController();
