// backend/src/modules/bookings/availability.service.js
import prismaService from "../../db/prisma.js";
import dayjs from "dayjs";
import {
  parseTimeOnDate,
  getDayOfWeek,
  doSlotsOverlap,
} from "../../utils/datetime.js";

class AvailabilityService {
  /**
   * Get available time slots for a booking type on a specific date
   */
  async getAvailableSlots(bookingTypeId, date, workspaceId) {
    // Get booking type with availability rules
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
        isActive: true,
      },
      include: {
        availabilityRules: true,
        workspace: true,
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    if (bookingType.availabilityRules.length === 0) {
      throw new Error("No availability rules configured for this booking type");
    }

    const timezone = bookingType.workspace.timezone;
    const dayOfWeek = getDayOfWeek(date);

    // Get availability rules for this day of week
    const rulesForDay = bookingType.availabilityRules.filter(
      (rule) => rule.dayOfWeek === dayOfWeek,
    );

    if (rulesForDay.length === 0) {
      return [];
    }

    // Generate all possible slots
    const allSlots = [];

    for (const rule of rulesForDay) {
      const slots = this.generateSlotsForRule(
        date,
        rule.startTime,
        rule.endTime,
        bookingType.duration,
        timezone,
      );
      allSlots.push(...slots);
    }

    // Get existing bookings for this date
    const startOfDay = dayjs(date).startOf("day").toDate();
    const endOfDay = dayjs(date).endOf("day").toDate();

    const existingBookings = await prismaService.client.booking.findMany({
      where: {
        bookingTypeId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    // Filter out slots that overlap with existing bookings
    const availableSlots = allSlots.filter((slot) => {
      return !existingBookings.some((booking) =>
        doSlotsOverlap(
          slot.startTime,
          slot.endTime,
          booking.startTime,
          booking.endTime,
        ),
      );
    });

    // Filter out past slots
    const now = new Date();
    const futureSlots = availableSlots.filter((slot) =>
      dayjs(slot.startTime).isAfter(now),
    );

    return futureSlots;
  }

  /**
   * Generate time slots for a single availability rule
   */
  generateSlotsForRule(date, startTime, endTime, duration, timezone) {
    const slots = [];

    const ruleStart = parseTimeOnDate(date, startTime, timezone);
    const ruleEnd = parseTimeOnDate(date, endTime, timezone);

    let currentSlotStart = dayjs(ruleStart);

    while (currentSlotStart.isBefore(ruleEnd)) {
      const currentSlotEnd = currentSlotStart.add(duration, "minute");

      // Only add slot if it completely fits within the rule's time range
      if (currentSlotEnd.isAfter(ruleEnd)) {
        break;
      }

      slots.push({
        startTime: currentSlotStart.toDate(),
        endTime: currentSlotEnd.toDate(),
        duration,
      });

      // Move to next slot
      currentSlotStart = currentSlotEnd;
    }

    return slots;
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(
    bookingTypeId,
    startTime,
    endTime,
    workspaceId,
    excludeBookingId = null,
  ) {
    // Check if booking type exists and is active
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
        isActive: true,
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found or inactive");
    }

    // Check for overlapping bookings
    const where = {
      bookingTypeId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      OR: [
        // Booking starts during the slot
        {
          startTime: {
            gte: startTime,
            lt: endTime,
          },
        },
        // Booking ends during the slot
        {
          endTime: {
            gt: startTime,
            lte: endTime,
          },
        },
        // Booking completely contains the slot
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gte: endTime } },
          ],
        },
      ],
    };

    // Exclude a specific booking (for updates)
    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const overlappingBookings = await prismaService.client.booking.count({
      where,
    });

    return overlappingBookings === 0;
  }

  /**
   * Get available dates for a booking type (next 30 days)
   */
  async getAvailableDates(bookingTypeId, workspaceId, daysAhead = 30) {
    const bookingType = await prismaService.client.bookingType.findFirst({
      where: {
        id: bookingTypeId,
        workspaceId,
        isActive: true,
      },
      include: {
        availabilityRules: true,
      },
    });

    if (!bookingType) {
      throw new Error("Booking type not found");
    }

    // Get days of week that have availability rules
    const availableDaysOfWeek = new Set(
      bookingType.availabilityRules.map((rule) => rule.dayOfWeek),
    );

    const availableDates = [];
    const today = dayjs();

    for (let i = 0; i < daysAhead; i++) {
      const date = today.add(i, "day");
      const dayOfWeek = date.day();

      if (availableDaysOfWeek.has(dayOfWeek)) {
        availableDates.push({
          date: date.format("YYYY-MM-DD"),
          dayOfWeek,
        });
      }
    }

    return availableDates;
  }
}

export default new AvailabilityService();
