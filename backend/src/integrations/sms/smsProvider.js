// backend/src/integrations/sms/smsProvider.js

/**
 * Abstract SMS Provider Interface
 * All SMS providers must implement this interface
 */
class SMSProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Send SMS
   * @param {Object} options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - SMS message content
   * @returns {Promise<Object>} Send result
   */
  async send({ to, message }) {
    throw new Error("send() method must be implemented by provider");
  }

  /**
   * Verify configuration is valid
   * @returns {Promise<boolean>} Configuration validity
   */
  async verify() {
    throw new Error("verify() method must be implemented by provider");
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getName() {
    throw new Error("getName() method must be implemented by provider");
  }
}

export default SMSProvider;
