/**
 * Reviews API
 * POST /api/reviews - Create review
 * GET /api/reviews - Get reviews for hostel
 */

const { getPool } = require('./config');

async function reviewsHandler(req, res) {
    const method = req.method || req.httpMethod;

    if (method === 'POST') {
        return createReview(req, res);
    } else if (method === 'GET' || method === undefined) {
        return getReviews(req, res);
    }

    res.status(405).json({ status: 'error', message: 'Only POST/GET allowed' });
}

async function createReview(req, res) {
    const { hostel_id, rating, comment } = req.body || {};
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!hostel_id || !rating) {
        return res.status(400).json({ status: 'error', message: 'Missing fields: hostel_id, rating(1-5)' });
    }

    const ratingNum = parseInt(rating);
    if (ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ status: 'error', message: 'Rating must be 1-5' });
    }

    const pool = getPool();

    try {
        // Check for duplicate review
        const [existing] = await pool.execute(
            'SELECT id FROM reviews WHERE user_id = ? AND hostel_id = ?',
            [user_id, hostel_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'You already reviewed this hostel' });
        }

        // Insert review
        const [result] = await pool.execute(
            `INSERT INTO reviews (user_id, hostel_id, rating, comment, review_date) VALUES (?, ?, ?, ?, CURDATE())`,
            [user_id, hostel_id, ratingNum, comment || '']
        );

        res.json({
            status: 'success',
            message: 'Review submitted',
            review_id: result.insertId
        });

    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to save review' });
    }
}

async function getReviews(req, res) {
    const hostel_id = req.body?.hostel_id || req.query?.hostel_id;

    if (!hostel_id) {
        return res.status(400).json({ status: 'error', message: 'hostel_id required' });
    }

    const pool = getPool();

    try {
        const [reviews] = await pool.execute(
            `SELECT r.*, u.full_name as user_name, SUBSTRING(u.email, 1, 1) as user_avatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.hostel_id = ?
             ORDER BY r.id DESC`,
            [hostel_id]
        );

        res.json({ status: 'success', reviews: reviews });

    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = reviewsHandler;
