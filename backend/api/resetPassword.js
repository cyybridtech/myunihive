/**
 * Reset Password API
 * POST /api/reset-password
 */

const { getPool } = require('./config');
const bcrypt = require('bcryptjs');

async function resetPasswordHandler(req, res) {
    const { email, otp, new_password } = req.body || {};

    if (!email || !otp || !new_password) {
        return res.status(400).json({ status: 'error', message: 'Email, code, and new password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    const pool = getPool();

    try {
        // Verify OTP
        const [otpRecords] = await pool.execute(
            'SELECT id FROM otps WHERE email = ? AND otp_code = ? AND expires_at > NOW()',
            [email, otp]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired code' });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(new_password, 10);

        // Update user password
        const [updateResult] = await pool.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(400).json({ status: 'error', message: 'User not found' });
        }

        // OTP is valid, let's delete it so it can't be reused
        await pool.execute('DELETE FROM otps WHERE id = ?', [otpRecords[0].id]);

        res.json({
            status: 'success',
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to reset password: ' + error.message });
    }
}

module.exports = resetPasswordHandler;
