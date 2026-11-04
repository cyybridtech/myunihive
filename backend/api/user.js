/**
 * User API - Profile & Password Management
 */

const { getPool } = require('./config');
const bcrypt = require('bcryptjs');

// GET /api/user - Get current user profile
async function userHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        const [users] = await pool.execute(
            'SELECT id, full_name, email, role, avatar, university_id, phone, gender, ghana_card_number, created_at, verified FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const userObj = users[0];
        if (userObj.role !== 'admin') {
            const [hostels] = await pool.execute('SELECT COUNT(*) as count FROM hostels WHERE manager_id = ?', [userObj.id]);
            if (hostels[0].count > 0) {
                userObj.role = 'hostel_manager';
            }
        }

        res.json({
            status: 'success',
            user: userObj
        });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ status: 'error', message: 'Database error' });
    }
}

// POST /api/user/update - Update personal profile information
async function updateProfileHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const { full_name, phone, gender, avatar, university_id, ghana_card_number } = req.body || {};
    const pool = getPool();

    try {
        const updates = [];
        const values = [];

        if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name.trim()); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone.trim()); }
        if (gender !== undefined) {
            const cleanGender = ['male', 'female', 'other'].includes(gender) ? gender : 'male';
            updates.push('gender = ?');
            values.push(cleanGender);
        }
        if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }
        if (university_id !== undefined) { updates.push('university_id = ?'); values.push(university_id || null); }
        if (ghana_card_number !== undefined) { updates.push('ghana_card_number = ?'); values.push(ghana_card_number.trim()); }

        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields provided to update' });
        }

        values.push(user_id);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        // Fetch updated user to return to client
        const [rows] = await pool.execute(
            'SELECT id, full_name, email, role, avatar, university_id, phone, gender, ghana_card_number, created_at, verified FROM users WHERE id = ?',
            [user_id]
        );

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            user: rows[0]
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update profile: ' + error.message });
    }
}

// POST /api/user/change-password - Secure password change
async function changePasswordHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
        return res.status(400).json({ status: 'error', message: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'New password must be at least 6 characters' });
    }

    const pool = getPool();

    try {
        const [users] = await pool.execute(
            'SELECT id, password FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(current_password, user.password);

        if (!validPassword) {
            return res.status(400).json({ status: 'error', message: 'Incorrect current password' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user_id]);

        res.json({
            status: 'success',
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to change password: ' + error.message });
    }
}

module.exports = {
    userHandler,
    updateProfileHandler,
    changePasswordHandler
};
