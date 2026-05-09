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
    const otp = req.body?.otp; // Accept OTP but don't require it

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

        // OTP verification temporarily disabled - users can register without email verification
        console.log(`[REGISTER] User registration for ${email} (OTP verification disabled for now)`);

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

        // Generate JWT token for immediate login
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user_id, email: email, role: 'student' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Send welcome email (async, don't wait)
        sendWelcomeEmail(email, full_name, user_id).catch(err => {
            console.error('Welcome email failed:', err.message);
        });

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
