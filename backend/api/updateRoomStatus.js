/**
 * Update Room Status API
 * POST /api/updateRoomStatus
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function updateRoomStatusHandler(req, res) {
    const { room_id, available } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!room_id || available === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing fields' });
    }

    if (!user_id || !user_role) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        // Get room's hostel info
        const [rooms] = await pool.execute(
            `SELECT r.hostel_id, h.manager_id FROM rooms r 
             LEFT JOIN hostels h ON r.hostel_id = h.id 
             WHERE r.id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found' });
        }

        // Check permissions
        const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
        if (user_role !== 'admin') {
            if (!isManagerRole || rooms[0].manager_id != user_id) {
                return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
            }
        }

        // Prevent marking a room available if it has an active approved paid booking
        if (available) {
            const [activeBookings] = await pool.execute(
                `SELECT COUNT(*) AS count FROM bookings WHERE room_id = ? AND status = 'approved' AND payment_status = 'paid'`,
                [room_id]
            );
            if (activeBookings[0]?.count > 0) {
                return res.status(400).json({ status: 'error', message: 'Room has an active approved booking and cannot be marked available.' });
            }
        }

        // Update availability
        const [result] = await pool.execute(
            'UPDATE rooms SET available = ? WHERE id = ?',
            [available ? 1 : 0, room_id]
        );

        res.json({
            status: 'success',
            message: 'Room status updated'
        });

    } catch (error) {
        console.error('Update room status error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = updateRoomStatusHandler;
