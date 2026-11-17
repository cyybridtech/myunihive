/**
 * Reset Password API
 * POST /api/reset-password
 */

const { getPool } = require('./config');
const bcrypt = require('bcryptjs');

async function resetPasswordHandler(req, res) {
    const { email, otp, new_password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!normalizedEmail || !cleanOtp || !new_password) {
        return res.status(400).json({ status: 'error', message: 'Email, code, and new password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    const pool = getPool();

    try {
        // Verify OTP (case-insensitive email with brute-force attempt throttling)
        const [otpRecords] = await pool.execute(
            'SELECT id, otp_code, attempts FROM otps WHERE LOWER(email) = ? AND expires_at > NOW()',
            [normalizedEmail]
        );

        if (otpRecords.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired verification code' });
        }

        const otpRecord = otpRecords[0];
        const currentAttempts = (otpRecord.attempts || 0) + 1;

        if (otpRecord.otp_code !== cleanOtp) {
            if (currentAttempts >= 5) {
                await pool.execute('DELETE FROM otps WHERE id = ?', [otpRecord.id]);
                return res.status(429).json({
                    status: 'error',
                    message: 'Too many incorrect attempts. This reset code has been invalidated. Please request a new code.'
                });
            }
            await pool.execute('UPDATE otps SET attempts = ? WHERE id = ?', [currentAttempts, otpRecord.id]);
            return res.status(400).json({
                status: 'error',
                message: `Invalid verification code. ${5 - currentAttempts} attempt(s) remaining.`
            });
        }

        // Hash new password
        const hashedPassword = bcrypt.hashSync(new_password, 10);

        // Update user password
        const [updateResult] = await pool.execute(
            'UPDATE users SET password = ? WHERE LOWER(email) = ?',
            [hashedPassword, normalizedEmail]
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
