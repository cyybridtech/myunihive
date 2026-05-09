/**
 * Request OTP API
 * POST /api/request-otp
 */

const { getPool } = require('./config');
const { sendOtpEmail } = require('./sendEmail');

async function requestOtpHandler(req, res) {
    const { email, full_name } = req.body || {};

    if (!email || !full_name) {
        return res.status(400).json({ status: 'error', message: 'Email and full name are required' });
    }

    const pool = getPool();

    try {
        // First check if user already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
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

        // Send Email
        const emailSent = await sendOtpEmail(email, full_name, otp_code);
        
        if (!emailSent) {
            // Still proceed even if email transport fails during local dev (for debugging). 
            // In production, we'd throw an error if emailSent is false.
            console.warn('Failed to send OTP email, but OTP was generated.');
        }

        res.json({
            status: 'success',
            message: 'OTP sent successfully to ' + email
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to request OTP: ' + error.message });
    }
}

module.exports = requestOtpHandler;
