/**
 * Get Rooms API
 * GET /api/getRooms
 */

const { getPool } = require('./config');

async function getRoomsHandler(req, res) {
    const pool = getPool();

    try {
        const [rooms] = await pool.execute(`
            SELECT r.*, 
            (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND (b.status = 'approved' OR b.payment_status = 'paid')) as app_occupancy
            FROM rooms r
        `);

        // Transform to camelCase response format
        const transformed = rooms.map(r => {
            const capacity = parseInt(r.capacity);
            const appOccupancy = parseInt(r.app_occupancy) || 0;
            const manualOccupancy = parseInt(r.manual_occupancy) || 0;
            const totalOccupancy = appOccupancy + manualOccupancy;
            
            let galleryImages = [r.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'];
            if (r.gallery) {
                try {
                    const parsed = typeof r.gallery === 'string' ? JSON.parse(r.gallery) : r.gallery;
                    if (Array.isArray(parsed)) galleryImages = parsed;
                } catch(e){}
            }

            return {
                id: r.id,
                hostelId: r.hostel_id,
                roomNumber: r.room_number,
                capacity: capacity,
                price: parseFloat(r.price),
                available: Boolean(r.available) && (totalOccupancy < capacity),
                occupancy: totalOccupancy,
                manualOccupancy: manualOccupancy,
                gender: r.gender || 'unisex',
                description: (r.type || 'Standard') + ' room',
                image: r.image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
                gallery: galleryImages,
                type: r.type
            };
        });

        res.json({ status: 'success', rooms: transformed });

    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = getRoomsHandler;
