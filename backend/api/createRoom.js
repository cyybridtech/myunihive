/**
 * Create Room API
 * POST /api/createRoom
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function createRoomHandler(req, res) {
    const { hostel_id, room_number, capacity, price, gender, type, image, description } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!user_role || !user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!hostel_id || !room_number || !price) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const pool = getPool();

    try {
        const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
        if (user_role !== 'admin' && !isManagerRole) {
            return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
        }

        if (isManagerRole) {
            const [hostels] = await pool.execute(
                'SELECT manager_id FROM hostels WHERE id = ?',
                [hostel_id]
            );
            if (hostels.length === 0 || hostels[0].manager_id != user_id) {
                return res.status(403).json({ status: 'error', message: 'Manager can only create rooms for their own hostels' });
            }
        }

        // Generate room ID
        const id = 'r' + Date.now() + Math.floor(Math.random() * 900) + 100;
        
        let gallery_json = null;
        if (req.body.gallery && Array.isArray(req.body.gallery)) {
            gallery_json = JSON.stringify(req.body.gallery);
        }

        let amenities_json = null;
        if (req.body.amenities) {
            try {
                const arr = req.body.amenities.split(',').map(f => f.trim()).filter(Boolean);
                amenities_json = JSON.stringify(arr);
            } catch (e) {
                console.error("Amenities parse error", e);
            }
        }

        // Insert room
        await pool.execute(
            `INSERT INTO rooms (id, hostel_id, room_number, capacity, price, available, gender, type, image, gallery, amenities, description) 
             VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
            [id, hostel_id, room_number, capacity || 1, price, gender || 'unisex', type || 'Standard', 
             image || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', gallery_json, amenities_json, description || null]
        );

        res.json({ status: 'success', id: id });

    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create room' });
    }
}

module.exports = createRoomHandler;
