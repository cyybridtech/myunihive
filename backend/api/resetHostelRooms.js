/**
 * Reset Hostel Rooms API
 * POST /api/resetHostelRooms
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function resetHostelRoomsHandler(req, res) {
    const pool = getPool();
    const { hostel_id } = req.body;
    const user_role = req.role;
    const user_id = req.user_id;

    if (!user_role || !user_id) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!hostel_id) {
        return res.status(400).json({ status: 'error', message: 'Missing hostel_id' });
    }

    try {
        // Verify permissions
        if (user_role !== 'admin') {
            const [hostel] = await pool.execute('SELECT manager_id FROM hostels WHERE id = ?', [hostel_id]);
            if (hostel.length === 0 || String(hostel[0].manager_id) !== String(user_id)) {
                return res.status(403).json({ status: 'error', message: 'You do not have permission to reset this hostel' });
            }
        }

        // Expire all active bookings
        await pool.execute(`
            UPDATE bookings 
            SET status = 'expired' 
            WHERE hostel_id = ? AND (status = 'approved' OR payment_status = 'paid')
        `, [hostel_id]);

        // Reset all manual occupancies and ensure rooms are marked available
        await pool.execute(`
            UPDATE rooms 
            SET manual_occupancy = 0, available = 1 
            WHERE hostel_id = ?
        `, [hostel_id]);

        res.json({ status: 'success', message: 'Hostel rooms reset successfully' });
    } catch (error) {
        console.error('Reset hostel error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = resetHostelRoomsHandler;
