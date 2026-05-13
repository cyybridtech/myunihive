/**
 * Get Hostels API
 * GET /api/getHostels
 */

const { getPool } = require('./config');

async function getHostelsHandler(req, res) {
    const pool = getPool();

    try {
        const [hostels] = await pool.query(`
            SELECT 
                h.*,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(r.id) as review_count
            FROM hostels h
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
            return {
            id: h.id,
            name: h.name,
            universityId: h.university_id,
            address: h.address,
            description: h.description,
            // optional geo coords (map only renders when both exist)
            lat: h.lat ?? null,
            lng: h.lng ?? null,
            facilities: ['WiFi', 'Security'],
            distanceFromCampus: h.distance_from_campus,
            priceRange: h.price_range,
            mainImage: h.main_image,
            gallery: galleryImages,
            managerId: h.manager_id || null,
            subaccountCode: h.subaccount_code || null,
            commissionType: h.commission_type || 'split',
            platformFee: parseFloat(h.platform_fee) || 0,
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
