/**
 * Platform Stats API
 * GET /api/stats
 * Public endpoint returning real aggregate counts for homepage & counters
 */

const { getPool } = require('./config');

async function statsHandler(req, res) {
    const pool = getPool();

    try {
        const [[userCount]] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [[hostelCount]] = await pool.execute('SELECT COUNT(*) as count FROM hostels WHERE verified = 1 OR verified IS NULL');
        const [[uniCount]] = await pool.execute('SELECT COUNT(*) as count FROM universities');
        const [[bookingCount]] = await pool.execute('SELECT COUNT(*) as count FROM bookings');

        const students = Number(userCount?.count || 0);
        const hostels = Number(hostelCount?.count || 0);
        const universities = Number(uniCount?.count || 0);
        const bookings = Number(bookingCount?.count || 0);

        res.json({
            status: 'success',
            stats: {
                students,
                hostels,
                universities,
                bookings
            }
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch platform stats' });
    }
}

module.exports = statsHandler;
