import SMSProvider from '../smsProvider.js';

/**
 * Console SMS Provider for Development/Testing
 * Logs SMS messages to console instead of actually sending them
 */
class ConsoleProvider extends SMSProvider {
  constructor(config) {
    super(config);
    this.fromPhone = config.fromPhone || '+1234567890';
  }

  async send({ to, message }) {
    console.log('\n📱 ===== SMS MESSAGE (CONSOLE) =====');
    console.log(`From: ${this.fromPhone}`);
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('====================================\n');

    return {
      success: true,
      messageId: `console_${Date.now()}`,
      provider: 'console',
      note: 'SMS logged to console only (dev mode)',
    };
  }

  async verify() {
    console.log('✅ Console SMS Provider verified (always valid in dev mode)');
    return true;
  }

  getName() {
    return 'Console (Development)';
  }
}

export default ConsoleProvider;
