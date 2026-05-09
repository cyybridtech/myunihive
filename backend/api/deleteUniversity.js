/**
 * Delete University API
 * POST /api/deleteUniversity
 * Requires: admin role
 */

const { getPool } = require('./config');

async function deleteUniversityHandler(req, res) {
    const { university_id } = req.body || {};
    const user_role = req.role;

    if (!user_role || user_role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }
    if (!university_id) {
        return res.status(400).json({ status: 'error', message: 'University id is required' });
    }

    const pool = getPool();

    try {
        const [uniRows] = await pool.execute('SELECT id FROM universities WHERE id = ?', [university_id]);
        if (uniRows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'University not found' });
        }

        const [hostels] = await pool.execute('SELECT id FROM hostels WHERE university_id = ?', [university_id]);
        const hostelIds = hostels.map(h => h.id);

        if (hostelIds.length > 0) {
            const placeholders = hostelIds.map(() => '?').join(', ');
            await pool.execute(`DELETE FROM bookings WHERE hostel_id IN (${placeholders})`, hostelIds);
            await pool.execute(`DELETE FROM reviews WHERE hostel_id IN (${placeholders})`, hostelIds);
            await pool.execute(`DELETE FROM rooms WHERE hostel_id IN (${placeholders})`, hostelIds);
            await pool.execute(`DELETE FROM hostels WHERE id IN (${placeholders})`, hostelIds);
        }

        await pool.execute('DELETE FROM universities WHERE id = ?', [university_id]);

        res.json({ status: 'success', message: 'University deleted' });
    } catch (error) {
        console.error('Delete university error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete university: ' + error.message });
    }
}

module.exports = deleteUniversityHandler;
