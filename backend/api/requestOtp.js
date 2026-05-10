/**
 * Request OTP API
 * POST /api/request-otp
 */

const { getPool } = require('./config');
const { sendOtpEmail } = require('./sendEmail');

async function requestOtpHandler(req, res) {
    const { email, full_name } = req.body || {};

    if (!email || !full_name) {
        return res.status(400).json({ status: 'warn', message: 'Email and full name are required' });
    }

    const pool = getPool();

    try {
        // First check if user already exists
        const normalizedEmail = String(email).trim().toLowerCase();

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email already registered. Please sign in.' });
        }

        // Generate a 6-digit OTP
        const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Calculate expiration (15 minutes from now)
        const expires_at = new Date();
        expires_at.setMinutes(expires_at.getMinutes() + 15);

        // Save OTP to database
        await pool.execute(
            `INSERT INTO otps (email, otp_code, expires_at) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?`,
            [email, otp_code, expires_at, otp_code, expires_at]
        );

        // Normalize recipient to avoid SMTP rejection due to casing/whitespace.
        const recipientEmail = String(email).trim().toLowerCase();
        const recipientName = String(full_name).trim();

        const emailSent = await sendOtpEmail(recipientEmail, recipientName, otp_code);

        if (!emailSent) {
            // Fail loudly so clients know OTP delivery didn’t happen.
            return res.status(200).json({
                status: 'error',
                message: 'OTP generated but email could not be sent. OTP shown in debug_info in non-production.',
                debug_info: process.env.NODE_ENV !== 'production' ? 'OTP: ' + otp_code : undefined
            });
        }

        res.json({
            status: 'success',
            message: 'OTP sent successfully to ' + email,
            debug_info: process.env.NODE_ENV === 'development' ? `OTP: ${otp_code}` : undefined
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to request OTP: ' + error.message });
    }
}

module.exports = requestOtpHandler;
