// backend/src/integrations/email/emailProvider.js

/**
 * Abstract Email Provider Interface
 * All email providers must implement this interface
 */
class EmailProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Send email
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content
   * @returns {Promise<Object>} Send result
   */
  async send({ to, subject, html, text }) {
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

export default EmailProvider;
