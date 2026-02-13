// backend/prisma/seed-demo.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...");

  try {
    // Clean existing data
    await cleanDatabase();

    // Create demo workspace
    const workspace = await createDemoWorkspace();

    // Create demo users
    const users = await createDemoUsers(workspace.id);

    // Create demo booking types
    const bookingTypes = await createDemoBookingTypes(workspace.id);

    // Create demo contacts
    const contacts = await createDemoContacts(workspace.id);

    // Create demo bookings
    await createDemoBookings(workspace.id, contacts, bookingTypes);

    // Create demo conversations
    await createDemoConversations(workspace.id, contacts);

    // Create demo inventory
    await createDemoInventory(workspace.id);

    // Create demo forms
    await createDemoForms(workspace.id, bookingTypes);

    // Create demo integrations
    await createDemoIntegrations(workspace.id);

    console.log("✅ Demo data seeding completed successfully!");
    console.log("📧 Demo login credentials:");
    console.log("   Owner: admin@demo.com / admin123");
    console.log("   Staff: staff@demo.com / staff123");
    console.log("   Workspace ID:", workspace.id);
    console.log("   Public booking URL: /book/" + workspace.id);
    console.log("   Public contact URL: /contact/" + workspace.id);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanDatabase() {
  console.log("🧹 Cleaning existing data...");

  // Delete in order of dependencies
  await prisma.automationLog.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.formBookingType.deleteMany();
  await prisma.form.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.bookingType.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.workspaceUser.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
}

async function createDemoWorkspace() {
  console.log("🏢 Creating demo workspace...");

  const workspace = await prisma.workspace.create({
    data: {
      name: "VitalFlow Health & Wellness",
      slug: "vitalflow-wellness",
      description:
        "Premiere integrated health and fitness center offering comprehensive medical care and wellness programs",
      isActive: true,
      settings: {
        timezone: "Asia/Kolkata",
        currency: "INR",
        businessHours: {
          monday: { enabled: true, open: "09:00", close: "18:00" },
          tuesday: { enabled: true, open: "09:00", close: "18:00" },
          wednesday: { enabled: true, open: "09:00", close: "18:00" },
          thursday: { enabled: true, open: "09:00", close: "18:00" },
          friday: { enabled: true, open: "09:00", close: "18:00" },
          saturday: { enabled: true, open: "10:00", close: "16:00" },
          sunday: { enabled: false },
        },
      },
    },
  });

  return workspace;
}

async function createDemoUsers(workspaceId) {
  console.log("👥 Creating demo users...");

  const ownerPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const owner = await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Dr. Priya Sharma",
      password: ownerPassword,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@demo.com",
      name: "Rajesh Kumar",
      password: staffPassword,
      role: "USER",
    },
  });

  // Add users to workspace
  await prisma.workspaceUser.createMany({
    data: [
      {
        userId: owner.id,
        workspaceId,
        role: "OWNER",
      },
      {
        userId: staff.id,
        workspaceId,
        role: "MEMBER",
      },
    ],
  });

  return { owner, staff };
}

async function createDemoBookingTypes(workspaceId) {
  console.log("📅 Creating demo booking types...");

  const bookingTypes = await prisma.bookingType.createMany({
    data: [
      {
        workspaceId,
        name: "Medical Consultation",
        description: "Comprehensive health assessment and medical consultation",
        duration: 60,
        location: "Main Clinic - Room 101",
        isActive: true,
      },
      {
        workspaceId,
        name: "Follow-up Checkup",
        description: "Regular medical follow-up appointment",
        duration: 30,
        location: "Main Clinic - Room 102",
        isActive: true,
      },
      {
        workspaceId,
        name: "Physiotherapy Session",
        description: "Specialized physiotherapy and rehabilitation",
        duration: 45,
        location: "Physiotherapy Wing - Room 201",
        isActive: true,
      },
      {
        workspaceId,
        name: "Yoga & Fitness Class",
        description: "Group yoga and fitness wellness workshop",
        duration: 90,
        location: "Yoga Studio",
        isActive: true,
      },
    ],
  });

  // Add availability rules for each booking type
  const createdTypes = await prisma.bookingType.findMany({
    where: { workspaceId },
  });

  for (const bookingType of createdTypes) {
    await prisma.availabilityRule.createMany({
      data: [
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "18:00",
        }, // Monday
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "18:00",
        }, // Tuesday
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 3,
          startTime: "09:00",
          endTime: "18:00",
        }, // Wednesday
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 4,
          startTime: "09:00",
          endTime: "18:00",
        }, // Thursday
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "18:00",
        }, // Friday
        {
          bookingTypeId: bookingType.id,
          dayOfWeek: 6,
          startTime: "10:00",
          endTime: "16:00",
        }, // Saturday
      ],
    });
  }

  return createdTypes;
}

