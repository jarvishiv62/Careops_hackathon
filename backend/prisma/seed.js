// backend/prisma/seed-unified.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting unified database seed...");

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

    // Create workspace
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

    console.log("🏢 Created workspace:", workspace.name);

    // Create users with both credential sets
    const adminPassword = await bcrypt.hash("admin123", 10);
    const staffPassword = await bcrypt.hash("staff123", 10);

    // Original admin user (admin@vitalflow.in)
    const originalAdmin = await prisma.user.create({
      data: {
        email: "admin@vitalflow.in",
        name: "Dr. Priya Sharma",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // Demo admin user (admin@demo.com)
    const demoAdmin = await prisma.user.create({
      data: {
        email: "admin@demo.com",
        name: "Dr. Priya Sharma",
        password: adminPassword,
        role: "ADMIN",
      },
    });

    // Staff user (staff@demo.com)
    const staffUser = await prisma.user.create({
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
          userId: originalAdmin.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
        {
          userId: demoAdmin.id,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
        {
          userId: staffUser.id,
          workspaceId: workspace.id,
          role: "MEMBER",
        },
      ],
    });

    console.log("👥 Created users:");
    console.log("   - Original Admin: admin@vitalflow.in / admin123");
    console.log("   - Demo Admin: admin@demo.com / admin123");
    console.log("   - Staff: staff@demo.com / staff123");

    // Create comprehensive demo data
    await createComprehensiveDemoData(workspace.id);

    console.log("\n✅ Unified database seeding completed successfully!");
    console.log("\n📋 Available Login Credentials:");
    console.log("   Original Admin: admin@vitalflow.in / admin123");
    console.log("   Demo Admin: admin@demo.com / admin123");
    console.log("   Staff: staff@demo.com / staff123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createComprehensiveDemoData(workspaceId) {
  console.log("🎯 Creating comprehensive demo data for hackathon showcase...");

  // 1. CREATE COMPREHENSIVE BOOKING TYPES
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
        name: "Physiotherapy Session",
        description: "Specialized physiotherapy and rehabilitation",
        duration: 45,
        location: "Physiotherapy Wing - Room 201",
        isActive: true,
      },
      {
        workspaceId,
        name: "Cardiac Consultation",
        description: "Specialized heart health consultation and ECG",
        duration: 90,
        location: "Cardiology Wing - Room 301",
        isActive: true,
      },
      {
        workspaceId,
        name: "Mental Health Counseling",
        description: "Psychological counseling and therapy session",
        duration: 50,
        location: "Mental Health Wing - Room 401",
        isActive: true,
      },
      {
        workspaceId,
        name: "Nutrition Consultation",
        description: "Dietary planning and nutrition advice",
        duration: 30,
        location: "Wellness Center - Room 501",
        isActive: true,
      },
    ],
  });

  console.log("📅 Created comprehensive booking types");

  // 2. CREATE DIVERSE CONTACTS (PATIENTS)
  const contacts = await prisma.contact.createMany({
    data: [
      {
        workspaceId,
        firstName: "Aarav",
        lastName: "Patel",
        email: "aarav.patel@email.com",
        phone: "+91-98765-43210",
        company: "Tech Solutions India",
        tags: ["new", "corporate", "priority"],
        customFields: {
          bloodGroup: "O+",
          allergies: "Penicillin",
          medicalHistory: "Hypertension controlled with medication",
          emergencyContact: "+91-98765-43211",
        },
      },
      {
        workspaceId,
        firstName: "Ananya",
        lastName: "Sharma",
        email: "ananya.sharma@email.com",
        phone: "+91-98765-43211",
        company: "Digital Agency India",
        tags: ["returning", "vip", "corporate"],
        customFields: {
          bloodGroup: "A+",
          allergies: "None",
          medicalHistory: "Asthma - mild",
          emergencyContact: "+91-98765-43212",
        },
      },
      {
        workspaceId,
        firstName: "Rohit",
        lastName: "Verma",
        email: "rohit.verma@email.com",
        phone: "+91-98765-43212",
        company: "Healthcare Pvt Ltd",
        tags: ["corporate", "bulk", "executive"],
        customFields: {
          bloodGroup: "B+",
          allergies: "Dust allergy",
          medicalHistory: "Diabetes Type 2",
          emergencyContact: "+91-98765-43213",
        },
      },
      {
        workspaceId,
        firstName: "Kavya",
        lastName: "Reddy",
        email: "kavya.reddy@email.com",
        phone: "+91-98765-43213",
        tags: ["individual", "new", "student"],
        customFields: {
          bloodGroup: "AB+",
          allergies: "Pollen",
          medicalHistory: "Migraine",
          emergencyContact: "+91-98765-43214",
        },
      },
      {
        workspaceId,
        firstName: "Vikram",
        lastName: "Singh",
        email: "vikram.singh@email.com",
        phone: "+91-98765-43214",
        company: "Startup Solutions",
        tags: ["startup", "tech", "founder"],
        customFields: {
          bloodGroup: "O-",
          allergies: "Latex",
          medicalHistory: "No significant medical history",
          emergencyContact: "+91-98765-43215",
        },
      },
      {
        workspaceId,
        firstName: "Priya",
        lastName: "Nair",
        email: "priya.nair@email.com",
        phone: "+91-98765-43215",
        tags: ["senior", "regular", "loyal"],
        customFields: {
          bloodGroup: "A-",
          allergies: "Shellfish",
          medicalHistory: "Arthritis",
          emergencyContact: "+91-98765-43216",
        },
      },
      {
        workspaceId,
        firstName: "Amit",
        lastName: "Kumar",
        email: "amit.kumar@email.com",
        phone: "+91-98765-43216",
        tags: ["new", "referral", "insurance"],
        customFields: {
          bloodGroup: "B+",
          allergies: "None",
          medicalHistory: "Previous knee injury",
          emergencyContact: "+91-98765-43217",
        },
      },
      {
        workspaceId,
        firstName: "Sneha",
        lastName: "Joshi",
        email: "sneha.joshi@email.com",
        phone: "+91-98765-43217",
        tags: ["corporate", "wellness", "preventive"],
        customFields: {
          bloodGroup: "O+",
          allergies: "Seasonal allergies",
          medicalHistory: "No major conditions",
          emergencyContact: "+91-98765-43218",
        },
      },
    ],
  });

  console.log("👥 Created diverse patient contacts");

  // 3. CREATE REALISTIC BOOKINGS
  const createdBookingTypes = await prisma.bookingType.findMany({
    where: { workspaceId },
  });
  const createdContacts = await prisma.contact.findMany({
    where: { workspaceId },
  });

  const bookings = [];
  const now = new Date();

  // Create bookings with different statuses and realistic timestamps
  for (let i = 0; i < 25; i++) {
    const contact = createdContacts[i % createdContacts.length];
    const bookingType = createdBookingTypes[i % createdBookingTypes.length];

    // Generate realistic booking times (past, present, future)
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
    const startTime = new Date(now);
    startTime.setDate(startTime.getDate() + daysOffset);
    startTime.setHours(
      9 + Math.floor(Math.random() * 9),
      Math.floor(Math.random() * 60),
      0,
      0,
    );

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + bookingType.duration);

    // Realistic status distribution
    const statusOptions = [
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
      "PENDING",
      "NO_SHOW",
    ];
    const weights = [0.4, 0.3, 0.15, 0.1, 0.05]; // Probability weights
    let random = Math.random();
    let status = statusOptions[0];
    for (let j = 0; j < weights.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        status = statusOptions[j];
        break;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        workspaceId,
        contactId: contact.id,
        bookingTypeId: bookingType.id,
        startTime,
        endTime,
        status,
        referenceCode: `BK${String(i + 1).padStart(4, "0")}`,
        notes:
          i % 3 === 0
            ? `Patient requires special attention for ${bookingType.name.toLowerCase()}`
            : null,
        metadata: {
          source: i % 2 === 0 ? "online" : "phone",
          paymentStatus:
            status === "COMPLETED"
              ? "paid"
              : status === "CONFIRMED"
                ? "pending"
                : "refunded",
          insurance: contact.tags.includes("insurance")
            ? "covered"
            : "self-pay",
        },
      },
    });

    bookings.push(booking);
  }

  console.log("📋 Created realistic bookings");

  // 4. CREATE CONVERSATIONS AND MESSAGES
  const conversations = [];
  for (let i = 0; i < createdContacts.length; i++) {
    const contact = createdContacts[i];

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        contactId: contact.id,
        channel: i % 3 === 0 ? "EMAIL" : i % 3 === 1 ? "SMS" : "CHAT",
        status: i < 2 ? "CLOSED" : "ACTIVE",
        metadata: {
          lastActivity: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
          ),
          priority: contact.tags.includes("priority")
            ? "high"
            : contact.tags.includes("vip")
              ? "medium"
              : "normal",
        },
      },
    });

    // Add realistic messages to each conversation
    const messageCount = Math.floor(Math.random() * 8) + 2;
    for (let j = 0; j < messageCount; j++) {
      const isFromContact = j % 2 === 0;
      const messageTime = new Date(
        Date.now() - (messageCount - j) * Math.random() * 24 * 60 * 60 * 1000,
      );

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: isFromContact
            ? `Hi, I'd like to schedule an appointment. ${j === 0 ? "I found you through Google and I'm interested in your services." : "What are your available times next week?"}`
            : `Thank you for reaching out! ${j === 1 ? "We'd be happy to help you schedule an appointment." : "Our team is available Monday through Friday for consultations."}`,
          senderType: isFromContact ? "CONTACT" : "USER",
          messageType: "TEXT",
          createdAt: messageTime,
        },
      });
    }

    conversations.push(conversation);
  }

  console.log("💬 Created conversations with messages");

  // 5. CREATE HEALTH FORMS
  const forms = await prisma.form.createMany({
    data: [
      {
        workspaceId,
        name: "Patient Intake Form",
        description: "Comprehensive health information form for new patients",
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
            name: "gender",
            label: "Gender",
            type: "select",
            required: true,
            options: ["Male", "Female", "Other"],
          },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "tel", required: false },
          {
            name: "address",
            label: "Address",
            type: "textarea",
            required: false,
          },
          {
            name: "emergencyContact",
            label: "Emergency Contact",
            type: "text",
            required: true,
          },
          {
            name: "bloodGroup",
            label: "Blood Group",
            type: "select",
            required: false,
            options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
          },
          {
            name: "allergies",
            label: "Known Allergies",
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
            name: "medicalHistory",
            label: "Medical History",
            type: "textarea",
            required: false,
          },
          {
            name: "insuranceProvider",
            label: "Insurance Provider",
            type: "text",
            required: false,
          },
        ],
        settings: {
          autoSubmit: true,
          emailNotifications: true,
          confirmationMessage:
            "Thank you for submitting your intake form. We'll contact you soon.",
        },
        isActive: true,
      },
      {
        workspaceId,
        name: "Informed Consent Form",
        description: "Treatment and procedure consent form",
        fields: [
          {
            name: "procedureName",
            label: "Procedure Name",
            type: "text",
            required: true,
          },
          {
            name: "risksExplained",
            label: "Risks Explained",
            type: "checkbox",
            required: true,
          },
          {
            name: "benefitsExplained",
            label: "Benefits Explained",
            type: "checkbox",
            required: true,
          },
          {
            name: "alternativesDiscussed",
            label: "Alternatives Discussed",
            type: "checkbox",
            required: true,
          },
          {
            name: "consent",
            label: "I consent to treatment",
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
        name: "Patient Satisfaction Survey",
        description: "Post-treatment feedback survey",
        fields: [
          {
            name: "overallExperience",
            label: "Overall Experience",
            type: "rating",
            required: true,
          },
          {
            name: "staffProfessionalism",
            label: "Staff Professionalism",
            type: "rating",
            required: true,
          },
          {
            name: "facilityCleanliness",
            label: "Facility Cleanliness",
            type: "rating",
            required: true,
          },
          {
            name: "waitTime",
            label: "Wait Time Satisfaction",
            type: "rating",
            required: true,
          },
          {
            name: "recommendation",
            label: "Would you recommend us?",
            type: "radio",
            required: true,
            options: ["Yes", "No", "Maybe"],
          },
          {
            name: "comments",
            label: "Additional Comments",
            type: "textarea",
            required: false,
          },
        ],
        settings: {
          autoSubmit: false,
          emailNotifications: false,
        },
        isActive: true,
      },
      {
        workspaceId,
        name: "Pre-Appointment Questionnaire",
        description: "Health screening questionnaire before appointments",
        fields: [
          {
            name: "covidSymptoms",
            label: "COVID-19 Symptoms",
            type: "checkbox",
            required: true,
          },
          {
            name: "recentTravel",
            label: "Recent Travel",
            type: "checkbox",
            required: true,
          },
          {
            name: "fever",
            label: "Current Fever",
            type: "checkbox",
            required: true,
          },
          {
            name: "medicationChanges",
            label: "Recent Medication Changes",
            type: "checkbox",
            required: true,
          },
          {
            name: "additionalConcerns",
            label: "Additional Health Concerns",
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
    ],
  });

  console.log("📝 Created comprehensive health forms");

  // 6. CREATE FORM SUBMISSIONS
  const createdForms = await prisma.form.findMany({ where: { workspaceId } });

  for (let i = 0; i < 15; i++) {
    const form = createdForms[i % createdForms.length];
    const contact = createdContacts[i % createdContacts.length];

    await prisma.formSubmission.create({
      data: {
        formId: form.id,
        data: {
          fullName: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone,
          dateOfBirth: new Date(
            1980 + Math.floor(Math.random() * 40),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          )
            .toISOString()
            .split("T")[0],
          bloodGroup: contact.customFields?.bloodGroup || "O+",
          allergies: contact.customFields?.allergies || "None",
          medicalHistory:
            contact.customFields?.medicalHistory || "No significant history",
          overallExperience: Math.floor(Math.random() * 2) + 4, // 4-5 rating
          staffProfessionalism: Math.floor(Math.random() * 2) + 4,
          facilityCleanliness: Math.floor(Math.random() * 2) + 4,
          recommendation: ["Yes", "Yes", "Maybe"][
            Math.floor(Math.random() * 3)
          ],
          comments:
            i % 3 === 0
              ? "Excellent service and very professional staff."
              : "Good experience overall.",
        },
      },
    });
  }

  console.log("📋 Created form submissions");

  // 7. CREATE INVENTORY (MEDICAL SUPPLIES)
  await prisma.inventory.createMany({
    data: [
      {
        workspaceId,
        name: "Disposable Gloves",
        description: "Medical examination gloves, latex-free",
        category: "Medical Supplies",
        quantity: 500,
        unit: "boxes",
        price: 450.0,
        sku: "DG-001",
        metadata: {
          supplier: "MedSupply India",
          reorderLevel: 100,
          expiryDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      {
        workspaceId,
        name: "Face Masks",
        description: "N95 respirator masks",
        category: "Medical Supplies",
        quantity: 200,
        unit: "pieces",
        price: 125.0,
        sku: "FM-002",
        metadata: {
          supplier: "SafetyFirst Medical",
          reorderLevel: 50,
          expiryDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      {
        workspaceId,
        name: "Blood Pressure Monitor",
        description: "Digital automatic blood pressure monitor",
        category: "Equipment",
        quantity: 8,
        unit: "units",
        price: 3500.0,
        sku: "BPM-003",
        metadata: {
          supplier: "HealthTech Solutions",
          reorderLevel: 3,
          warranty: "2 years",
        },
      },
      {
        workspaceId,
        name: "Thermometer",
        description: "Digital infrared thermometer",
        category: "Equipment",
        quantity: 15,
        unit: "units",
        price: 850.0,
        sku: "TH-004",
        metadata: {
          supplier: "MedTech India",
          reorderLevel: 5,
          warranty: "1 year",
        },
      },
      {
        workspaceId,
        name: "Syringes",
        description: "Disposable insulin syringes",
        category: "Medical Supplies",
        quantity: 1000,
        unit: "pieces",
        price: 25.0,
        sku: "SY-005",
        metadata: {
          supplier: "InjectCare",
          reorderLevel: 200,
          expiryDate: new Date(
            Date.now() + 730 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      {
        workspaceId,
        name: "Bandages",
        description: "Sterile adhesive bandages assorted sizes",
        category: "Medical Supplies",
        quantity: 50,
        unit: "boxes",
        price: 180.0,
        sku: "BD-006",
        metadata: {
          supplier: "WoundCare India",
          reorderLevel: 15,
          expiryDate: new Date(
            Date.now() + 1095 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      {
        workspaceId,
        name: "ECG Machine",
        description: "12-lead ECG machine with printer",
        category: "Equipment",
        quantity: 2,
        unit: "units",
        price: 45000.0,
        sku: "ECG-007",
        metadata: {
          supplier: "CardioTech Solutions",
          reorderLevel: 1,
          warranty: "3 years",
          maintenance: "Quarterly calibration required",
        },
      },
      {
        workspaceId,
        name: "Examination Table",
        description: "Adjustable medical examination table",
        category: "Furniture",
        quantity: 6,
        unit: "units",
        price: 15000.0,
        sku: "ET-008",
        metadata: {
          supplier: "MedFurniture India",
          reorderLevel: 2,
          warranty: "5 years",
        },
      },
    ],
  });

  console.log("📦 Created medical supplies inventory");

  // 8. CREATE INTEGRATIONS
  await prisma.integration.createMany({
    data: [
      {
        workspaceId,
        type: "EMAIL",
        name: "SendGrid Email Service",
        config: {
          provider: "sendgrid",
          apiKey: "SG.demo-key-placeholder",
          fromEmail: "noreply@vitalflow.in",
          fromName: "VitalFlow Health & Wellness",
          templates: {
            appointmentConfirmation: "template-123",
            appointmentReminder: "template-456",
            followUp: "template-789",
          },
        },
        isActive: true,
      },
      {
        workspaceId,
        type: "SMS",
        name: "Twilio SMS Service",
        config: {
          provider: "twilio",
          accountSid: "AC.demo-account-sid",
          authToken: "demo-auth-token",
          fromPhone: "+919876543210",
        },
        isActive: true,
      },
      {
        workspaceId,
        type: "PAYMENT",
        name: "Stripe Payment Gateway",
        config: {
          provider: "stripe",
          publicKey: "pk_demo_key",
          secretKey: "sk_demo_key",
          webhookSecret: "whsec_demo_secret",
        },
        isActive: true,
      },
      {
        workspaceId,
        type: "CALENDAR",
        name: "Google Calendar Sync",
        config: {
          provider: "google",
          clientId: "demo-client-id",
          clientSecret: "demo-client-secret",
          calendarId: "primary",
        },
        isActive: false, // Demo mode
      },
      {
        workspaceId,
        type: "LAB",
        name: "Lab Results Integration",
        config: {
          provider: "labconnect",
          apiKey: "demo-lab-api-key",
          labId: "demo-lab-id",
        },
        isActive: false, // Demo mode
      },
    ],
  });

  console.log("🔌 Created service integrations");

  // 9. CREATE AVAILABILITY RULES FOR BOOKING TYPES
  for (const bookingType of createdBookingTypes) {
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

  console.log("⏰ Created availability rules");

  console.log("🎉 Comprehensive demo data creation completed!");
  console.log("📊 Data Summary:");
  console.log(`   - ${createdContacts.length} Patients with detailed profiles`);
  console.log(`   - ${createdBookingTypes.length} Booking types`);
  console.log(`   - ${bookings.length} Bookings with various statuses`);
  console.log(`   - ${conversations.length} Conversations with messages`);
  console.log(`   - ${createdForms.length} Health forms`);
  console.log(`   - 15+ Form submissions`);
  console.log(`   - 8+ Inventory items`);
  console.log(`   - 5+ Service integrations`);
}

// Run the seeding
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
