/**
 * Login API - User Authentication
 * POST /api/login
 */

const { getPool } = require('./config');

async function loginHandler(req, res) {
    let { email, password, otp } = req.body || {};

    if (!email || (!password && !otp)) {
        return res.status(400).json({ status: 'error', message: 'Email and either password or verification code are required' });
    }

    email = String(email).trim().toLowerCase();
    const pool = getPool();

    try {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE LOWER(email) = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = users[0];

        // 1. Verify via OTP if provided
        if (otp) {
            const cleanOtp = String(otp).trim();
            const [otpRows] = await pool.execute(
                'SELECT * FROM otps WHERE LOWER(email) = ? AND otp_code = ? AND expires_at > NOW()',
                [email, cleanOtp]
            );

            if (otpRows.length === 0) {
                return res.status(401).json({ status: 'error', message: 'Invalid or expired verification code' });
            }

            // Consume the OTP
            await pool.execute('DELETE FROM otps WHERE LOWER(email) = ?', [email]);
        } else {
            // 2. Verify via Password
            const bcrypt = require('bcryptjs');
            let storedPassword = String(user.password || '');
            if (storedPassword.startsWith('$2y$')) {
                storedPassword = `$2a$${storedPassword.slice(4)}`;
            }
            const validPassword = bcrypt.compareSync(String(password), storedPassword);

            if (!validPassword) {
                return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
            }
        }

        let role = user.role || '';

        // Auto-detect hostel manager role if user manages any hostel
        if (role !== 'admin') {
            const [hostels] = await pool.execute(
                'SELECT COUNT(*) as count FROM hostels WHERE manager_id = ?',
                [user.id]
            );
            if (hostels[0].count > 0) {
                role = 'hostel_manager';
                // Synchronize users table if role was student or empty
                await pool.execute('UPDATE users SET role = "hostel_manager" WHERE id = ? AND role != "admin"', [user.id]);
            }
        }

        // Default role to student if still empty
        if (!role) {
            role = 'student';
        }

        const { generateAuthToken } = require('./auth');
        const token = generateAuthToken({ id: user.id, role });

        // Return user data (exclude password)
        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone || '',
                university_id: user.university_id,
                role: role,
                gender: user.gender || 'male',
                avatar: user.avatar || '',
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'error', message: 'Database error' });
    }
}

module.exports = loginHandler;
