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
        if (receiver_id === 'broadcast') {
            // Verify sender is a manager
            const [userRows] = await pool.execute('SELECT role FROM users WHERE id = ?', [sender_id]);
            const role = userRows[0]?.role;
            if (role !== 'manager' && role !== 'hostel_manager') {
                return res.status(403).json({ status: 'error', message: 'Only hostel managers can send broadcasts' });
            }

            // Insert master broadcast log
            const [result] = await pool.execute(
                `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
                [sender_id, 'broadcast', content]
            );

            // Fetch all students residing in hostels managed by this manager
            const [students] = await pool.execute(`
                SELECT DISTINCT b.user_id FROM bookings b
                JOIN hostels h ON b.hostel_id = h.id
                WHERE h.manager_id = ? AND (b.status = 'approved' OR b.payment_status = 'paid')
            `, [sender_id]);

            // Trigger push notifications
            const { sendPushNotification } = require('./push');
            const [sender] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [sender_id]);
            const senderName = sender[0]?.full_name || 'Hostel Manager';

            for (const student of students) {
                // Insert message for each student individually
                await pool.execute(
                    `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
                    [sender_id, student.user_id, content]
                );

                // Push notify the student
                sendPushNotification(student.user_id, {
                    title: `Broadcast from ${senderName}`,
                    body: content,
                    url: '/messages'
                });
            }

            return res.json({ status: 'success', message: 'Broadcast message sent successfully', message_id: result.insertId });
        }

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
            if (chat_with_id === 'broadcast') {
                // Get broadcasts sent by this manager
                const [messages] = await pool.execute(`
                    SELECT m.*, u.full_name as sender_name, u.role as sender_role
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.sender_id = ? AND m.receiver_id = 'broadcast'
                    ORDER BY m.timestamp ASC
                `, [user_id]);

                return res.json({ status: 'success', messages });
            }

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

            // Get user's role
            const [userRows] = await pool.execute('SELECT role FROM users WHERE id = ?', [user_id]);
            const user_role = userRows[0]?.role;

            const chatsMap = new Map();
            chats.forEach(c => {
                chatsMap.set(String(c.chat_with_id), c);
            });

            const enrichContact = (contact) => {
                const chatInfo = chatsMap.get(String(contact.contact_id));
                return {
                    chat_with_id: String(contact.contact_id),
                    chat_with_name: contact.contact_name,
                    chat_with_role: contact.contact_role,
                    hostel_name: contact.hostel_name || null,
                    room_number: contact.room_number || null,
                    unread_count: chatInfo ? Number(chatInfo.unread_count) : 0,
                    last_message_time: chatInfo ? chatInfo.last_message_time : null
                };
            };

            const contacts = {
                admin: [],
                managers: [],
                students: [],
                roommates: [],
                manager: []
            };

            if (user_role === 'admin') {
                const [managers] = await pool.execute(`
                    SELECT DISTINCT
                        u.id as contact_id, 
                        u.full_name as contact_name, 
                        u.role as contact_role,
                        h.name as hostel_name
                    FROM users u
                    LEFT JOIN hostels h ON h.manager_id = u.id
                    WHERE u.role IN ('manager', 'hostel_manager')
                `);
                contacts.managers = managers.map(enrichContact);

            } else if (user_role === 'manager' || user_role === 'hostel_manager') {
                const [admins] = await pool.execute(`
                    SELECT id as contact_id, full_name as contact_name, role as contact_role
                    FROM users WHERE role = 'admin'
                `);
                contacts.admin = admins.map(enrichContact);

                const [students] = await pool.execute(`
                    SELECT DISTINCT
                        u.id as contact_id, 
                        u.full_name as contact_name, 
                        u.role as contact_role,
                        h.name as hostel_name,
                        r.room_number
                    FROM bookings b
                    JOIN users u ON b.user_id = u.id
                    JOIN hostels h ON b.hostel_id = h.id
                    JOIN rooms r ON b.room_id = r.id
                    WHERE h.manager_id = ? AND (b.status = 'approved' OR b.payment_status = 'paid')
                `, [user_id]);
                contacts.students = students.map(enrichContact);

            } else if (user_role === 'student') {
                const [manager] = await pool.execute(`
                    SELECT DISTINCT
                        u.id as contact_id, 
                        u.full_name as contact_name, 
                        u.role as contact_role,
                        h.name as hostel_name
                    FROM bookings b
                    JOIN hostels h ON b.hostel_id = h.id
                    JOIN users u ON h.manager_id = u.id
                    WHERE b.user_id = ? AND (b.status = 'approved' OR b.payment_status = 'paid')
                    LIMIT 1
                `, [user_id]);
                contacts.manager = manager.map(enrichContact);

                const [myBooking] = await pool.execute(`
                    SELECT room_id FROM bookings 
                    WHERE user_id = ? AND (status = 'approved' OR payment_status = 'paid') 
                    LIMIT 1
                `, [user_id]);

                if (myBooking.length > 0 && myBooking[0].room_id) {
                    const [roommates] = await pool.execute(`
                        SELECT DISTINCT
                            u.id as contact_id, 
                            u.full_name as contact_name, 
                            u.role as contact_role
                        FROM bookings b
                        JOIN users u ON b.user_id = u.id
                        WHERE b.room_id = ? AND b.user_id != ? AND (b.status = 'approved' OR b.payment_status = 'paid')
                    `, [myBooking[0].room_id, user_id]);
                    contacts.roommates = roommates.map(enrichContact);
                }
            }

            res.json({ status: 'success', chats, contacts });
        }
    } catch (e) {
        console.error('Get messages error:', e);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messages' });
    }
}

module.exports = messagesHandler;
