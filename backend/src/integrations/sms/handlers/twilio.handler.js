// backend/src/integrations/sms/handlers/twilio.js
import twilio from "twilio";
import SMSProvider from "../smsProvider.js";

class TwilioProvider extends SMSProvider {
  constructor(config) {
    super(config);

    if (!config.accountSid || !config.authToken || !config.fromPhone) {
      throw new Error(
        "Twilio Account SID, Auth Token, and From Phone are required",
      );
    }

    this.client = twilio(config.accountSid, config.authToken);
    this.fromPhone = config.fromPhone;
  }

  async send({ to, message }) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromPhone,
        to: to,
      });

      return {
        success: true,
        messageId: result.sid,
        provider: "twilio",
        status: result.status,
      };
    } catch (error) {
      console.error("Twilio send error:", error);

      return {
        success: false,
        error: error.message,
        provider: "twilio",
      };
    }
  }

  async verify() {
    try {
      // Verify by fetching account details
      const account = await this.client.api
        .accounts(this.config.accountSid)
        .fetch();
      return account.status === "active";
    } catch (error) {
      console.error("Twilio verify error:", error);
      return false;
    }
  }

  getName() {
    return "Twilio";
  }
}

export default TwilioProvider;
