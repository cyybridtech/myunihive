/**
 * Update Room API
 * POST /api/updateRoom
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function updateRoomHandler(req, res) {
    const {
        room_id,
        room_number,
        capacity,
        price,
        gender,
        type,
        description,
        image,
        available
    } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!user_role || !user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!room_id) {
        return res.status(400).json({ status: 'error', message: 'Room id is required' });
    }
    const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
    if (user_role !== 'admin' && !isManagerRole) {
        return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
    }

    const pool = getPool();

    try {
        const [rooms] = await pool.execute(
            `SELECT r.hostel_id, h.manager_id FROM rooms r
             LEFT JOIN hostels h ON r.hostel_id = h.id
             WHERE r.id = ?`,
            [room_id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Room not found' });
        }

        if (isManagerRole && rooms[0].manager_id != user_id) {
            return res.status(403).json({ status: 'error', message: 'Hostel manager can only update rooms for their own hostels' });
        }

        const updates = [];
        const values = [];

        if (room_number !== undefined) { updates.push('room_number = ?'); values.push(room_number); }
        if (capacity !== undefined) { updates.push('capacity = ?'); values.push(capacity); }
        if (price !== undefined) { updates.push('price = ?'); values.push(price); }
        if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
        if (type !== undefined) { updates.push('type = ?'); values.push(type); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (image !== undefined) { updates.push('image = ?'); values.push(image); }
        if (available !== undefined) { updates.push('available = ?'); values.push(available ? 1 : 0); }

        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update' });
        }

        values.push(room_id);
        await pool.execute(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ status: 'success', message: 'Room updated' });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update room: ' + error.message });
    }
}

module.exports = updateRoomHandler;
