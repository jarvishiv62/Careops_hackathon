// backend/src/integrations/email/handlers/sendgrid.js
import sgMail from "@sendgrid/mail";
import EmailProvider from "../emailProvider.js";

class SendGridProvider extends EmailProvider {
  constructor(config) {
    super(config);

    if (!config.apiKey) {
      throw new Error("SendGrid API key is required");
    }

    if (!config.fromEmail) {
      throw new Error("From email is required");
    }

    sgMail.setApiKey(config.apiKey);
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || "CareOps";
  }

  async send({ to, subject, html, text }) {
    try {
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await sgMail.send(msg);

      return {
        success: true,
        messageId: result[0].headers["x-message-id"],
        provider: "sendgrid",
      };
    } catch (error) {
      console.error("SendGrid send error:", error);

      return {
        success: false,
        error: error.message,
        provider: "sendgrid",
      };
    }
  }

  async verify() {
    try {
      // Check if API key exists
      if (!this.config.apiKey) {
        throw new Error("SendGrid API key is missing");
      }

      // Check API key format
      if (!this.config.apiKey.startsWith("SG.")) {
        throw new Error(
          "Invalid SendGrid API key format. API key should start with 'SG.'",
        );
      }

      // Check if from email exists
      if (!this.config.fromEmail) {
        throw new Error("From email is missing");
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.config.fromEmail)) {
        throw new Error("Invalid from email format");
      }

      return true;
    } catch (error) {
      console.error("SendGrid verify error:", error);
      throw error; // Re-throw to preserve the error message
    }
  }

  getName() {
    return "SendGrid";
  }

  /**
   * Strip HTML tags for plain text fallback
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "");
  }
}

export default SendGridProvider;
