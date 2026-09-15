/**
 * Create University API
 * POST /api/createUniversity
 * Requires: admin role
 */

const { getPool } = require('./config');

async function createUniversityHandler(req, res) {
    const { name, city, country, lat, lng } = req.body || {};
    const user_role = req.role;

    if (!user_role || user_role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }

    if (!name || !name.trim()) {
        return res.status(400).json({ status: 'error', message: 'University name is required' });
    }

    const pool = getPool();

    try {
        // Generate ID
        const id = 'u' + Date.now() + Math.floor(Math.random() * 90) + 10;

        // Insert
        await pool.execute(
            'INSERT INTO universities (id, name, city, country, lat, lng) VALUES (?, ?, ?, ?, ?, ?)',
            [
                id,
                name.trim(),
                city || '',
                country || 'Ghana',
                lat !== undefined && lat !== null && lat !== '' ? Number(lat) : null,
                lng !== undefined && lng !== null && lng !== '' ? Number(lng) : null
            ]
        );

        res.json({ status: 'success', id: id });

    } catch (error) {
        console.error('Create university error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create university' });
    }
}

module.exports = createUniversityHandler;
