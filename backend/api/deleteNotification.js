/**
 * Delete Notification API
 * POST /api/deleteNotification
 * Requires: db_id and user_id
 */

const { getPool } = require('./config');

async function deleteNotificationHandler(req, res) {
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
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [db_id, user_id]
        );

        res.json({ status: 'success' });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = deleteNotificationHandler;
