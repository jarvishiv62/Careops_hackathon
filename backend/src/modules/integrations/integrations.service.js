import prismaService from "../../db/prisma.js";
import { testIntegration } from "../../integrations/integrationFactory.js";

class IntegrationsService {
  /**
   * Get all integrations for workspace
   */
  async getIntegrations(workspaceId) {
    const integrations = await prismaService.client.integration.findMany({
      where: { workspaceId },
      select: {
        id: true,
        type: true,
        name: true,
        isActive: true,
        createdAt: true,
        // Don't expose sensitive config data
        config: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return integrations;
  }

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId, workspaceId) {
    const integration = await prismaService.client.integration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
      select: {
        id: true,
        type: true,
        name: true,
        isActive: true,
        createdAt: true,
        config: true, // Include for owner viewing
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Mask sensitive data in config
    if (integration.config) {
      const maskedConfig = { ...integration.config };

      if (maskedConfig.apiKey) {
        maskedConfig.apiKey = this.maskString(maskedConfig.apiKey);
      }
      if (maskedConfig.authToken) {
        maskedConfig.authToken = this.maskString(maskedConfig.authToken);
      }
      if (maskedConfig.password) {
        maskedConfig.password = this.maskString(maskedConfig.password);
      }

      integration.config = maskedConfig;
    }

    return integration;
  }

  /**
   * Create new integration
   */
  async createIntegration(workspaceId, data) {
    const { type, provider, config } = data;

    // Check if integration of this type already exists and is active
    const existingActive = await prismaService.client.integration.findFirst({
      where: {
        workspaceId,
        type,
        isActive: true,
      },
    });

    // Optionally, you can allow multiple integrations of same type
    // For now, we'll allow it but log a warning
    if (existingActive) {
      console.log(
        `⚠️ Active ${type} integration already exists for workspace ${workspaceId}`,
      );
    }

    // Create integration
    const integration = await prismaService.client.integration.create({
      data: {
        workspaceId,
        type: `${type} - ${provider}`,
        name: `${type} - ${provider}`,
        config,
        isActive: true,
      },
    });

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
      isActive: integration.isActive,
    };
  }

  /**
   * Update integration
   */
  async updateIntegration(integrationId, workspaceId, data) {
    // Verify integration belongs to workspace
    const existing = await prismaService.client.integration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
    });

    if (!existing) {
      throw new Error("Integration not found");
    }

    const integration = await prismaService.client.integration.update({
      where: { id: integrationId },
      data: {
        type: `${data.type} - ${data.provider}`,
        name: `${data.type} - ${data.provider}`,
        config: data.config,
        isActive: data.isActive,
      },
    });

    return {
      id: integration.id,
      type: integration.type,
      name: integration.name,
      isActive: integration.isActive,
    };
  }

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId, workspaceId) {
    const integration = await prismaService.client.integration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    await prismaService.client.integration.delete({
      where: { id: integrationId },
    });

    return { message: "Integration deleted successfully" };
  }

  /**
   * Test integration configuration
   */
  async testIntegrationConfig(integrationId, workspaceId) {
    const integration = await prismaService.client.integration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const result = await testIntegration(integration);

    return result;
  }

  /**
   * Toggle integration active status
   */
  async toggleActive(integrationId, workspaceId) {
    const integration = await prismaService.client.integration.findFirst({
      where: {
        id: integrationId,
        workspaceId,
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const updated = await prismaService.client.integration.update({
      where: { id: integrationId },
      data: {
        isActive: !integration.isActive,
      },
    });

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }

  /**
   * Mask sensitive strings
   */
  maskString(str) {
    if (!str || str.length < 8) return "****";
    return str.substring(0, 4) + "****" + str.substring(str.length - 4);
  }
}

export default new IntegrationsService();
