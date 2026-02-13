// backend/src/integrations/integrationFactory.js
import SendGridProvider from "./email/handlers/sendgrid.js";
import SMTPProvider from "./email/handlers/smtp.js";
import TwilioProvider from "./sms/handlers/twilio.handler.js";
import ConsoleProvider from "./sms/handlers/console.js";

/**
 * Get email provider instance based on integration config
 */
export function getEmailProvider(integration) {
  const { provider, config } = integration;

  switch (provider.toLowerCase()) {
    case "sendgrid":
      return new SendGridProvider(config);

    case "smtp":
      return new SMTPProvider(config);

    default:
      throw new Error(`Unknown email provider: ${provider}`);
  }
}

/**
 * Get SMS provider instance based on integration config
 */
export function getSMSProvider(integration) {
  const { provider, config } = integration;

  switch (provider.toLowerCase()) {
    case "twilio":
      return new TwilioProvider(config);

    case "console":
      return new ConsoleProvider(config);

    default:
      throw new Error(`Unknown SMS provider: ${provider}`);
  }
}

/**
 * Test integration configuration
 */
export async function testIntegration(integration) {
  try {
    console.log("Testing integration:", integration);

    let providerInstance;

    const integrationType = integration.type.split(" - ")[0];
    const provider = integration.type.split(" - ")[1];

    // Create a new integration object with the provider extracted
    const integrationWithProvider = {
      ...integration,
      provider: provider,
    };

    if (integrationType === "EMAIL") {
      console.log("Creating EMAIL provider...");
      providerInstance = getEmailProvider(integrationWithProvider);
      const isValid = await providerInstance.verify();

      if (!isValid) {
        throw new Error("Email provider verification failed");
      }
    } else if (integrationType === "SMS") {
      console.log("Creating SMS provider...");
      providerInstance = getSMSProvider(integrationWithProvider);
      const isValid = await providerInstance.verify();

      if (!isValid) {
        throw new Error("SMS provider verification failed");
      }
    } else {
      throw new Error(`Unknown integration type: ${integration.type}`);
    }

    console.log("Provider instance:", providerInstance);

    if (!providerInstance) {
      throw new Error("Provider instance is undefined");
    }

    const providerName = providerInstance.getName();
    console.log("Provider name:", providerName);

    return {
      success: true,
      provider: providerName,
    };
  } catch (error) {
    console.error("Test integration error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
