/**
 * Get Notifications API
 * GET /api/getNotifications
 * Requires: user_id
 */

const { getPool } = require('./config');

async function getNotificationsHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        const [notifications] = await pool.execute(
            `SELECT id, user_id, title, message, type, read_status, notification_date
             FROM notifications
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT 20`,
            [user_id]
        );

        // Transform to camelCase
        const transformed = notifications.map(n => ({
            id: 'db_' + n.id,
            userId: String(n.user_id),
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            read: Boolean(n.read_status),
            date: n.notification_date,
            db_id: n.id
        }));

        res.json({ status: 'success', notifications: transformed });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getNotificationsHandler;
