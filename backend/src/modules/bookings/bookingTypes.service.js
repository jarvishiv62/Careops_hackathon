// backend/src/modules/bookings/bookingTypes.service.js
import prismaService from "../../db/prisma.js";

class BookingTypesService {
  /**
   * Get all booking types for workspace
   */
  async getBookingTypes(workspaceId, includeInactive = false) {
    const where = { workspaceId };

    if (!includeInactive) {
      where.isActive = true;
    }

    const bookingTypes = await prismaService.client.bookingType.findMany({
      where,
      include: {
        availabilityRules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        forms: {
          include: {
            form: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return bookingTypes;
  }

  /**
   * Get booking type by ID
   */
  async getBookingType(bookingTypeId, workspaceId) {
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
      },
      include: {
        availabilityRules: true,
        forms: {
          include: {
            form: true,
          },
        },
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    return bookingType;
  }

  /**
   * Create new booking type
   */
  async createBookingType(workspaceId, data) {
    const bookingType = await prismaService.client.bookingType.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        duration: data.duration,
        location: data.location,
        isActive: true,
        availabilityRules: {
          create: [
            // Monday to Friday - 9 AM to 5 PM
            ...[1, 2, 3, 4, 5].map((dayOfWeek) => ({
              dayOfWeek,
              startTime: "09:00",
              endTime: "17:00",
            })),
            // Saturday - 9 AM to 1 PM
            {
              dayOfWeek: 6,
              startTime: "09:00",
              endTime: "13:00",
            },
          ],
        },
      },
      include: {
        availabilityRules: true,
      },
    });

    return bookingType;
  }

  /**
   * Update booking type
   */
  async updateBookingType(bookingTypeId, workspaceId, data) {
    const existing = await prisma.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
      },
    });

    if (!existing) {
      throw new Error("Booking type not found");
    }

    const bookingType = await prismaService.client.bookingType.update({
      where: { id: bookingTypeId },
      data: {
        name: data.name,
        description: data.description,
        duration: data.duration,
        location: data.location,
        isActive: data.isActive,
      },
      include: {
        availabilityRules: true,
      },
    });

    return bookingType;
  }

  /**
   * Delete booking type
   */
  async deleteBookingType(bookingTypeId, workspaceId) {
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    // Check if there are any active bookings
    const activeBookings = await prismaService.client.booking.count({
      where: {
        bookingTypeId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings > 0) {
      throw new Error("Cannot delete booking type with active bookings");
    }

    await prismaService.client.bookingType.delete({
      where: { id: bookingTypeId },
    });

    return { message: "Booking type deleted successfully" };
  }

  /**
   * Add availability rule
   */
  async addAvailabilityRule(bookingTypeId, workspaceId, data) {
    // Verify booking type belongs to workspace
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    // Validate time format and logic
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error("End time must be after start time");
    }

    const rule = await prismaService.client.availabilityRule.create({
      data: {
        bookingTypeId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    return rule;
  }

  /**
   * Delete availability rule
   */
  async deleteAvailabilityRule(ruleId, workspaceId) {
    const rule = await prismaService.client.availabilityRule.findUnique({
      where: { id: ruleId },
      include: {
        bookingType: true,
      },
    });

    if (!rule) {
      throw new Error("Availability rule not found");
    }

    if (rule.bookingType.workspaceId !== workspaceId) {
      throw new Error("Unauthorized");
    }

    await prismaService.client.availabilityRule.delete({
      where: { id: ruleId },
    });

    return { message: "Availability rule deleted successfully" };
  }

  /**
   * Link form to booking type
   */
  async linkForm(bookingTypeId, formId, workspaceId) {
    // Verify booking type and form belong to workspace
    const [bookingType, form] = await Promise.all([
      prismaService.client.bookingType.findFirst({
        where: { id: bookingTypeId, workspaceId },
      }),
      prismaService.client.form.findFirst({
        where: { id: formId, workspaceId },
      }),
    ]);

    if (!bookingType || !form) {
      throw new Error("Booking type or form not found");
    }

    // Check if already linked
    const existing = await prismaService.client.formBookingType.findUnique({
      where: {
        formId_bookingTypeId: {
          formId,
          bookingTypeId,
        },
      },
    });

    if (existing) {
      throw new Error("Form already linked to this booking type");
    }

    await prismaService.client.formBookingType.create({
      data: {
        formId,
        bookingTypeId,
      },
    });

    return { message: "Form linked successfully" };
  }

  /**
   * Unlink form from booking type
   */
  async unlinkForm(bookingTypeId, formId, workspaceId) {
    // Verify ownership
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: { id: bookingTypeId, workspaceId },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    await prismaService.client.formBookingType.delete({
      where: {
        formId_bookingTypeId: {
          formId,
          bookingTypeId,
        },
      },
    });

    return { message: "Form unlinked successfully" };
  }
}

export default new BookingTypesService();
