/**
 * Admin User Management API
 * GET /api/admin/users - List all registered users
 * POST /api/admin/users/update - Update role or verification status
 */

const { getPool } = require('./config');
const auth = require('./auth');

async function getAdminUsersHandler(req, res) {
    const authData = auth.getRequestAuth(req);
    const userRole = authData?.role || req.role;

    if (userRole !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    const pool = getPool();

    try {
        const [users] = await pool.execute(`
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.role, u.gender, u.university_id,
                u.verified, u.verification_status, u.id_type, u.ghana_card_number,
                u.passport_number, u.selfie_photo, u.id_photo, u.created_at, u.last_ip,
                un.name as university_name
            FROM users u
            LEFT JOIN universities un ON u.university_id = un.id
            ORDER BY u.id DESC
        `);

        return res.json({
            status: 'success',
            users
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch users: ' + error.message });
    }
}

async function updateAdminUserHandler(req, res) {
    const authData = auth.getRequestAuth(req);
    const userRole = authData?.role || req.role;

    if (userRole !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    const { target_user_id, role, verified, verification_status } = req.body || {};

    if (!target_user_id) {
        return res.status(400).json({ status: 'error', message: 'target_user_id is required' });
    }

    const pool = getPool();

    try {
        const updates = [];
        const values = [];

        if (role !== undefined) {
            const validRoles = ['student', 'manager', 'hostel_manager', 'admin'];
            if (validRoles.includes(role)) {
                updates.push('role = ?');
                values.push(role);
            }
        }

        if (verified !== undefined) {
            updates.push('verified = ?');
            values.push(verified ? 1 : 0);
        }

        if (verification_status !== undefined) {
            updates.push('verification_status = ?');
            values.push(verification_status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No valid update fields provided' });
        }

        values.push(target_user_id);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        return res.json({
            status: 'success',
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Admin update user error:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update user: ' + error.message });
    }
}

module.exports = {
    getAdminUsersHandler,
    updateAdminUserHandler
};
