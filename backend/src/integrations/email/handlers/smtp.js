// backend/src/integrations/email/handlers/smtp.js
import nodemailer from "nodemailer";
import EmailProvider from "../emailProvider.js";

class SMTPProvider extends EmailProvider {
  constructor(config) {
    super(config);

    if (!config.host || !config.port || !config.fromEmail) {
      throw new Error("SMTP host, port, and from email are required");
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure || false, // true for 465, false for other ports
      auth:
        config.user && config.password
          ? {
              user: config.user,
              pass: config.password,
            }
          : undefined,
    });

    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName || "CareOps";
  }

  async send({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: "smtp",
      };
    } catch (error) {
      console.error("SMTP send error:", error);

      return {
        success: false,
        error: error.message,
        provider: "smtp",
      };
    }
  }

  async verify() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("SMTP verify error:", error);
      return false;
    }
  }

  getName() {
    return "SMTP";
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "");
  }
}

export default SMTPProvider;
