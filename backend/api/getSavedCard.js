/**
 * Get Saved Card API
 * GET /api/getSavedCard
 * Returns the authenticated user's saved card (masked details only — no authorization_code)
 */

const { getPool } = require('./config');

async function getSavedCardHandler(req, res) {
    const user_id = req.user_id;
    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();
    try {
        const [rows] = await pool.execute(
            `SELECT card_type, last4, exp_month, exp_year FROM saved_cards WHERE user_id = ? LIMIT 1`,
            [user_id]
        );

        if (rows.length === 0) {
            return res.json({ status: 'success', card: null });
        }

        return res.json({ status: 'success', card: rows[0] });
    } catch (error) {
        console.error('getSavedCard error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getSavedCardHandler;