async function createDemoContacts(workspaceId) {
  console.log("👤 Creating demo contacts...");

  const contacts = await prisma.contact.createMany({
    data: [
      {
        workspaceId,
        firstName: "Aarav",
        lastName: "Patel",
        email: "aarav.patel@email.com",
        phone: "+91-98765-43210",
        company: "Tech Solutions India",
        tags: ["new", "corporate"],
        customFields: {
          source: "website",
          referral: "google",
        },
      },
      {
        workspaceId,
        firstName: "Ananya",
        lastName: "Sharma",
        email: "ananya.sharma@email.com",
        phone: "+91-98765-43211",
        tags: ["returning", "vip"],
        customFields: {
          source: "referral",
          referralSource: "John Smith",
        },
      },
      {
        workspaceId,
        firstName: "Rohit",
        lastName: "Verma",
        email: "rohit.verma@email.com",
        phone: "+91-98765-43212",
        company: "Healthcare Pvt Ltd",
        tags: ["corporate", "bulk"],
        customFields: {
          source: "linkedin",
          companySize: "50-100",
        },
      },
      {
        workspaceId,
        firstName: "Kavya",
        lastName: "Reddy",
        email: "kavya.reddy@email.com",
        phone: "+91-98765-43213",
        tags: ["individual", "new"],
        customFields: {
          source: "facebook",
          age: "28-35",
        },
      },
      {
        workspaceId,
        firstName: "Vikram",
        lastName: "Singh",
        email: "vikram.singh@email.com",
        phone: "+91-98765-43214",
        company: "Startup Solutions",
        tags: ["startup", "tech"],
        customFields: {
          source: "cold_email",
          industry: "technology",
        },
      },
    ],
  });

  return await prisma.contact.findMany({ where: { workspaceId } });
}

async function createDemoBookings(workspaceId, contacts, bookingTypes) {
  console.log("📋 Creating demo bookings...");

  const now = new Date();
  const bookings = [];

  // Create bookings with different statuses
  for (let i = 0; i < 15; i++) {
    const contact = contacts[i % contacts.length];
    const bookingType = bookingTypes[i % bookingTypes.length];

    // Generate booking times
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + i);
    startTime.setHours(10 + (i % 8), 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + bookingType.duration);

    const status =
      i < 8
        ? "COMPLETED"
        : i < 12
          ? "CONFIRMED"
          : i < 14
            ? "PENDING"
            : "CANCELLED";

    const booking = await prisma.booking.create({
      data: {
        workspaceId,
        contactId: contact.id,
        bookingTypeId: bookingType.id,
        startTime,
        endTime,
        status,
        referenceCode: `BK${String(i + 1).padStart(3, "0")}`,
        notes:
          i % 3 === 0
            ? "Patient requested specific focus on stress management and yoga therapy"
            : null,
        metadata: {
          source: i % 2 === 0 ? "online" : "phone",
          paymentStatus: status === "COMPLETED" ? "paid" : "pending",
        },
      },
    });

    bookings.push(booking);
  }

  return bookings;
}

async function createDemoConversations(workspaceId, contacts) {
  console.log("💬 Creating demo conversations...");

  const conversations = [];

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId: contact.id,
        channel: i % 2 === 0 ? "EMAIL" : "PHONE",
        status: i < 3 ? "CLOSED" : "ACTIVE",
        metadata: {
          lastActivity: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ),
        },
      },
    });

    // Add messages to conversation
    const messageCount = Math.floor(Math.random() * 5) + 2;
    for (let j = 0; j < messageCount; j++) {
      const isFromContact = j % 2 === 0;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: isFromContact
            ? `Hi, I'd like to schedule an appointment. ${j === 0 ? "I found you through Google and I'm interested in your services." : "What are your available times next week?"}`
            : `Thank you for reaching out! ${j === 1 ? "We'd be happy to help you schedule an appointment." : "Our team is available Monday through Friday."}`,
          senderType: isFromContact ? "CONTACT" : "USER",
          messageType: "TEXT",
          createdAt: new Date(Date.now() - (messageCount - j) * 60 * 60 * 1000),
        },
      });
    }

    conversations.push(conversation);
  }

  return conversations;
}

