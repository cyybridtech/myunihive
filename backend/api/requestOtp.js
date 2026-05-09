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

        // Send Email asynchronously so the API returns quickly even if email transport is slow.
        sendOtpEmail(email, full_name, otp_code)
            .then(emailSent => {
                if (!emailSent) {
                    console.warn(`[OTP] Failed to send OTP email to ${email}, but OTP was generated and stored.`);
                    console.warn(`[OTP] OTP Code for ${email}: ${otp_code} (expires: ${expires_at.toISOString()})`);
                } else {
                    console.log(`[OTP] OTP email sent successfully to ${email}`);
                }
            })
            .catch(emailError => {
                console.error(`[OTP] Failed to send OTP email to ${email}:`, emailError);
                console.warn(`[OTP] Manual OTP Code for ${email}: ${otp_code} (expires: ${expires_at.toISOString()})`);
            });

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

// Debug endpoint to check OTP codes (remove in production)
app.get('/api/debug-otp/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    try {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT otp_code, expires_at FROM otps WHERE email = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email]
        );

        if (rows.length === 0) {
            return res.json({ found: false, message: 'No active OTP found for this email' });
        }

        res.json({
            found: true,
            email: email,
            otp_code: rows[0].otp_code,
            expires_at: rows[0].expires_at
        });
    } catch (error) {
        console.error('Debug OTP error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = requestOtpHandler;
