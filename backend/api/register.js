/**
 * Register API - User Registration  
 * POST /api/register
 */

const { getPool } = require('./config');
const { sendWelcomeEmail } = require('./sendEmail');

async function registerHandler(req, res) {
        const { full_name, email, password, phone, gender } = req.body || {};
    const university_id = req.body?.university_id || req.body?.universityId || null;

    // Validate required fields
    if (!full_name || !email || !password) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    const pool = getPool();

    try {
        // Check if user already exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email already exists' });
        }

        // Verify OTP
        const otp = req.body?.otp;
        if (!otp) {
            return res.status(400).json({ status: 'error', message: 'OTP is required' });
        }

        const [otpRecords] = await pool.execute(
            'SELECT id FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
            [email, otp]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
        }

        // OTP is valid, let's delete it so it can't be reused
        await pool.execute('DELETE FROM otps WHERE id = ?', [otpRecords[0].id]);

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insert user
        const [result] = await pool.execute(
            `INSERT INTO users (full_name, email, phone, university_id, password, role, gender, credits, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [full_name, email, phone || null, university_id, hashedPassword, 'student', gender || 'male']
        );

        const user_id = result.insertId;

        // Send welcome email (async, don't wait)
        sendWelcomeEmail(email, full_name, user_id).catch(err => {
            console.error('Welcome email failed:', err.message);
        });

        res.json({
            status: 'success',
            message: 'Registration successful',
            user_id: user_id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ status: 'error', message: 'Registration failed: ' + error.message });
    }
}

module.exports = registerHandler;
