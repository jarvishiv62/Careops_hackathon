// backend/prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clean existing data
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.formSubmission.deleteMany();
    await prisma.form.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availabilityRule.deleteMany();
    await prisma.bookingType.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.integration.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.workspaceUser.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    console.log("🧹 Cleaned existing data");

    // Create owner user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const ownerUser = await prisma.user.create({
      data: {
        email: "admin@vitalflow.in",
        name: "Dr. Priya Sharma",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("👤 Created owner user:", ownerUser.email);

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "VitalFlow Health & Wellness",
        slug: "vitalflow-wellness",
        description:
          "Premiere integrated health and fitness center offering comprehensive medical care and wellness programs",
        settings: {
          timezone: "Asia/Kolkata",
          businessHours: {
            monday: { open: "09:00", close: "17:00" },
            tuesday: { open: "09:00", close: "17:00" },
            wednesday: { open: "09:00", close: "17:00" },
            thursday: { open: "09:00", close: "17:00" },
            friday: { open: "09:00", close: "17:00" },
            saturday: { open: "closed", close: "closed" },
            sunday: { open: "closed", close: "closed" },
          },
        },
      },
    });

    console.log("🏢 Created workspace:", workspace.name);

    // Create workspace-user relationship (owner)
    await prisma.workspaceUser.create({
      data: {
        userId: ownerUser.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    console.log("🔗 Linked user to workspace as owner");

    // Create sample contacts
    const contact1 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Aarav",
        lastName: "Patel",
        email: "aarav.patel@email.com",
        phone: "+91-98765-43210",
        company: "Tech Solutions India",
        tags: ["lead", "premium"],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    });

    const contact2 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Ananya",
        lastName: "Sharma",
        email: "ananya.sharma@email.com",
        phone: "+91-98765-43211",
        company: "Digital Agency India",
        tags: ["prospect"],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
    });

    const contact3 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Rohit",
        lastName: "Verma",
        email: "rohit.verma@email.com",
        phone: "+91-98765-43212",
        company: "Startup India",
        tags: ["lead"],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    });

    const contact4 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Kavya",
        lastName: "Reddy",
        email: "kavya.reddy@email.com",
        phone: "+91-98765-43213",
        company: "Wellness Pvt Ltd",
        tags: ["client", "premium"],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    });

    const contact5 = await prisma.contact.create({
      data: {
        workspaceId: workspace.id,
        firstName: "Vikram",
        lastName: "Singh",
        email: "vikram.singh@email.com",
        phone: "+91-98765-43214",
        company: "Enterprise India",
        tags: ["prospect"],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    });

    console.log("👥 Created sample contacts");

    // Create conversations
    const conversation1 = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact1.id,
        channel: "EMAIL",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
    });

    const conversation2 = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact2.id,
        channel: "SMS",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        updatedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      },
    });

    const conversation3 = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact3.id,
        channel: "EMAIL",
        status: "CLOSED",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    });

    const conversation4 = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact4.id,
        channel: "CHAT",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    });

    const conversation5 = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact5.id,
        channel: "EMAIL",
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      },
    });

    console.log("💬 Created conversations");

    // Create messages with realistic timestamps
    await prisma.message.createMany({
      data: [
        // Conversation 1 - Aarav Patel (30 days old conversation)
        {
          conversationId: conversation1.id,
          content:
            "Hi, I'm interested in your medical services. Can you provide more information?",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
        },
        {
          conversationId: conversation1.id,
          content:
            "Hello Aarav! Thank you for reaching out. I'd be happy to provide more information about our medical services. What specific health concerns are you interested in?",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
        },
        {
          conversationId: conversation1.id,
          content:
            "I'm particularly interested in your physiotherapy services for sports injuries.",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000), // 26 days ago
        },
        {
          conversationId: conversation1.id,
          content:
            "Perfect! We specialize in sports injury rehabilitation. Would you like to schedule a free 30-minute physiotherapy consultation?",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },

        // Conversation 2 - Ananya Sharma (14 days old conversation)
        {
          conversationId: conversation2.id,
          content:
            "Quick question - do you offer weekend physiotherapy sessions?",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          conversationId: conversation2.id,
          content:
            "Hi Ananya! Yes, we do offer weekend physiotherapy sessions for our premium patients. Let me know if you'd like to discuss our wellness packages.",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        },

        // Conversation 3 - Rohit Verma (6 days old, closed conversation)
        {
          conversationId: conversation3.id,
          content:
            "I need help with setting up my fitness rehabilitation program.",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        },
        {
          conversationId: conversation3.id,
          content:
            "Hi Rohit! We can definitely help with that. What type of fitness program are you setting up?",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 5.5 * 24 * 60 * 60 * 1000), // 5.5 days ago
        },
        {
          conversationId: conversation3.id,
          content:
            "It's a post-surgery recovery program. We need exercise therapy.",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          conversationId: conversation3.id,
          content:
            "Great! We have excellent solutions for post-surgery recovery. I'll send you our rehabilitation proposal.",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        },

        // Conversation 4 - Kavya Reddy (2 days old conversation)
        {
          conversationId: conversation4.id,
          content: "Hello! I'm interested in your premium wellness package.",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          conversationId: conversation4.id,
          content:
            "Hi Kavya! Thank you for your interest. Our premium wellness package includes priority physiotherapy and advanced health monitoring.",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
        },
        {
          conversationId: conversation4.id,
          content: "That sounds perfect! How do I get started?",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },

        // Conversation 5 - Vikram Singh (12 hours old conversation)
        {
          conversationId: conversation5.id,
          content: "I need urgent help with my post-surgery recovery plan.",
          senderType: "CONTACT",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        },
        {
          conversationId: conversation5.id,
          content:
            "Hi Vikram! I understand you need urgent help with your recovery. Let me connect you with our rehabilitation specialist.",
          senderType: "USER",
          senderId: ownerUser.id,
          messageType: "TEXT",
          createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
      ],
    });

    console.log("📨 Created sample messages");

    // Create booking types
    const bookingType1 = await prisma.bookingType.create({
      data: {
        workspaceId: workspace.id,
        name: "Medical Consultation",
        description: "Comprehensive health assessment and medical consultation",
        duration: 30,
        location: "Main Clinic - Room 101",
        isActive: true,
      },
    });

    const bookingType2 = await prisma.bookingType.create({
      data: {
        workspaceId: workspace.id,
        name: "Physiotherapy Session",
        description: "Specialized physiotherapy and rehabilitation",
        duration: 60,
        location: "Physiotherapy Wing - Room 201",
        isActive: true,
      },
    });

    console.log("📅 Created booking types");

    // Create availability rules
    await prisma.availabilityRule.createMany({
      data: [
        {
          bookingTypeId: bookingType1.id,
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          bookingTypeId: bookingType1.id,
          dayOfWeek: 2, // Tuesday
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          bookingTypeId: bookingType1.id,
          dayOfWeek: 3, // Wednesday
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          bookingTypeId: bookingType1.id,
          dayOfWeek: 4, // Thursday
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          bookingTypeId: bookingType1.id,
          dayOfWeek: 5, // Friday
          startTime: "09:00",
          endTime: "17:00",
        },
      ],
    });

    console.log("⏰ Created availability rules");

    // Create sample bookings with realistic timestamps
    await prisma.booking.createMany({
      data: [
        {
          workspaceId: workspace.id,
          contactId: contact1.id,
          bookingTypeId: bookingType1.id,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Tomorrow + 30 mins
          status: "CONFIRMED",
          referenceCode: "BK001",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          workspaceId: workspace.id,
          contactId: contact2.id,
          bookingTypeId: bookingType2.id,
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endTime: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          ), // 3 days + 1 hour
          status: "CONFIRMED",
          referenceCode: "BK002",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
        {
          workspaceId: workspace.id,
          contactId: contact3.id,
          bookingTypeId: bookingType1.id,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (completed)
          endTime: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          ), // 7 days ago + 30 mins
          status: "COMPLETED",
          referenceCode: "BK003",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
        {
          workspaceId: workspace.id,
          contactId: contact4.id,
          bookingTypeId: bookingType2.id,
          startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago (completed)
          endTime: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          ), // 14 days ago + 1 hour
          status: "COMPLETED",
          referenceCode: "BK004",
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        },
        {
          workspaceId: workspace.id,
          contactId: contact5.id,
          bookingTypeId: bookingType1.id,
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          endTime: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          ), // 7 days + 30 mins
          status: "PENDING",
          referenceCode: "BK005",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          workspaceId: workspace.id,
          contactId: contact1.id,
          bookingTypeId: bookingType2.id,
          startTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago (cancelled)
          endTime: new Date(
            Date.now() - 21 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
          ), // 21 days ago + 1 hour
          status: "CANCELLED",
          referenceCode: "BK006",
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        },
      ],
    });

    console.log("📋 Created sample bookings");

    // Create sample forms
    const form1 = await prisma.form.create({
      data: {
        workspaceId: workspace.id,
        name: "Patient Intake Form",
        description: "Comprehensive health information form for new patients",
        fields: {
          fields: [
            {
              name: "fullName",
              label: "Full Name",
              type: "text",
              required: true,
            },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "phone", label: "Phone", type: "tel", required: false },
            {
              name: "company",
              label: "Company",
              type: "text",
              required: false,
            },
            {
              name: "healthConcern",
              label: "Primary Health Concern",
              type: "textarea",
              required: true,
            },
          ],
        },
        isActive: true,
      },
    });

    console.log("📝 Created sample forms");

    // Create sample inventory
    await prisma.inventory.createMany({
      data: [
        {
          workspaceId: workspace.id,
          name: "Physiotherapy Sessions - Standard",
          description: "Standard physiotherapy rehabilitation sessions",
          category: "Service",
          quantity: 100,
          unit: "sessions",
          price: 1250.0,
          sku: "PHYS-STD-001",
        },
        {
          workspaceId: workspace.id,
          name: "Physiotherapy Sessions - Premium",
          description:
            "Premium physiotherapy with advanced rehabilitation techniques",
          category: "Service",
          quantity: 50,
          unit: "sessions",
          price: 1899.0,
          sku: "PHYS-PREM-001",
        },
      ],
    });

    console.log("📦 Created sample inventory");

    // Create sample integrations
    await prisma.integration.createMany({
      data: [
        {
          workspaceId: workspace.id,
          type: "EMAIL",
          name: "SendGrid Email Service",
          config: {
            provider: "sendgrid",
            apiKey: process.env.SENDGRID_API_KEY || "demo-key",
            fromEmail: "noreply@vitalflow.in",
            fromName: "VitalFlow Health & Wellness",
          },
          isActive: true,
        },
        {
          workspaceId: workspace.id,
          type: "SMS",
          name: "Twilio SMS Service",
          config: {
            provider: "twilio",
            accountSid: process.env.TWILIO_ACCOUNT_SID || "demo-sid",
            authToken: process.env.TWILIO_AUTH_TOKEN || "demo-token",
            fromNumber: "+919876543210",
          },
          isActive: true,
        },
      ],
    });

    console.log("🔌 Created sample integrations");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("   Email: admin@vitalflow.in");
    console.log("   Password: admin123");
    console.log("\n� Workspace: VitalFlow Health & Wellness");
    console.log("   Role: Owner");
    console.log(
      "\n🚀 You can now login and test all health and fitness features!",
    );
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
