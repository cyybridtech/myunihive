/**
 * Test Email Configuration
 * Run with: node test_email.js
 */

require('./backend/api/loadEnv');
const { sendOtpEmail } = require('./backend/api/sendEmail');

async function testEmail() {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (length: ' + process.env.EMAIL_PASS.length + ')' : 'Not set');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email credentials not configured in .env');
        return;
    }

    // Test with a sample OTP
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const testName = 'Test User';
    const testOtp = '123456';

    console.log(`Sending test OTP email to ${testEmail}...`);

    const success = await sendOtpEmail(testEmail, testName, testOtp);

    if (success) {
        console.log('✅ Test email sent successfully!');
    } else {
        console.log('❌ Test email failed. Check the error logs above.');
    }
}

testEmail().catch(console.error);