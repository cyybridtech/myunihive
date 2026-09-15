/**
 * Update University API
 * POST /api/updateUniversity
 * Requires: admin role
 */

const { getPool } = require('./config');

async function updateUniversityHandler(req, res) {
    const { id, university_id, name, city, country, lat, lng } = req.body || {};
    const uniId = id || university_id;
    const user_role = req.role;

    if (!user_role || user_role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    if (!uniId) {
        return res.status(400).json({ status: 'error', message: 'University ID is required' });
    }

    const pool = getPool();

    try {
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
        if (city !== undefined) { updates.push('city = ?'); values.push(city.trim()); }
        if (country !== undefined) { updates.push('country = ?'); values.push(country.trim()); }
        if (lat !== undefined) { updates.push('lat = ?'); values.push(lat !== null && lat !== '' ? Number(lat) : null); }
        if (lng !== undefined) { updates.push('lng = ?'); values.push(lng !== null && lng !== '' ? Number(lng) : null); }

        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields provided to update' });
        }

        values.push(uniId);
        await pool.execute(`UPDATE universities SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ status: 'success', message: 'University updated successfully' });
    } catch (error) {
        console.error('Update university error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update university: ' + error.message });
    }
}

module.exports = updateUniversityHandler;
