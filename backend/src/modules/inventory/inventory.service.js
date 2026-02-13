import { prisma } from "../../db/prisma.js";

class InventoryService {
  /**
   * Create new inventory item
   */
  async createInventoryItem(data) {
    const inventoryItem = await prisma.inventory.create({
      data: {
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        workspaceId: data.workspaceId,
        metadata: {
          minThreshold: data.minThreshold,
        },
      },
    });

    return inventoryItem;
  }

  /**
   * Get all inventory items for workspace
   */
  async getInventoryItems(workspaceId) {
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        workspaceId: workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return inventoryItems;
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItem(id, workspaceId) {
    const inventoryItem = await prisma.inventory.findFirst({
      where: {
        id: id,
        workspaceId: workspaceId,
      },
    });

    if (!inventoryItem) {
      throw new Error("Inventory item not found");
    }

    return inventoryItem;
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id, updateData, workspaceId) {
    // Handle minThreshold in metadata
    const dataToUpdate = { ...updateData };
    if (updateData.minThreshold !== undefined) {
      dataToUpdate.metadata = {
        minThreshold: updateData.minThreshold,
      };
      delete dataToUpdate.minThreshold;
    }

    const inventoryItem = await prisma.inventory.updateMany({
      where: {
        id: id,
        workspaceId: workspaceId,
      },
      data: dataToUpdate,
    });

    if (inventoryItem.count === 0) {
      throw new Error("Inventory item not found");
    }

    // Return the updated item
    return await this.getInventoryItem(id, workspaceId);
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(id, workspaceId) {
    const result = await prisma.inventory.deleteMany({
      where: {
        id: id,
        workspaceId: workspaceId,
      },
    });

    if (result.count === 0) {
      throw new Error("Inventory item not found");
    }
  }
}

export default new InventoryService();
