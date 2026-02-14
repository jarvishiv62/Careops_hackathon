#!/usr/bin/env node

// Quick SendGrid Test Script
import dotenv from 'dotenv';
import SendGridProvider from './src/integrations/email/handlers/sendgrid.js';

// Load environment variables
dotenv.config();

async function testSendGrid() {
  console.log('🚀 Testing SendGrid Configuration');
  console.log('================================');
  
  try {
    // Initialize SendGrid provider
    const provider = new SendGridProvider({
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME
    });

    console.log('📧 Configuration:');
    console.log(`   From Email: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`   From Name: ${process.env.SENDGRID_FROM_NAME}`);
    console.log(`   API Key: ${process.env.SENDGRID_API_KEY?.substring(0, 10)}...`);

    // Verify configuration
    console.log('\n🔍 Verifying configuration...');
    await provider.verify();
    console.log('✅ Configuration is valid!');

    // Send test email
    console.log('\n📨 Sending test email...');
    const result = await provider.send({
      to: process.env.SENDGRID_FROM_EMAIL, // Send to self for testing
      subject: '✅ SendGrid Test Successful - VitalFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 SendGrid Integration Working!</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333;">VitalFlow Email Test</h2>
            <p style="color: #666; line-height: 1.6;">
              Congratulations! Your SendGrid email integration is working perfectly with VitalFlow Healthcare.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #333; margin-top: 0;">Test Details:</h3>
              <ul style="color: #666;">
                <li>✅ SendGrid API Connection: Successful</li>
                <li>✅ Authentication: Valid</li>
                <li>✅ Email Sending: Working</li>
                <li>✅ HTML Templates: Rendering</li>
              </ul>
            </div>
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px;">
              <p style="margin: 0; color: #666;">
                <strong>Next Steps:</strong> Visit <a href="http://localhost:3000/app/email-test" style="color: #667eea;">Email Test Dashboard</a> for more testing options.
              </p>
            </div>
          </div>
        </div>
      `,
      text: 'SendGrid Test Successful! Your VitalFlow email integration is working perfectly.'
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Provider: ${result.provider}`);
      console.log(`   Check your inbox: ${process.env.SENDGRID_FROM_EMAIL}`);
    } else {
      console.log('❌ Failed to send test email');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Configuration Error:');
    console.error(`   ${error.message}`);
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting:');
    if (error.message.includes('API key')) {
      console.log('   - Check your SENDGRID_API_KEY in .env');
      console.log('   - Ensure key starts with "SG."');
    } else if (error.message.includes('from email')) {
      console.log('   - Verify your sender identity in SendGrid dashboard');
      console.log('   - Check SENDGRID_FROM_EMAIL in .env');
    } else {
      console.log('   - Check your internet connection');
      console.log('   - Verify SendGrid account status');
    }
  }
}

// Run the test
testSendGrid();
