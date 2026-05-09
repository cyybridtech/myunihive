/**
 * Test Email API - sends a one-time verification email to confirm SMTP delivery.
 * POST /api/test-email
 */

const { sendWelcomeEmail } = require('./sendEmail');

async function testEmailHandler(req, res) {
    const { email, full_name } = req.body || {};

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Valid email is required' });
    }

    const recipient = email.trim().toLowerCase();
    const name = full_name && String(full_name).trim().length > 0 ? String(full_name).trim() : recipient.split('@')[0];

    try {
        const emailSent = await sendWelcomeEmail(recipient, name, 'TEST_EMAIL');

        if (!emailSent) {
            return res.status(502).json({
                status: 'error',
                message: 'Test email could not be delivered. Check SMTP credentials and server logs.'
            });
        }

        return res.json({
            status: 'success',
            message: 'Test email sent successfully. Check inbox or spam folder.'
        });
    } catch (error) {
        console.error('Test email error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to send test email' });
    }
}

module.exports = testEmailHandler;
