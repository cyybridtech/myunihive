/**
 * Delete Hostel API
 * POST /api/deleteHostel
 * Requires: admin role
 */

const { getPool } = require('./config');

async function deleteHostelHandler(req, res) {
    const { hostel_id } = req.body || {};
    const user_role = req.role;

    if (!user_role || user_role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    if (!hostel_id) {
        return res.status(400).json({ status: 'error', message: 'Hostel id is required' });
    }

    const pool = getPool();

    try {
        // Check if hostel exists
        const [hostels] = await pool.execute(
            'SELECT id FROM hostels WHERE id = ?',
            [hostel_id]
        );

        if (hostels.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Hostel not found' });
        }

        // Delete in correct order (respect foreign keys)
        await pool.execute('DELETE FROM bookings WHERE hostel_id = ?', [hostel_id]);
        await pool.execute('DELETE FROM reviews WHERE hostel_id = ?', [hostel_id]);
        await pool.execute('DELETE FROM rooms WHERE hostel_id = ?', [hostel_id]);
        await pool.execute('DELETE FROM hostels WHERE id = ?', [hostel_id]);

        res.json({ status: 'success', message: 'Hostel deleted' });

    } catch (error) {
        console.error('Delete hostel error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete hostel: ' + error.message });
    }
}

module.exports = deleteHostelHandler;
