/**
 * Get Hostels API
 * GET /api/getHostels
 */

const { getPool } = require('./config');

async function getHostelsHandler(req, res) {
    const pool = getPool();
    const user_id = req.user_id;
    const user_role = req.role;

    try {
        let paidHostelIds = new Set();
        if (user_id) {
            const [userBookings] = await pool.execute(
                `SELECT DISTINCT hostel_id FROM bookings WHERE user_id = ? AND (payment_status = 'paid' OR status = 'approved')`,
                [user_id]
            );
            userBookings.forEach(b => paidHostelIds.add(String(b.hostel_id)));
        }
        const isStaff = user_role === 'admin' || user_role === 'manager' || user_role === 'hostel_manager';

        const [hostels] = await pool.query(`
            SELECT 
                h.*,
                MAX(u.phone) as manager_phone,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(r.id) as review_count
            FROM hostels h
            LEFT JOIN users u ON h.manager_id = u.id
            LEFT JOIN reviews r ON h.id = r.hostel_id
            GROUP BY h.id
        `);

        // Transform to camelCase response format
        const transformed = hostels.map(h => {
            let galleryImages = [h.main_image];
            if (h.gallery) {
                try {
                    const parsed = typeof h.gallery === 'string' ? JSON.parse(h.gallery) : h.gallery;
                    if (Array.isArray(parsed)) galleryImages = parsed;
                } catch (e) {}
            }
            let parsedFacilities = [];
            if (h.facilities) {
                try {
                    parsedFacilities = typeof h.facilities === 'string' 
                        ? (h.facilities.startsWith('[') ? JSON.parse(h.facilities) : h.facilities.split(',').map(f => f.trim()))
                        : h.facilities;
                } catch(e) {
                    parsedFacilities = typeof h.facilities === 'string' ? h.facilities.split(',').map(f => f.trim()) : [];
                }
            }

            const hasConfirmedBooking = paidHostelIds.has(String(h.id));
            const showDirectContact = isStaff || hasConfirmedBooking;

            return {
            id: h.id,
            name: h.name,
            universityId: h.university_id,
            address: h.address,
            description: h.description,
            // optional geo coords (map only renders when both exist)
            lat: h.lat ?? null,
            lng: h.lng ?? null,
            facilities: Array.isArray(parsedFacilities) ? parsedFacilities : [],
            distanceFromCampus: h.distance_from_campus,
            priceRange: h.price_range,
            mainImage: h.main_image,
            gallery: galleryImages,
            managerId: h.manager_id || null,
            managerPhone: showDirectContact ? (h.manager_phone || null) : null,
            hasConfirmedBooking,
            subaccountCode: h.subaccount_code || null,
            commissionType: h.commission_type || 'split',
            platformFee: parseFloat(h.platform_fee) || 0,
            paymentPeriod: h.payment_period || 'semester',
            verified: Boolean(h.verified),
            rating: parseFloat(h.rating) || 0,
            reviewCount: parseInt(h.review_count) || 0
        };
        });

        res.json({ status: 'success', hostels: transformed });

    } catch (error) {
        console.error('Get hostels error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getHostelsHandler;
