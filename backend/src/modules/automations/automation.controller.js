// backend/src/modules/automations/automation.controller.js
import automationService from "./automation.service.js";
import { authenticate, requireOwner } from "../../middlewares/auth.js";

class AutomationController {
  // Get all automations for a workspace
  async getAutomations(req, res) {
    try {
      const { workspaceId } = req.workspace;
      
      const automations = await automationService.getWorkspaceAutomations(workspaceId);
      
      res.json({
        success: true,
        data: automations,
      });
    } catch (error) {
      console.error("Error fetching automations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch automations",
      });
    }
  }

  // Create a new automation
  async createAutomation(req, res) {
    try {
      const { workspaceId } = req.workspace;
      const { name, description, trigger, actions, conditions } = req.body;

      if (!name || !trigger || !actions) {
        return res.status(400).json({
          success: false,
          error: "Name, trigger, and actions are required",
        });
      }

      const automation = await automationService.createAutomation({
        workspaceId,
        name,
        description,
        trigger,
        actions,
        conditions,
      });

      res.status(201).json({
        success: true,
        data: automation,
      });
    } catch (error) {
      console.error("Error creating automation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create automation",
      });
    }
  }

  // Update an automation
  async updateAutomation(req, res) {
    try {
      const { workspaceId } = req.workspace;
      const { id } = req.params;
      const { name, description, trigger, actions, conditions, isActive } = req.body;

      const automation = await automationService.updateAutomation(id, {
        workspaceId,
        name,
        description,
        trigger,
        actions,
        conditions,
        isActive,
      });

      if (!automation) {
        return res.status(404).json({
          success: false,
          error: "Automation not found",
        });
      }

      res.json({
        success: true,
        data: automation,
      });
    } catch (error) {
      console.error("Error updating automation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update automation",
      });
    }
  }

  // Delete an automation
  async deleteAutomation(req, res) {
    try {
      const { workspaceId } = req.workspace;
      const { id } = req.params;

      const success = await automationService.deleteAutomation(id, workspaceId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: "Automation not found",
        });
      }

      res.json({
        success: true,
        message: "Automation deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting automation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete automation",
      });
    }
  }

  // Get automation logs
  async getAutomationLogs(req, res) {
    try {
      const { workspaceId } = req.workspace;
      const { automationId, limit = 50, offset = 0 } = req.query;

      const logs = await automationService.getAutomationLogs({
        workspaceId,
        automationId: automationId || null,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching automation logs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch automation logs",
      });
    }
  }

  // Test an automation
  async testAutomation(req, res) {
    try {
      const { workspaceId } = req.workspace;
      const { id } = req.params;
      const { testData } = req.body;

      const result = await automationService.testAutomation(id, workspaceId, testData);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error testing automation:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test automation",
      });
    }
  }

  // Get available triggers
  async getAvailableTriggers(req, res) {
    try {
      const triggers = automationService.getAvailableTriggers();

      res.json({
        success: true,
        data: triggers,
      });
    } catch (error) {
      console.error("Error fetching available triggers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch available triggers",
      });
    }
  }

  // Get available actions
  async getAvailableActions(req, res) {
    try {
      const actions = automationService.getAvailableActions();

      res.json({
        success: true,
        data: actions,
      });
    } catch (error) {
      console.error("Error fetching available actions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch available actions",
      });
    }
  }
}

export default new AutomationController();
