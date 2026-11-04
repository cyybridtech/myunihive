/**
 * Forgot Password API
 * POST /api/forgot-password
 */

const { getPool } = require('./config');
const { sendPasswordResetEmail } = require('./sendEmail');

async function forgotPasswordHandler(req, res) {
    const { email } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
        return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const pool = getPool();

    try {
        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, full_name FROM users WHERE LOWER(email) = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            // Return success even if email not found to prevent email enumeration attacks
            return res.json({ status: 'success', message: 'If an account exists, a reset code has been sent.' });
        }

        const user = users[0];

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
            [normalizedEmail, otp_code, expires_at, otp_code, expires_at]
        );

        // Send Email
        const emailSent = await sendPasswordResetEmail(normalizedEmail, user.full_name, otp_code);
        
        if (!emailSent) {
            console.warn('Failed to send password reset email, but OTP was generated.');
        }

        res.json({
            status: 'success',
            message: 'If an account exists, a reset code has been sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process request: ' + error.message });
    }
}

module.exports = forgotPasswordHandler;
