/**
 * Request OTP API
 * POST /api/request-otp
 */

const { getPool } = require('./config');
const { sendOtpEmail } = require('./sendEmail');
const crypto = require('crypto');

async function requestOtpHandler(req, res) {
    const { email, full_name, type } = req.body || {};

    if (!email) {
        return res.status(400).json({ status: 'warn', message: 'Email is required' });
    }

    const pool = getPool();

    try {
        const normalizedEmail = String(email).trim().toLowerCase();

        const [existing] = await pool.execute(
            'SELECT id, full_name FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (type === 'login') {
            if (existing.length === 0) {
                return res.status(404).json({ status: 'error', message: 'No account found with this email. Please register first.' });
            }
        } else {
            // Default is register
            if (existing.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Email already registered. Please sign in.' });
            }
        }

        // Generate a cryptographically secure 6-digit OTP (CSPRNG)
        const otp_code = crypto.randomInt(100000, 1000000).toString();
        
        // Calculate expiration (15 minutes from now)
        const expires_at = new Date();
        expires_at.setMinutes(expires_at.getMinutes() + 15);

        // Save OTP to database
        await pool.execute(
            `INSERT INTO otps (email, otp_code, expires_at) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE otp_code = ?, expires_at = ?`,
            [normalizedEmail, otp_code, expires_at, otp_code, expires_at]
        );

        const recipientEmail = normalizedEmail;
        const recipientName = full_name ? String(full_name).trim() : (existing[0]?.full_name || 'UniHive Student');

        let emailSent = false;
        try {
            emailSent = await sendOtpEmail(recipientEmail, recipientName, otp_code);
        } catch (e) {
            console.error('sendOtpEmail error:', e);
        }

        res.json({
            status: 'success',
            message: emailSent 
                ? `Verification code sent to ${normalizedEmail}`
                : `Code generated for ${normalizedEmail}`,
            email_sent: emailSent,
            otp_code: process.env.NODE_ENV !== 'production' || !emailSent ? otp_code : undefined
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to request OTP: ' + error.message });
    }
}

module.exports = requestOtpHandler;
