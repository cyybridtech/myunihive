/**
 * Register API - User Registration  
 * POST /api/register
 * 
 * NOTE: OTP email verification is temporarily disabled for faster onboarding.
 * OTP is accepted but not verified against email delivery.
 */

const { getPool } = require('./config');
const { sendWelcomeEmail } = require('./sendEmail');

async function registerHandler(req, res) {
        const { full_name, email, password, phone, gender } = req.body || {};
    const university_id = req.body?.university_id || req.body?.universityId || null;
    const otp = req.body?.otp;

    // Validate required fields
    if (!full_name || !email || !password || !otp) {
        return res.status(400).json({ status: 'error', message: 'All fields including OTP are required' });
    }

    const pool = getPool();

    try {
        // Verify OTP first
        const [otpRows] = await pool.execute(
            'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
            [email, otp]
        );

        if (otpRows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP code' });
        }

        // Delete OTP
        await pool.execute('DELETE FROM otps WHERE email = ?', [email]);

        // Check if user already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email already exists' });
        }

        console.log(`[REGISTER] User registration for ${email} (OTP verified successfully)`);

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert user
        const [result] = await pool.execute(
            `INSERT INTO users (full_name, email, phone, university_id, password, role, gender, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [full_name, email, phone || null, university_id, hashedPassword, 'student', gender || 'male']
        );

        const user_id = result.insertId;

        // Generate JWT token for immediate login
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user_id, email: email, role: 'student' },
            process.env.JWT_SECRET || 'UniHiveChangeMePleaseReplaceThisInProduction',
            { expiresIn: '7d' }
        );

        // Send welcome email and fail loudly in logs if it doesn’t go out
        try {
            await sendWelcomeEmail(email, full_name, user_id);
        } catch (err) {
            console.error('[REGISTER] Welcome email failed:', err && err.message ? err.message : err);
        }

        // Insert in-app welcome notification
        try {
            await pool.execute(
                `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                 VALUES (?, ?, ?, 'system', 0, CURDATE())`,
                [
                    user_id,
                    'Welcome to UniHive! 🎓',
                    `Welcome aboard, ${full_name.split(' ')[0] || 'Student'}! Your account is verified. Start by exploring verified hostels near your campus, connecting with verified roommates, or saving your favorite rooms.`
                ]
            );
        } catch (notifErr) {
            console.warn('[REGISTER] In-app welcome notification warning:', notifErr.message);
        }

        res.json({
            status: 'success',
            message: 'Registration successful',
            user_id: user_id,
            token: token,
            user: {
                id: user_id,
                full_name: full_name,
                email: email,
                role: 'student',
                phone: phone,
                university_id: university_id,
                gender: gender
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ status: 'error', message: 'Registration failed: ' + error.message });
    }
}

module.exports = registerHandler;
