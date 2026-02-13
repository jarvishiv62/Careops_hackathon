import { asyncHandler } from "../../middlewares/errorHandler.js";
import inventoryService from "./inventory.service.js";

class InventoryController {
  /**
   * POST /api/inventory
   * Create new inventory item
   */
  createInventoryItem = asyncHandler(async (req, res) => {
    const { name, description, quantity, minThreshold, unit, category } =
      req.body;

    const inventoryItem = await inventoryService.createInventoryItem({
      name,
      description,
      quantity: parseInt(quantity),
      minThreshold: parseInt(minThreshold),
      unit,
      category,
      workspaceId: req.workspaceId,
    });

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: inventoryItem,
    });
  });

  /**
   * GET /api/inventory
   * Get all inventory items for workspace
   */
  getInventoryItems = asyncHandler(async (req, res) => {
    const inventoryItems = await inventoryService.getInventoryItems(
      req.workspaceId,
    );

    res.json({
      success: true,
      data: inventoryItems,
    });
  });

  /**
   * GET /api/inventory/:id
   * Get inventory item by ID
   */
  getInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const inventoryItem = await inventoryService.getInventoryItem(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      data: inventoryItem,
    });
  });

  /**
   * PUT /api/inventory/:id
   * Update inventory item
   */
  updateInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const inventoryItem = await inventoryService.updateInventoryItem(
      id,
      updateData,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: "Inventory item updated successfully",
      data: inventoryItem,
    });
  });

  /**
   * DELETE /api/inventory/:id
   * Delete inventory item
   */
  deleteInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await inventoryService.deleteInventoryItem(id, req.workspaceId);

    res.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  });
}

export default new InventoryController();
