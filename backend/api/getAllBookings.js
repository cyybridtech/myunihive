/**
 * Get All Bookings API
 * GET /api/getAllBookings
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function getAllBookingsHandler(req, res) {
    const user_role = req.role;
    const user_id = req.user_id;

    if (!user_id || !user_role) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        let bookings;
        
        const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
        if (isManagerRole) {
            // Managers see only their hostel's bookings
            [bookings] = await pool.execute(
                `SELECT b.*, h.name as hostel_name, r.room_number as roomNumber, r.type as room_type, u.full_name as user_name, u.gender as user_gender
                 FROM bookings b 
                 LEFT JOIN hostels h ON b.hostel_id = h.id 
                 LEFT JOIN rooms r ON b.room_id = r.id
                 LEFT JOIN users u ON b.user_id = u.id
                 WHERE h.manager_id = ?
                 ORDER BY b.id DESC`,
                [user_id]
            );
        } else if (user_role === 'admin') {
            [bookings] = await pool.execute(
                `SELECT b.*, h.name as hostel_name, r.room_number as roomNumber, r.type as room_type, u.full_name as user_name, u.gender as user_gender
                 FROM bookings b 
                 LEFT JOIN hostels h ON b.hostel_id = h.id 
                 LEFT JOIN rooms r ON b.room_id = r.id
                 LEFT JOIN users u ON b.user_id = u.id
                 ORDER BY b.id DESC`
            );
        } else {
            return res.status(403).json({ status: 'error', message: 'Access denied' });
        }

        res.json({ status: 'success', bookings: bookings });

    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getAllBookingsHandler;
