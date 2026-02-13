// backend/src/modules/bookings/bookings.routes.js
import express from "express";
import bookingsController from "./bookings.controller.js";
import {
  authenticate,
  requireOwner,
  requireStaff,
} from "../../middlewares/auth.js";
import {
  validate,
  createBookingTypeSchema,
  createAvailabilityRuleSchema,
} from "../../utils/validation.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get active booking types for public booking page
router.get(
  "/public/:workspaceId/types",
  bookingsController.getPublicBookingTypes,
);

// Get available dates
router.get("/public/:workspaceId/dates", bookingsController.getAvailableDates);

// Get available slots for a specific date
router.get(
  "/public/:workspaceId/availability",
  bookingsController.getAvailableSlots,
);

// Create booking (public)
router.post("/public/:workspaceId", bookingsController.createPublicBooking);

// Get booking by reference code
router.get(
  "/public/reference/:referenceCode",
  bookingsController.getBookingByReference,
);

// ==================== PROTECTED ROUTES ====================

router.use(authenticate); // All routes below require authentication

// Booking Types
router.get("/types", bookingsController.getBookingTypes);
router.get("/types/:id", bookingsController.getBookingType);
router.post(
  "/types",
  requireOwner,
  validate(createBookingTypeSchema),
  bookingsController.createBookingType,
);
router.patch("/types/:id", requireOwner, bookingsController.updateBookingType);
router.delete("/types/:id", requireOwner, bookingsController.deleteBookingType);

// Availability Rules
router.post(
  "/types/:id/availability",
  requireOwner,
  validate(createAvailabilityRuleSchema),
  bookingsController.addAvailabilityRule,
);
router.delete(
  "/availability/:ruleId",
  requireOwner,
  bookingsController.deleteAvailabilityRule,
);

// Forms
router.post(
  "/types/:id/forms/:formId",
  requireOwner,
  bookingsController.linkForm,
);
router.delete(
  "/types/:id/forms/:formId",
  requireOwner,
  bookingsController.unlinkForm,
);

// Bookings
router.get("/upcoming", bookingsController.getUpcomingBookings);
router.get("/today", bookingsController.getTodaysBookings);
router.get("/:id", bookingsController.getBooking);
router.get("/", bookingsController.getBookings);
router.post("/", bookingsController.createBooking);

// Booking management (staff can update status)
router.patch(
  "/:id/status",
  requireStaff,
  bookingsController.updateBookingStatus,
);
router.patch(
  "/:id/reschedule",
  requireStaff,
  bookingsController.rescheduleBooking,
);
router.delete("/:id", requireStaff, bookingsController.cancelBooking);

export default router;
