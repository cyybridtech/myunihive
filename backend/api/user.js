/**
 * User API - Get Current User
 * GET /api/user
 * Requires: user_id in request body or params
 */

const { getPool } = require('./config');

async function userHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        const [users] = await pool.execute(
            'SELECT id, full_name, email, role, avatar, credits, university_id, phone, gender FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({
            status: 'success',
            user: users[0]
        });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ status: 'error', message: 'Database error' });
    }
}

module.exports = userHandler;
