// backend/src/modules/bookings/bookings.service.js
import prismaService from "../../db/prisma.js";
import { customAlphabet } from "nanoid";
import eventEmitter from "../../events/eventEmitter.js";
import availabilityService from "./availability.service.js";
import dayjs from "dayjs";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

class BookingsService {
  /**
   * Get all bookings for workspace
   */
  async getBookings(workspaceId, filters = {}) {
    const where = { workspaceId };

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by date range
    if (filters.startDate) {
      where.startTime = { gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.endTime = { lte: new Date(filters.endDate) };
    }

    // Filter by booking type
    if (filters.bookingTypeId) {
      where.bookingTypeId = filters.bookingTypeId;
    }

    const bookings = await prismaService.client.booking.findMany({
      where,
      include: {
        contact: true,
        bookingType: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return bookings;
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId, workspaceId) {
    const booking = await prismaService.client.booking.findFirst({
      where: {
        id: bookingId,
        workspaceId,
      },
      include: {
        contact: true,
        bookingType: {
          include: {
            forms: {
              include: {
                form: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  /**
   * Get booking by reference code (public)
   */
  async getBookingByReference(referenceCode) {
    const booking = await prismaService.client.booking.findUnique({
      where: { referenceCode },
      include: {
        contact: true,
        bookingType: true,
        workspace: {
          select: {
            name: true,
            address: true,
            contactEmail: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking;
  }

  /**
   * Create new booking (with full transaction)
   */
  async createBooking(workspaceId, data) {
    return await prismaService.client.$transaction(async (tx) => {
      // 1. Verify booking type exists and is active
      const bookingType = await tx.bookingType.findFirst({
        where: {
          id: data.bookingTypeId,
          workspaceId,
          isActive: true,
        },
        include: {
          forms: {
            include: {
              form: true,
            },
          },
        },
      });

      if (!bookingType) {
        throw new Error("Booking type not found or inactive");
      }

      // 2. Calculate end time based on duration
      const startTime = new Date(data.startTime);
      const endTime = dayjs(startTime)
        .add(bookingType.duration, "minute")
        .toDate();

      // 3. Check slot availability
      const isAvailable = await availabilityService.isSlotAvailable(
        data.bookingTypeId,
        startTime,
        endTime,
        workspaceId,
      );

      if (!isAvailable) {
        throw new Error("This time slot is no longer available");
      }

      // 4. Find or create contact
      let contact = null;

      if (data.email || data.phone) {
        contact = await tx.contact.findFirst({
          where: {
            workspaceId,
            OR: [
              data.email ? { email: data.email } : null,
              data.phone ? { phone: data.phone } : null,
            ].filter(Boolean),
          },
        });
      }

      if (!contact) {
        // Create new contact
        const nameParts = data.name.split(" ");
        contact = await tx.contact.create({
          data: {
            workspaceId,
            firstName: nameParts[0] || "Unknown",
            lastName: nameParts.slice(1).join(" ") || "",
            email: data.email,
            phone: data.phone,
          },
        });

        // Create conversation for new contact
        await tx.conversation.create({
          data: {
            workspaceId,
            contactId: contact.id,
            channel: "EMAIL",
          },
        });

        // Emit contact created event (for welcome message)
        await eventEmitter.emitContactCreated(contact);
      }

      // 5. Generate unique reference code
      let referenceCode;
      let isUnique = false;

      while (!isUnique) {
        referenceCode = nanoid();
        const existing = await tx.booking.findUnique({
          where: { referenceCode },
        });
        isUnique = !existing;
      }

      // 6. Create booking
      const booking = await tx.booking.create({
        data: {
          workspaceId,
          contactId: contact.id,
          bookingTypeId: data.bookingTypeId,
          referenceCode,
          startTime,
          endTime,
          status: "PENDING",
          notes: data.notes,
        },
        include: {
          contact: true,
          bookingType: true,
        },
      });

      // 7. Create form submissions for linked forms
      if (bookingType.forms.length > 0) {
        for (const { form } of bookingType.forms) {
          await tx.formSubmission.create({
            data: {
              formId: form.id,
              bookingId: booking.id,
              status: "PENDING",
            },
          });
        }
      }

      // 8. Emit booking created event (for confirmation email/SMS)
      await eventEmitter.emitBookingCreated(booking);

      return booking;
    });
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, workspaceId, status, notes = null) {
    const booking = await prismaService.client.booking.findFirst({
      where: {
        id: bookingId,
        workspaceId,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const updated = await prismaService.client.booking.update({
      where: { id: bookingId },
      data: {
        status,
        notes: notes || booking.notes,
      },
      include: {
        contact: true,
        bookingType: true,
      },
    });

    // Emit status change event
    await eventEmitter.emitBookingUpdated(updated);
    return updated;
  }

  /**
   * Reschedule booking
   */
  async rescheduleBooking(bookingId, workspaceId, newStartTime) {
    return await prismaService.client.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          workspaceId,
        },
        include: {
          bookingType: true,
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        throw new Error("Cannot reschedule completed or cancelled bookings");
      }

      // Calculate new end time
      const startTime = new Date(newStartTime);
      const endTime = dayjs(startTime)
        .add(booking.bookingType.duration, "minute")
        .toDate();

      // Check if new slot is available
      const isAvailable = await availabilityService.isSlotAvailable(
        booking.bookingTypeId,
        startTime,
        endTime,
        workspaceId,
        bookingId, // Exclude current booking
      );

      if (!isAvailable) {
        throw new Error("The new time slot is not available");
      }

      // Update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          startTime,
          endTime,
        },
        include: {
          contact: true,
          bookingType: true,
        },
      });

      // Emit rescheduled event
      await eventEmitter.emitBookingUpdated(updated);

      return updated;
    });
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, workspaceId) {
    const booking = await prismaService.client.booking.findFirst({
      where: {
        id: bookingId,
        workspaceId,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "COMPLETED") {
      throw new Error("Cannot cancel completed bookings");
    }

    const updated = await prismaService.client.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: {
        contact: true,
        bookingType: true,
      },
    });

    await eventEmitter.emitBookingCancelled(updated);

    return updated;
  }

  /**
   * Get upcoming bookings (next 7 days)
   */
  async getUpcomingBookings(workspaceId) {
    const now = new Date();
    const sevenDaysFromNow = dayjs().add(7, "day").toDate();

    const bookings = await prismaService.client.booking.findMany({
      where: {
        workspaceId,
        startTime: {
          gte: now,
          lte: sevenDaysFromNow,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      include: {
        contact: true,
        bookingType: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return bookings;
  }

  /**
   * Get today's bookings
   */
  async getTodaysBookings(workspaceId) {
    const startOfDay = dayjs().startOf("day").toDate();
    const endOfDay = dayjs().endOf("day").toDate();

    const bookings = await prismaService.client.booking.findMany({
      where: {
        workspaceId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        contact: true,
        bookingType: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return bookings;
  }
}

export default new BookingsService();
