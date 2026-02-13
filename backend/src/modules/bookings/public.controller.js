import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import automationProcessor from "../../events/automationProcessor.js";

const prisma = new PrismaClient();

class PublicBookingController {
  // Get public booking types for a workspace
  async getPublicBookingTypes(req, res) {
    try {
      const { workspaceId } = req.params;

      const bookingTypes = await prisma.bookingType.findMany({
        where: {
          workspaceId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          location: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      res.json({
        success: true,
        data: bookingTypes,
      });
    } catch (error) {
      console.error("Error fetching public booking types:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking types",
      });
    }
  }

  // Get available time slots for a specific date and booking type
  async getAvailableSlots(req, res) {
    try {
      const { workspaceId } = req.params;
      const { bookingTypeId, date } = req.query;

      if (!bookingTypeId || !date) {
        return res.status(400).json({
          success: false,
          error: "Booking type ID and date are required",
        });
      }

      // Get booking type and availability rules
      const bookingType = await prisma.bookingType.findFirst({
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
        return res.status(404).json({
          success: false,
          error: "Booking type not found",
        });
      }

      const targetDate = dayjs(date);
      const dayOfWeek = targetDate.day();

      // Get availability for this day of week
      const dayAvailability = bookingType.availabilityRules.find(
        (rule) => rule.dayOfWeek === dayOfWeek,
      );

      if (!dayAvailability) {
        return res.json({
          success: true,
          data: [],
        });
      }

      // Generate time slots
      const slots = [];
      const startTime = dayjs(`${date} ${dayAvailability.startTime}`);
      const endTime = dayjs(`${date} ${dayAvailability.endTime}`);
      const slotDuration = bookingType.duration;

      let currentSlot = startTime;
      while (
        currentSlot.add(slotDuration, "minute").isBefore(endTime) ||
        currentSlot.add(slotDuration, "minute").isSame(endTime)
      ) {
        slots.push({
          startTime: currentSlot.toISOString(),
          endTime: currentSlot.add(slotDuration, "minute").toISOString(),
          duration: slotDuration,
        });
        currentSlot = currentSlot.add(slotDuration, "minute");
      }

      // Filter out already booked slots
      const existingBookings = await prisma.booking.findMany({
        where: {
          bookingTypeId,
          startTime: {
            gte: targetDate.startOf("day").toDate(),
            lt: targetDate.endOf("day").toDate(),
          },
          status: {
            in: ["CONFIRMED", "PENDING"],
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      const availableSlots = slots.filter((slot) => {
        return !existingBookings.some((booking) => {
          const bookingStart = dayjs(booking.startTime);
          const bookingEnd = dayjs(booking.endTime);
          const slotStart = dayjs(slot.startTime);
          const slotEnd = dayjs(slot.endTime);

          return (
            slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart)
          );
        });
      });

      res.json({
        success: true,
        data: availableSlots,
      });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch available slots",
      });
    }
  }

  // Create public booking
  async createPublicBooking(req, res) {
    try {
      const { workspaceId } = req.params;
      const {
        bookingTypeId,
        startTime,
        firstName,
        lastName,
        email,
        phone,
        notes,
      } = req.body;

      if (!bookingTypeId || !startTime || !firstName || !email) {
        return res.status(400).json({
          success: false,
          error:
            "Required fields: booking type, start time, first name, and email",
        });
      }

      // Verify booking type exists and is active
      const bookingType = await prisma.bookingType.findFirst({
        where: {
          id: bookingTypeId,
          workspaceId,
          isActive: true,
        },
      });

      if (!bookingType) {
        return res.status(404).json({
          success: false,
          error: "Booking type not found or inactive",
        });
      }

      // Check if slot is still available
      const slotStart = dayjs(startTime);
      const slotEnd = slotStart.add(bookingType.duration, "minute");

      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          bookingTypeId,
          startTime: {
            gte: slotStart.toDate(),
            lt: slotEnd.toDate(),
          },
          status: {
            in: ["CONFIRMED", "PENDING"],
          },
        },
      });

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          error: "This time slot is no longer available",
        });
      }

      // Create or find contact
      let contact = await prisma.contact.findFirst({
        where: {
          workspaceId,
          email: email,
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            workspaceId,
            firstName,
            lastName: lastName || "",
            email,
            phone: phone || null,
            tags: ["public_booking"],
            customFields: {
              source: "public_booking_form",
              bookingCount: 1,
            },
          },
        });
      } else {
        // Update existing contact
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            firstName: firstName || contact.firstName,
            lastName: lastName || contact.lastName,
            phone: phone || contact.phone,
            customFields: {
              ...contact.customFields,
              bookingCount: (contact.customFields?.bookingCount || 0) + 1,
            },
          },
        });
      }

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          workspaceId,
          contactId: contact.id,
          bookingTypeId,
          startTime: slotStart.toDate(),
          endTime: slotEnd.toDate(),
          status: "PENDING",
          notes: notes || null,
          referenceCode: nanoid(8).toUpperCase(),
          metadata: {
            source: "public_booking_form",
            customerInfo: {
              firstName,
              lastName,
              email,
              phone,
            },
          },
        },
        include: {
          contact: true,
          bookingType: true,
        },
      });

      // Create conversation for this booking
      const conversation = await prisma.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          channel: "EMAIL",
          status: "ACTIVE",
          metadata: {
            source: "public_booking",
            bookingId: booking.id,
          },
        },
      });

      // Create initial message about the booking
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: `New booking created for ${bookingType.name} on ${slotStart.format("MMMM D, YYYY [at] h:mm A")}`,
          senderType: "SYSTEM",
          messageType: "TEXT",
          metadata: {
            bookingId: booking.id,
            bookingReference: booking.referenceCode,
          },
        },
      });

      // Trigger automation events
      try {
        await automationProcessor.emitEvent("booking.created", {
          workspaceId,
          bookingId: booking.id,
          contactId: contact.id,
          conversationId: conversation.id,
          bookingType: bookingType.name,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          customerInfo: {
            firstName,
            lastName,
            email,
            phone,
          },
          contact: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
          },
          referenceCode: booking.referenceCode,
        });
      } catch (automationError) {
        console.error("Automation trigger failed:", automationError);
        // Don't fail the request if automation fails
      }

      res.status(201).json({
        success: true,
        data: {
          booking,
          contact,
          referenceCode: booking.referenceCode,
        },
      });
    } catch (error) {
      console.error("Error creating public booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create booking",
      });
    }
  }
}

export default new PublicBookingController();
