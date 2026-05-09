/**
 * Get User Bookings API
 * GET /api/getUserBookings
 * Requires: user_id
 */

const { getPool } = require('./config');

async function getUserBookingsHandler(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        const [bookings] = await pool.execute(
            `SELECT b.*, h.name as hostel_name, r.room_number as roomNumber, r.type as room_type,
                    u.full_name as user_name, u.email as user_email, u.gender as user_gender
             FROM bookings b
             LEFT JOIN hostels h ON b.hostel_id = h.id
             LEFT JOIN rooms r ON b.room_id = r.id
             LEFT JOIN users u ON b.user_id = u.id
             WHERE b.user_id = ?
             ORDER BY b.id DESC`,
            [user_id]
        );

        res.json({ status: 'success', bookings: bookings });

    } catch (error) {
        console.error('Get user bookings error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getUserBookingsHandler;