async function createDemoInventory(workspaceId) {
  console.log("📦 Creating demo inventory...");

  await prisma.inventory.createMany({
    data: [
      {
        workspaceId,
        name: "Ayurvedic Massage Oil",
        description: "Traditional therapeutic grade massage oil",
        category: "Supplies",
        quantity: 24,
        unit: "bottles",
        price: 1250.0,
        sku: "AMO-001",
        metadata: {
          supplier: "Ayurvedic Wellness Co",
          reorderLevel: 10,
        },
      },
      {
        workspaceId,
        name: "Disposable Yoga Mats",
        description: "Eco-friendly disposable yoga mats",
        category: "Supplies",
        quantity: 150,
        unit: "packs",
        price: 450.0,
        sku: "DYM-001",
        metadata: {
          supplier: "Yoga Essentials India",
          reorderLevel: 50,
        },
      },
      {
        workspaceId,
        name: "Physiotherapy Bands",
        description: "Resistance bands for physiotherapy exercises",
        category: "Equipment",
        quantity: 8,
        unit: "sets",
        price: 1899.0,
        sku: "PTB-001",
        metadata: {
          supplier: "Fitness Equipment India",
          reorderLevel: 5,
        },
      },
      {
        workspaceId,
        name: "Essential Oils Collection",
        description: "Premium aromatherapy essential oils set",
        category: "Supplies",
        quantity: 3,
        unit: "sets",
        price: 3450.0,
        sku: "EO-001",
        metadata: {
          supplier: "Aromatherapy India",
          reorderLevel: 2,
        },
      },
      {
        workspaceId,
        name: "Meditation Pillows",
        description: "Comfortable meditation and yoga pillows",
        category: "Equipment",
        quantity: 12,
        unit: "pieces",
        price: 1250.0,
        sku: "MP-001",
        metadata: {
          supplier: "Comfort Wellness India",
          reorderLevel: 8,
        },
      },
    ],
  });
}

async function createDemoForms(workspaceId, bookingTypes) {
  console.log("📝 Creating demo forms...");

  const forms = await prisma.form.createMany({
    data: [
      {
        workspaceId,
        name: "Patient Intake Form",
        description: "New patient comprehensive health questionnaire",
        fields: [
          {
            name: "fullName",
            label: "Full Name",
            type: "text",
            required: true,
          },
          {
            name: "dateOfBirth",
            label: "Date of Birth",
            type: "date",
            required: true,
          },
          {
            name: "emergencyContact",
            label: "Emergency Contact",
            type: "text",
            required: true,
          },
          {
            name: "medicalHistory",
            label: "Medical History",
            type: "textarea",
            required: false,
          },
          {
            name: "medications",
            label: "Current Medications",
            type: "textarea",
            required: false,
          },
          {
            name: "allergies",
            label: "Known Allergies",
            type: "text",
            required: false,
          },
          {
            name: "fitnessGoals",
            label: "Fitness & Wellness Goals",
            type: "textarea",
            required: false,
          },
        ],
        settings: {
          autoSubmit: true,
          emailNotifications: true,
        },
        isActive: true,
      },
      {
        workspaceId,
        name: "Medical Consent Form",
        description: "Treatment and procedure consent form",
        fields: [
          {
            name: "consent",
            label: "I consent to treatment",
            type: "checkbox",
            required: true,
          },
          {
            name: "acknowledged",
            label: "I have read and understood the information",
            type: "checkbox",
            required: true,
          },
          {
            name: "signature",
            label: "Electronic Signature",
            type: "signature",
            required: true,
          },
        ],
        settings: {
          autoSubmit: true,
          emailNotifications: true,
        },
        isActive: true,
      },
      {
        workspaceId,
        name: "Wellness Feedback Survey",
        description: "Post-treatment and wellness feedback survey",
        fields: [
          {
            name: "satisfaction",
            label: "Overall Treatment Satisfaction",
            type: "rating",
            required: true,
          },
          {
            name: "wellnessImprovement",
            label: "Wellness Improvement",
            type: "rating",
            required: true,
          },
          {
            name: "comments",
            label: "Additional Comments",
            type: "textarea",
            required: false,
          },
          {
            name: "recommend",
            label: "Would you recommend our wellness center?",
            type: "radio",
            required: true,
          },
        ],
        settings: {
          autoSubmit: false,
          emailNotifications: false,
        },
        isActive: true,
      },
    ],
  });

  // Link forms to booking types
  const createdForms = await prisma.form.findMany({ where: { workspaceId } });
  const createdBookingTypes = await prisma.bookingType.findMany({
    where: { workspaceId },
  });

  for (const form of createdForms) {
    for (const bookingType of createdBookingTypes) {
      if (form.name === "Intake Form" || form.name === "Informed Consent") {
        await prisma.formBookingType.create({
          data: {
            formId: form.id,
            bookingTypeId: bookingType.id,
          },
        });
      }
    }
  }

  return forms;
}

async function createDemoIntegrations(workspaceId) {
  console.log("🔌 Creating demo integrations...");

  await prisma.integration.createMany({
    data: [
      {
        workspaceId,
        type: "EMAIL - SendGrid",
        name: "SendGrid Email Service",
        config: {
          apiKey: "SG.demo-key-placeholder",
          fromEmail: "noreply@vitalflow.in",
          fromName: "VitalFlow Health & Wellness",
        },
        isActive: true,
      },
      {
        workspaceId,
        type: "SMS - Twilio",
        name: "Twilio SMS Service",
        config: {
          accountSid: "AC-demo-account-sid",
          authToken: "demo-auth-token",
          fromPhone: "+919876543210",
        },
        isActive: false, // Disabled for demo
      },
    ],
  });
}

// Run the seeding
if (require.main === module) {
  seedDemoData().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export default seedDemoData;
