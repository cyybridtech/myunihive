/**
 * Get Universities API
 * GET /api/getUniversities
 */

const { getPool } = require('./config');

async function getUniversitiesHandler(req, res) {
    const pool = getPool();

    try {
        const [universities] = await pool.execute('SELECT * FROM universities ORDER BY name ASC');
        res.json({ status: 'success', universities: universities });

    } catch (error) {
        console.error('Get universities error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getUniversitiesHandler;
