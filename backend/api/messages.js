/**
 * Messages API
 * POST /api/messages - Send a message
 * GET /api/messages - Get messages or chats
 */

const { getPool } = require('./config');

async function messagesHandler(req, res) {
    const method = req.method || req.httpMethod;

    if (method === 'POST') {
        return sendMessage(req, res);
    } else if (method === 'GET' || method === undefined) {
        return getMessages(req, res);
    }

    res.status(405).json({ status: 'error', message: 'Only POST/GET allowed' });
}

async function sendMessage(req, res) {
    const { receiver_id, content } = req.body || {};
    const sender_id = req.user_id;

    if (!sender_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });
    if (!receiver_id || !content) return res.status(400).json({ status: 'error', message: 'Missing fields' });

    const pool = getPool();
    try {
        const [result] = await pool.execute(
            `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
            [sender_id, receiver_id, content]
        );
        res.json({ status: 'success', message: 'Message sent', message_id: result.insertId });

        // Trigger push notification asynchronously
        const { sendPushNotification } = require('./push');
        const [sender] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [sender_id]);
        const senderName = sender[0]?.full_name || 'Someone';
        sendPushNotification(receiver_id, {
            title: `New message from ${senderName}`,
            body: content,
            url: '/messages'
        });
    } catch (e) {
        console.error('Send message error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
}

async function getMessages(req, res) {
    const user_id = req.user_id;
    if (!user_id) return res.status(401).json({ status: 'error', message: 'Authentication required' });

    const chat_with_id = req.query?.chat_with_id;
    const pool = getPool();

    try {
        if (chat_with_id) {
            // Get conversation with specific user
            const [messages] = await pool.execute(`
                SELECT m.*, u.full_name as sender_name, u.role as sender_role
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?)
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.timestamp ASC
            `, [user_id, chat_with_id, chat_with_id, user_id]);

            // Mark as read
            await pool.execute(`UPDATE messages SET read_status = 1 WHERE receiver_id = ? AND sender_id = ?`, [user_id, chat_with_id]);

            res.json({ status: 'success', messages });
        } else {
            // Get recent chats
            const [chats] = await pool.execute(`
                SELECT 
                    u.id as chat_with_id, 
                    u.full_name as chat_with_name, 
                    u.role as chat_with_role,
                    MAX(m.timestamp) as last_message_time,
                    SUM(CASE WHEN m.receiver_id = ? AND m.read_status = 0 THEN 1 ELSE 0 END) as unread_count
                FROM messages m
                JOIN users u ON (u.id = m.sender_id OR u.id = m.receiver_id) AND u.id != ?
                WHERE m.sender_id = ? OR m.receiver_id = ?
                GROUP BY u.id, u.full_name, u.role
                ORDER BY last_message_time DESC
            `, [user_id, user_id, user_id, user_id]);

            res.json({ status: 'success', chats });
        }
    } catch (e) {
        console.error('Get messages error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages' });
    }
}

module.exports = messagesHandler;
