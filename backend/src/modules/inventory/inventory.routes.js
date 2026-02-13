import express from "express";
import inventoryController from "./inventory.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Inventory CRUD operations
router.post("/", inventoryController.createInventoryItem);
router.get("/", inventoryController.getInventoryItems);
router.get("/:id", inventoryController.getInventoryItem);
router.put("/:id", inventoryController.updateInventoryItem);
router.delete("/:id", inventoryController.deleteInventoryItem);

export default router;
