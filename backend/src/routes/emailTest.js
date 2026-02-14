// backend/src/routes/emailTest.js
import express from "express";
import SendGridProvider from "../integrations/email/handlers/sendgrid.js";
import SMTPProvider from "../integrations/email/handlers/smtp.js";

const router = express.Router();

// Test email configurations
const testConfigs = {
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || "SG.demo_key_for_testing",
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "noreply@careops.com",
    fromName: "CareOps Healthcare",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "your-email@gmail.com",
    password: process.env.SMTP_PASSWORD || "your-app-password",
    fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@careops.com",
    fromName: "CareOps Healthcare",
  },
};

// Get email provider status
router.get("/status", async (req, res) => {
  try {
    const status = {};

    // Test SendGrid
    try {
      const sendgridProvider = new SendGridProvider(testConfigs.sendgrid);
      await sendgridProvider.verify();
      status.sendgrid = {
        configured: true,
        working: true,
        provider: "SendGrid",
        fromEmail: testConfigs.sendgrid.fromEmail,
      };
    } catch (error) {
      status.sendgrid = {
        configured: !!testConfigs.sendgrid.apiKey && testConfigs.sendgrid.apiKey !== "SG.demo_key_for_testing",
        working: false,
        provider: "SendGrid",
        error: error.message,
        fromEmail: testConfigs.sendgrid.fromEmail,
      };
    }

    // Test SMTP
    try {
      const smtpProvider = new SMTPProvider(testConfigs.smtp);
      const isVerified = await smtpProvider.verify();
      status.smtp = {
        configured: !!(testConfigs.smtp.user && testConfigs.smtp.password),
        working: isVerified,
        provider: "SMTP",
        host: testConfigs.smtp.host,
        port: testConfigs.smtp.port,
        fromEmail: testConfigs.smtp.fromEmail,
      };
    } catch (error) {
      status.smtp = {
        configured: !!(testConfigs.smtp.user && testConfigs.smtp.password),
        working: false,
        provider: "SMTP",
        error: error.message,
        host: testConfigs.smtp.host,
        port: testConfigs.smtp.port,
        fromEmail: testConfigs.smtp.fromEmail,
      };
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send test email
router.post("/send", async (req, res) => {
  try {
    const { provider, to, subject, message, type } = req.body;

    if (!provider || !to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: provider, to, subject, message",
      });
    }

    let emailProvider;
    const config = testConfigs[provider];

    if (!config) {
      return res.status(400).json({
        success: false,
        error: "Invalid provider. Use 'sendgrid' or 'smtp'",
      });
    }

    // Create provider instance
    if (provider === "sendgrid") {
      emailProvider = new SendGridProvider(config);
    } else if (provider === "smtp") {
      emailProvider = new SMTPProvider(config);
    }

    // Create email content based on type
    let htmlContent = message;
    let textContent = message;

    if (type === "appointment") {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">CareOps Healthcare</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Appointment Confirmation</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #666;">This is an automated email from CareOps Healthcare System.</p>
            </div>
          </div>
        </div>
      `;
    } else if (type === "welcome") {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to CareOps</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">Getting Started</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #666;">Thank you for joining CareOps Healthcare!</p>
            </div>
          </div>
        </div>
      `;
    }

    // Send email
    const result = await emailProvider.send({
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });

    res.json({
      success: true,
      data: {
        ...result,
        to,
        subject,
        provider,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get email logs (mock for demonstration)
router.get("/logs", async (req, res) => {
  try {
    // In a real application, you'd fetch from a database
    const mockLogs = [
      {
        id: 1,
        provider: "sendgrid",
        to: "patient@example.com",
        subject: "Appointment Confirmation",
        status: "sent",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        messageId: "sg_123456789",
      },
      {
        id: 2,
        provider: "smtp",
        to: "doctor@example.com",
        subject: "New Patient Registration",
        status: "sent",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        messageId: "smtp_987654321",
      },
      {
        id: 3,
        provider: "sendgrid",
        to: "admin@example.com",
        subject: "System Notification",
        status: "failed",
        error: "Invalid recipient email",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: mockLogs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
