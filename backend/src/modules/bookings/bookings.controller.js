// backend/src/modules/bookings/bookings.controller.js
import { asyncHandler } from "../../middlewares/errorHandler.js";
import { prisma } from "../../db/prisma.js";
import bookingsService from "./bookings.service.js";
import bookingTypesService from "./bookingTypes.service.js";
import availabilityService from "./availability.service.js";

class BookingsController {
  // ==================== BOOKING TYPES ====================

  /**
   * GET /api/bookings/types
   * Get all booking types
   */
  getBookingTypes = asyncHandler(async (req, res) => {
    const bookingTypes = await bookingTypesService.getBookingTypes(
      req.workspaceId,
    );

    res.json({
      success: true,
      data: bookingTypes,
    });
  });

  /**
   * GET /api/bookings/types/:id
   * Get booking type by ID
   */
  getBookingType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bookingType = await bookingTypesService.getBookingType(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      data: bookingType,
    });
  });

  /**
   * POST /api/bookings/types
   * Create booking type (OWNER only)
   */
  createBookingType = asyncHandler(async (req, res) => {
    const data = req.validatedData;

    const bookingType = await bookingTypesService.createBookingType(
      req.workspaceId,
      data,
    );

    res.status(201).json({
      success: true,
      message: "Booking type created successfully",
      data: bookingType,
    });
  });

  /**
   * PATCH /api/bookings/types/:id
   * Update booking type (OWNER only)
   */
  updateBookingType = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, duration, location, isActive } = req.body;

    const bookingType = await bookingTypesService.updateBookingType(
      id,
      req.workspaceId,
      { name, description, duration, location, isActive },
    );

    res.json({
      success: true,
      message: "Booking type updated successfully",
      data: bookingType,
    });
  });

  /**
   * DELETE /api/bookings/types/:id
   * Delete booking type (OWNER only)
   */
  deleteBookingType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await bookingTypesService.deleteBookingType(
      id,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  // ==================== AVAILABILITY ====================

  /**
   * POST /api/bookings/types/:id/availability
   * Add availability rule (OWNER only)
   */
  addAvailabilityRule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.validatedData;

    const rule = await bookingTypesService.addAvailabilityRule(
      id,
      req.workspaceId,
      data,
    );

    res.status(201).json({
      success: true,
      message: "Availability rule added successfully",
      data: rule,
    });
  });

  /**
   * DELETE /api/bookings/availability/:ruleId
   * Delete availability rule (OWNER only)
   */
  deleteAvailabilityRule = asyncHandler(async (req, res) => {
    const { ruleId } = req.params;

    const result = await bookingTypesService.deleteAvailabilityRule(
      ruleId,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * GET /api/bookings/public/:workspaceId/types
   * Get active booking types (PUBLIC)
   */
  getPublicBookingTypes = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const bookingTypes = await bookingTypesService.getBookingTypes(
      workspaceId,
      false,
    );

    res.json({
      success: true,
      data: bookingTypes,
    });
  });

  /**
   * GET /api/bookings/public/:workspaceId/availability
   * Get available slots (PUBLIC)
   */
  getAvailableSlots = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { bookingTypeId, date } = req.query;

    if (!bookingTypeId || !date) {
      return res.status(400).json({
        success: false,
        error: "bookingTypeId and date are required",
      });
    }

    const slots = await availabilityService.getAvailableSlots(
      bookingTypeId,
      date,
      workspaceId,
    );

    res.json({
      success: true,
      data: slots,
    });
  });

  /**
   * GET /api/bookings/public/:workspaceId/dates
   * Get available dates (PUBLIC)
   */
  getAvailableDates = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { bookingTypeId } = req.query;

    if (!bookingTypeId) {
      return res.status(400).json({
        success: false,
        error: "bookingTypeId is required",
      });
    }

    const dates = await availabilityService.getAvailableDates(
      bookingTypeId,
      workspaceId,
    );

    res.json({
      success: true,
      data: dates,
    });
  });

  // ==================== BOOKINGS ====================

  /**
   * GET /api/bookings
   * Get all bookings
   */
  getBookings = asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      bookingTypeId: req.query.bookingTypeId,
    };

    const bookings = await bookingsService.getBookings(
      req.workspaceId,
      filters,
    );

    res.json({
      success: true,
      data: bookings,
    });
  });

  /**
   * GET /api/bookings/:id
   * Get booking by ID
   */
  getBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await bookingsService.getBooking(id, req.workspaceId);

    res.json({
      success: true,
      data: booking,
    });
  });

  /**
   * GET /api/bookings/upcoming
   * Get upcoming bookings
   */
  getUpcomingBookings = asyncHandler(async (req, res) => {
    const bookings = await bookingsService.getUpcomingBookings(req.workspaceId);

    res.json({
      success: true,
      data: bookings,
    });
  });

  /**
   * GET /api/bookings/today
   * Get today's bookings
   */
  getTodaysBookings = asyncHandler(async (req, res) => {
    const bookings = await bookingsService.getTodaysBookings(req.workspaceId);

    res.json({
      success: true,
      data: bookings,
    });
  });

  /**
   * POST /api/bookings/public/:workspaceId
   * Create booking (PUBLIC)
   */
  createPublicBooking = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const { bookingTypeId, startTime, name, email, phone, notes } = req.body;

    if (!bookingTypeId || !startTime || !name || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        error:
          "bookingTypeId, startTime, name, and email or phone are required",
      });
    }

    const booking = await bookingsService.createBooking(workspaceId, {
      bookingTypeId,
      startTime,
      name,
      email,
      phone,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  });

  /**
   * POST /api/bookings
   * Create booking (AUTHENTICATED)
   */
  createBooking = asyncHandler(async (req, res) => {
    const { contactId, bookingTypeId, startTime, date, notes } = req.body;

    if (!contactId || !bookingTypeId || !startTime || !date) {
      return res.status(400).json({
        success: false,
        error: "contactId, bookingTypeId, startTime, and date are required",
      });
    }

    // Get contact details to extract name, email, phone
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return res.status(400).json({
        success: false,
        error: "Contact not found",
      });
    }

    // Combine date and startTime
    const bookingDateTime = new Date(`${date}T${startTime}`);

    const booking = await bookingsService.createBooking(req.workspaceId, {
      bookingTypeId,
      startTime: bookingDateTime.toISOString(),
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  });

  /**
   * GET /api/bookings/public/reference/:referenceCode
   * Get booking by reference code (PUBLIC)
   */
  getBookingByReference = asyncHandler(async (req, res) => {
    const { referenceCode } = req.params;

    const booking = await bookingsService.getBookingByReference(referenceCode);

    res.json({
      success: true,
      data: booking,
    });
  });

  /**
   * PATCH /api/bookings/:id/status
   * Update booking status
   */
  updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (
      !["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"].includes(
        status,
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const booking = await bookingsService.updateBookingStatus(
      id,
      req.workspaceId,
      status,
      notes,
    );

    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  });

  /**
   * PATCH /api/bookings/:id/reschedule
   * Reschedule booking
   */
  rescheduleBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startTime } = req.body;

    if (!startTime) {
      return res.status(400).json({
        success: false,
        error: "New start time is required",
      });
    }

    const booking = await bookingsService.rescheduleBooking(
      id,
      req.workspaceId,
      startTime,
    );

    res.json({
      success: true,
      message: "Booking rescheduled successfully",
      data: booking,
    });
  });

  /**
   * DELETE /api/bookings/:id
   * Cancel booking
   */
  cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await bookingsService.cancelBooking(id, req.workspaceId);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  });

  // ==================== FORMS ====================

  /**
   * POST /api/bookings/types/:id/forms/:formId
   * Link form to booking type (OWNER only)
   */
  linkForm = asyncHandler(async (req, res) => {
    const { id, formId } = req.params;

    const result = await bookingTypesService.linkForm(
      id,
      formId,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });

  /**
   * DELETE /api/bookings/types/:id/forms/:formId
   * Unlink form from booking type (OWNER only)
   */
  unlinkForm = asyncHandler(async (req, res) => {
    const { id, formId } = req.params;

    const result = await bookingTypesService.unlinkForm(
      id,
      formId,
      req.workspaceId,
    );

    res.json({
      success: true,
      message: result.message,
    });
  });
}

export default new BookingsController();
