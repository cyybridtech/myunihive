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
        
        let isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
        if (!isManagerRole && user_role !== 'admin') {
            const [hostelCheck] = await pool.execute('SELECT COUNT(*) as count FROM hostels WHERE manager_id = ?', [user_id]);
            if (hostelCheck[0]?.count > 0) isManagerRole = true;
        }
        const baseQuery = `
            SELECT b.*, 
                   h.name as hostel_name, 
                   r.room_number as roomNumber, 
                   r.type as room_type, 
                   u.full_name as user_name, 
                   u.gender as user_gender,
                   u.email as user_email,
                   u.phone as user_phone,
                   u.avatar as user_avatar,
                   u.id_photo as user_id_photo,
                   u.ghana_card_number as user_ghana_card,
                   un.name as university_name,
                   COALESCE(b.student_id_number, u.student_id_number) as student_id_number,
                   COALESCE(b.level, u.level) as level,
                   COALESCE(b.program_of_study, u.program_of_study) as program_of_study,
                   COALESCE(b.emergency_contact_name, u.emergency_contact_name) as emergency_contact_name,
                   COALESCE(b.emergency_contact_phone, u.emergency_contact_phone) as emergency_contact_phone,
                   COALESCE(b.emergency_contact_relation, u.emergency_contact_relation) as emergency_contact_relation
            FROM bookings b 
            LEFT JOIN hostels h ON b.hostel_id = h.id 
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN universities un ON u.university_id = un.id
        `;

        if (isManagerRole) {
            // Managers see only their hostel's bookings
            [bookings] = await pool.execute(
                `${baseQuery} WHERE h.manager_id = ? ORDER BY b.id DESC`,
                [user_id]
            );
        } else if (user_role === 'admin') {
            [bookings] = await pool.execute(
                `${baseQuery} ORDER BY b.id DESC`
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
