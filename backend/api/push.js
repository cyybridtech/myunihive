/**
 * Push API
 * POST /api/push/subscribe - Subscribe to push notifications
 */

const { getPool } = require('./config');
const webpush = require('web-push');

// Set up VAPID keys
// In production, these should be generated once and stored in environment variables.
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEE90AIGS9HcdCmGywp5CXHdNlELSVjR93xMop7gQbKP34yjYCKnS1MKa7HVTemmxvKmloDdDvxNSU31NBJ3S3s';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '4pyO50yqV-dLb8jX1mLroDSsE3a1vurdB2-nvEEiHe0';

webpush.setVapidDetails('mailto:cyybridtechnnology@gmail.com', publicVapidKey, privateVapidKey);

async function pushHandler(req, res) {
    const method = req.method || req.httpMethod;

    if (method === 'POST') {
        return subscribe(req, res);
    }

    res.status(405).json({ status: 'error', message: 'Only POST allowed' });
}

async function subscribe(req, res) {
    const { endpoint, keys } = req.body || {};
    const user_id = req.user_id;

    if (!user_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });
    if (!endpoint || !keys) return res.status(400).json({ status: 'error', message: 'Missing push subscription object' });

    const pool = getPool();
    try {
        await pool.execute(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`,
            [user_id, endpoint, keys.p256dh, keys.auth]
        );
        res.json({ status: 'success', message: 'Subscribed to push notifications' });
    } catch (e) {
        console.error('Push subscribe error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to subscribe' });
    }
}

// Function to send push notification from other parts of the app
async function sendPushNotification(user_id, payload) {
    const pool = getPool();
    try {
        const [subscriptions] = await pool.execute(`SELECT * FROM push_subscriptions WHERE user_id = ?`, [user_id]);
        
        for (let sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            
            try {
                await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
            } catch (err) {
                // If subscription is invalid/expired, remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await pool.execute(`DELETE FROM push_subscriptions WHERE id = ?`, [sub.id]);
                }
            }
        }
    } catch (e) {
        console.error('Error sending push:', e);
    }
}

module.exports = {
    pushHandler,
    sendPushNotification
};
