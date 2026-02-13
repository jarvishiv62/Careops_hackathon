// backend/src/modules/bookings/bookingTypes.routes.js
import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import {
  workspaceMiddleware,
  requireWorkspace,
} from "../../middlewares/workspace.js";
import { asyncHandler } from "../../middlewares/errorHandler.js";
import bookingTypesService from "./bookingTypes.service.js";

const router = express.Router();

// Apply authentication and workspace middleware to all routes
router.use(authenticate);
router.use(workspaceMiddleware);
router.use(requireWorkspace);

/**
 * GET /api/bookings/types
 * Get all booking types for workspace
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const bookingTypes = await bookingTypesService.getBookingTypes(
      req.workspaceId,
    );

    res.json({
      success: true,
      data: bookingTypes,
      count: bookingTypes.length,
    });
  }),
);

/**
 * GET /api/bookings/types/:id
 * Get booking type by ID
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookingType = await bookingTypesService.getBookingType(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      data: bookingType,
    });
  }),
);

/**
 * POST /api/bookings/types
 * Create new booking type
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const bookingType = await bookingTypesService.createBookingType(
      req.workspaceId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: bookingType,
      message: "Booking type created successfully",
    });
  }),
);

/**
 * PATCH /api/bookings/types/:id
 * Update booking type
 */
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const bookingType = await bookingTypesService.updateBookingType(
      id,
      req.workspaceId,
      req.body,
    );

    res.json({
      success: true,
      data: bookingType,
      message: "Booking type updated successfully",
    });
  }),
);

/**
 * DELETE /api/bookings/types/:id
 * Delete booking type
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await bookingTypesService.deleteBookingType(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      ...result,
    });
  }),
);

/**
 * POST /api/bookings/types/:id/availability
 * Add availability rule
 */
router.post(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rule = await bookingTypesService.addAvailabilityRule(
      id,
      req.workspaceId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: rule,
      message: "Availability rule added successfully",
    });
  }),
);

/**
 * DELETE /api/bookings/types/availability/:ruleId
 * Delete availability rule
 */
router.delete(
  "/availability/:ruleId",
  asyncHandler(async (req, res) => {
    const { ruleId } = req.params;
    const result = await bookingTypesService.deleteAvailabilityRule(
      ruleId,
      req.workspaceId,
    );

    res.json({
      success: true,
      ...result,
    });
  }),
);

/**
 * POST /api/bookings/types/:id/forms/:formId
 * Link form to booking type
 */
router.post(
  "/:id/forms/:formId",
  asyncHandler(async (req, res) => {
    const { id, formId } = req.params;
    const result = await bookingTypesService.linkForm(
      id,
      formId,
      req.workspaceId,
    );

    res.json({
      success: true,
      ...result,
    });
  }),
);

/**
 * DELETE /api/bookings/types/:id/forms/:formId
 * Unlink form from booking type
 */
router.delete(
  "/:id/forms/:formId",
  asyncHandler(async (req, res) => {
    const { id, formId } = req.params;
    const result = await bookingTypesService.unlinkForm(
      id,
      formId,
      req.workspaceId,
    );

    res.json({
      success: true,
      ...result,
    });
  }),
);

export default router;
