/**
 * Delete Room API
 * POST /api/deleteRoom
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function deleteRoomHandler(req, res) {
    const { room_id } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!user_role || !user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (!room_id) {
        return res.status(400).json({ status: 'error', message: 'Room id is required' });
    }

    const pool = getPool();

    try {
        const [rooms] = await pool.execute('SELECT hostel_id FROM rooms WHERE id = ?', [room_id]);
        if (rooms.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found' });
        }

        const hostelId = rooms[0].hostel_id;

        if (user_role !== 'admin') {
            const [hostels] = await pool.execute('SELECT manager_id FROM hostels WHERE id = ?', [hostelId]);
            if (hostels.length === 0 || hostels[0].manager_id != user_id) {
                return res.status(403).json({ status: 'error', message: 'Admin or manager access required' });
            }
        }

        await pool.execute('DELETE FROM bookings WHERE room_id = ?', [room_id]);

        await pool.execute('DELETE FROM rooms WHERE id = ?', [room_id]);

        res.json({ status: 'success', message: 'Room deleted' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete room: ' + error.message });
    }
}

module.exports = deleteRoomHandler;
