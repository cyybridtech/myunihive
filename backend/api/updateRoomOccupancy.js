/**
 * Update Room Occupancy API (Manual Reservation)
 * POST /api/updateRoomOccupancy
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function updateRoomOccupancyHandler(req, res) {
    const { room_id, action } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!room_id || !['increment', 'decrement'].includes(action)) {
        return res.status(400).json({ status: 'error', message: 'Missing fields or invalid action' });
    }

    if (!user_id || !user_role) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        // Get room's hostel info and current stats
        const [rooms] = await pool.execute(
            `SELECT r.*, h.manager_id,
             (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND (b.status = 'approved' OR (b.payment_status = 'paid' AND b.status NOT IN ('cancelled', 'rejected', 'completed', 'expired')))) as app_occupancy
             FROM rooms r 
             LEFT JOIN hostels h ON r.hostel_id = h.id 
             WHERE r.id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found' });
        }

        const room = rooms[0];

        // Check permissions
        const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
        if (user_role !== 'admin') {
            if (!isManagerRole || room.manager_id != user_id) {
                return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
            }
        }

        const appOccupancy = parseInt(room.app_occupancy) || 0;
        const manualOccupancy = parseInt(room.manual_occupancy) || 0;
        const capacity = parseInt(room.capacity) || 1;

        let newManualOccupancy = manualOccupancy;
        if (action === 'increment') {
            if (appOccupancy + manualOccupancy >= capacity) {
                return res.status(400).json({ status: 'error', message: 'Room has reached its capacity limit.' });
            }
            newManualOccupancy = manualOccupancy + 1;
        } else if (action === 'decrement') {
            if (manualOccupancy <= 0) {
                return res.status(400).json({ status: 'error', message: 'No manual beds to release.' });
            }
            newManualOccupancy = manualOccupancy - 1;
        }

        const newTotalOccupancy = appOccupancy + newManualOccupancy;
        const isAvailable = newTotalOccupancy >= capacity ? 0 : 1;

        await pool.execute('UPDATE rooms SET manual_occupancy = ?, available = ? WHERE id = ?', [newManualOccupancy, isAvailable, room_id]);

        res.json({
            status: 'success',
            message: 'Room occupancy updated successfully'
        });

    } catch (error) {
        console.error('Update room occupancy error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = updateRoomOccupancyHandler;
