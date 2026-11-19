/**
 * Get Payout Stats API
 * GET /api/getPayoutStats
 * Manager-only: Returns revenue summary and transaction history for the manager's hostels
 */

const { getPool } = require('./config');
const { getBankNameByCode } = require('./paystackBanks');

async function getPayoutStatsHandler(req, res) {
    const user_id = req.user_id;
    const role = req.role;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (role !== 'manager' && role !== 'hostel_manager' && role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Manager access required' });
    }

    const pool = getPool();

    try {
        // Get all hostels managed by this user (or all hostels if admin)
        const [hostels] = role === 'admin'
            ? await pool.execute(
                `SELECT id, name, subaccount_code, bank_name, account_number, platform_fee, commission_type FROM hostels ORDER BY name ASC`
            )
            : await pool.execute(
                `SELECT id, name, subaccount_code, bank_name, account_number, platform_fee, commission_type FROM hostels WHERE manager_id = ?`,
                [String(user_id)]
            );

        if (hostels.length === 0) {
            return res.json({
                status: 'success',
                summary: { totalEarned: 0, thisMonth: 0, lastMonth: 0, pendingSettlement: 0, totalBookings: 0 },
                transactions: [],
                hostels: []
            });
        }

        const hostelIds = hostels.map(h => h.id);
        const hostelIdPlaceholders = hostelIds.map(() => '?').join(',');

        // Total earned (all paid bookings)
        const [totalResult] = await pool.execute(
            `SELECT 
                COALESCE(SUM(b.total_price), 0) as total_earned,
                COUNT(*) as total_bookings
             FROM bookings b
             WHERE b.hostel_id IN (${hostelIdPlaceholders})
               AND b.payment_status = 'paid'`,
            hostelIds
        );

        // This month earnings
        const [thisMonthResult] = await pool.execute(
            `SELECT COALESCE(SUM(b.total_price), 0) as amount
             FROM bookings b
             WHERE b.hostel_id IN (${hostelIdPlaceholders})
               AND b.payment_status = 'paid'
               AND MONTH(b.created_at) = MONTH(CURDATE())
               AND YEAR(b.created_at) = YEAR(CURDATE())`,
            hostelIds
        );

        // Last month earnings
        const [lastMonthResult] = await pool.execute(
            `SELECT COALESCE(SUM(b.total_price), 0) as amount
             FROM bookings b
             WHERE b.hostel_id IN (${hostelIdPlaceholders})
               AND b.payment_status = 'paid'
               AND MONTH(b.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
               AND YEAR(b.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`,
            hostelIds
        );

        // Last 24h — funds still potentially in Paystack T+1 hold
        const [pendingResult] = await pool.execute(
            `SELECT COALESCE(SUM(b.total_price), 0) as amount
             FROM bookings b
             WHERE b.hostel_id IN (${hostelIdPlaceholders})
               AND b.payment_status = 'paid'
               AND b.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            hostelIds
        );

        // Transaction history (last 60 bookings)
        const [transactions] = await pool.execute(
            `SELECT 
                b.id as booking_id,
                b.total_price,
                b.payment_status,
                b.status,
                b.created_at,
                b.auth_code,
                h.name as hostel_name,
                h.platform_fee,
                h.commission_type,
                r.room_number,
                r.type as room_type,
                u.full_name as student_name
             FROM bookings b
             LEFT JOIN hostels h ON b.hostel_id = h.id
             LEFT JOIN rooms r ON b.room_id = r.id
             LEFT JOIN users u ON b.user_id = u.id
             WHERE b.hostel_id IN (${hostelIdPlaceholders})
               AND b.payment_status = 'paid'
             ORDER BY b.created_at DESC
             LIMIT 60`,
            hostelIds
        );

        // Calculate net per transaction (total_price - platform_fee for flat, or just total_price for split where Paystack handles it)
        const enrichedTransactions = transactions.map(t => {
            const gross = parseFloat(t.total_price) || 0;
            const platformFee = t.commission_type === 'flat' ? (parseFloat(t.platform_fee) || 0) : 0;
            const net = gross - platformFee;
            return { ...t, gross, platform_fee_deducted: platformFee, net_to_manager: net };
        });

        return res.json({
            status: 'success',
            summary: {
                totalEarned: parseFloat(totalResult[0].total_earned) || 0,
                totalBookings: parseInt(totalResult[0].total_bookings) || 0,
                thisMonth: parseFloat(thisMonthResult[0].amount) || 0,
                lastMonth: parseFloat(lastMonthResult[0].amount) || 0,
                pendingSettlement: parseFloat(pendingResult[0].amount) || 0,
            },
            transactions: enrichedTransactions,
            hostels: hostels.map(h => ({
                id: h.id,
                name: h.name,
                subaccount_code: h.subaccount_code,
                bank_name: h.bank_name,
                bank_display_name: getBankNameByCode(h.bank_name),
                account_number: h.account_number ? '••••' + String(h.account_number).slice(-4) : null,
                commission_type: h.commission_type,
                platform_fee: h.platform_fee,
            }))
        });

    } catch (error) {
        console.error('getPayoutStats error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getPayoutStatsHandler;
