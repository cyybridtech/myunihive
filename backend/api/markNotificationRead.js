/**
 * Mark Notification Read API
 * POST /api/markNotificationRead
 * Requires: db_id and user_id
 */

const { getPool } = require('./config');

async function markNotificationReadHandler(req, res) {
    const { db_id } = req.body || {};
    const user_id = req.user_id;

    if (!db_id) {
        return res.status(400).json({ status: 'error', message: 'Missing parameters' });
    }
    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        await pool.execute(
            'UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?',
            [db_id, user_id]
        );

        res.json({ status: 'success' });

    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = markNotificationReadHandler;
