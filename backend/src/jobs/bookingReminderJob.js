// backend/src/jobs/bookingReminderJob.js
import { PrismaClient } from "@prisma/client";
import eventEmitter from "../events/eventEmitter.js";

const prisma = new PrismaClient();

class BookingReminderJob {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  start() {
    if (this.isRunning) return;

    console.log("📅 Starting booking reminder job...");
    
    // Run every hour to check for upcoming bookings
    this.interval = setInterval(() => {
      this.checkUpcomingBookings();
    }, 60 * 60 * 1000); // 1 hour

    // Run once immediately on startup
    this.checkUpcomingBookings();
    
    this.isRunning = true;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log("⏹️ Booking reminder job stopped");
  }

  async checkUpcomingBookings() {
    try {
      console.log("🔍 Checking for upcoming bookings that need reminders...");

      // Get bookings that are 24 hours away and haven't been reminded
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          startTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          status: "CONFIRMED",
          metadata: {
            path: ["reminderSent"],
            not: true,
          },
        },
        include: {
          contact: true,
          bookingType: true,
          workspace: {
            include: {
              integrations: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      console.log(`📋 Found ${upcomingBookings.length} bookings needing reminders`);

      for (const booking of upcomingBookings) {
        try {
          // Emit reminder event
          eventEmitter.emit("booking.reminder", {
            workspaceId: booking.workspaceId,
            bookingId: booking.id,
            contact: booking.contact,
            bookingType: booking.bookingType.name,
            startTime: booking.startTime,
            referenceCode: booking.referenceCode,
            workspaceName: booking.workspace.name,
          });

          // Mark reminder as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              metadata: {
                ...booking.metadata,
                reminderSent: true,
                reminderSentAt: new Date().toISOString(),
              },
            },
          });

          console.log(`✅ Reminder sent for booking ${booking.referenceCode}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for booking ${booking.referenceCode}:`, error);
        }
      }
    } catch (error) {
      console.error("❌ Error in booking reminder job:", error);
    }
  }
}

// Create singleton instance
const bookingReminderJob = new BookingReminderJob();

export default bookingReminderJob;
