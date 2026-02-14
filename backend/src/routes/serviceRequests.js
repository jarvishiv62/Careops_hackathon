// backend/src/routes/serviceRequests.js
import express from "express";
const router = express.Router();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Public endpoint for submitting service requests
router.post("/public", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      address,
      serviceType,
      urgency,
      preferredDate,
      preferredTime,
      message,
      additionalInfo,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !serviceType ||
      !urgency ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields. Please fill in all required information.",
      });
    }

    // Generate reference ID
    const referenceId = `SR${Date.now().toString().slice(-8)}`;

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        referenceId,
        firstName,
        lastName,
        email,
        phone,
        company: company || null,
        address: address || null,
        serviceType,
        urgency,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime || null,
        message,
        additionalInfo: additionalInfo || null,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create a notification for staff (you can implement notification system)
    // For now, we'll just log it
    console.log(`New service request received: ${referenceId}`);

    // TODO: Send email notification to staff
    // TODO: Send confirmation email to customer

    res.status(201).json({
      success: true,
      data: serviceRequest,
      referenceId,
      message:
        "Service request submitted successfully. We will contact you within 24 hours.",
    });
  } catch (error) {
    console.error("Error submitting service request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit service request. Please try again.",
    });
  }
});

// Get all service requests (for staff)
router.get("/", async (req, res) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service requests",
    });
  }
});

// Get service request by ID
router.get("/:id", async (req, res) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Service request not found",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching service request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service request",
    });
  }
});

// Update service request status (for staff)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, staffNotes } = req.body;

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        staffNotes: staffNotes || null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: "Service request updated successfully",
    });
  } catch (error) {
    console.error("Error updating service request:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update service request",
    });
  }
});

export default router;
