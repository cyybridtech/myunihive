/**
 * Bookings API
 * POST /api/bookings - Create booking
 * GET /api/bookings - Get user's bookings
 */

const { getPool } = require('./config');

async function bookingsHandler(req, res) {
    const method = req.method || req.httpMethod;

    if (method === 'POST') {
        return createBooking(req, res);
    } else if (method === 'GET' || method === undefined) {
        return getUserBookings(req, res);
    }

    res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

async function createBooking(req, res) {
    const {
        room_id: roomIdSnake,
        hostel_id: hostelIdSnake,
        booking_date: bookingDateSnake,
        roomId: roomIdCamel,
        hostelId: hostelIdCamel,
        bookingDate: bookingDateCamel,
    } = req.body || {};

    const room_id_raw = roomIdSnake ?? roomIdCamel;
    const hostel_id_raw = hostelIdSnake ?? hostelIdCamel;
    const booking_date_raw = bookingDateSnake ?? bookingDateCamel;
    const room_id = room_id_raw !== undefined && room_id_raw !== null ? String(room_id_raw).trim() : '';
    const hostel_id = hostel_id_raw !== undefined && hostel_id_raw !== null ? String(hostel_id_raw).trim() : '';
    const bookingDate = booking_date_raw || new Date().toISOString().split('T')[0];
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!room_id || !hostel_id) {
        console.warn('Create booking missing required fields', { body: req.body });
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const pool = getPool();

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [rooms] = await connection.execute(
                'SELECT available, price FROM rooms WHERE id = ? FOR UPDATE',
                [room_id]
            );

            if (rooms.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ status: 'error', message: 'Room not found' });
            }

            if (!rooms[0].available) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ status: 'error', message: 'Sorry, this room has just been booked by someone else.' });
            }

            const [hostels] = await connection.execute(
                'SELECT name, platform_fee FROM hostels WHERE id = ?',
                [hostel_id]
            );
            const hostelRecord = hostels[0] || {};
            const hostelName = hostelRecord.name || 'your hostel';
            const platformFee = parseFloat(hostelRecord.platform_fee || 0);

            const roomPrice = parseFloat(rooms[0].price);
            const totalAmount = roomPrice + platformFee;

            // Do not mark room as unavailable here. It will be marked unavailable in verifyPayment when capacity is reached.

            const [result] = await connection.execute(
                `INSERT INTO bookings (user_id, room_id, hostel_id, booking_date, status, payment_status, reservation_fee, total_price) 
                 VALUES (?, ?, ?, ?, 'pending', 'unpaid', ?, ?)`,
                [user_id, room_id, hostel_id, bookingDate, totalAmount, totalAmount]
            );

            const booking_id = result.insertId;

            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                 VALUES (?, ?, ?, 'booking', 0, CURDATE())`,
                [user_id, 'Booking Created', `Your booking for ${hostelName} (GH₵${totalAmount.toFixed(2)}) has been created. Complete payment to secure your room.`]
            );

            await connection.commit();
            connection.release();

            res.json({
                status: 'success',
                message: `Booking created for GH₵${totalAmount.toFixed(2)}`,
                booking_id: booking_id
            });

        } catch (innerError) {
            await connection.rollback();
            connection.release();
            throw innerError;
        }
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
    }
}

async function getUserBookings(req, res) {
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const pool = getPool();

    try {
        const [bookings] = await pool.execute(
            `SELECT b.*, h.name as hostel_name, r.room_number as roomNumber, r.type as room_type
             FROM bookings b
             LEFT JOIN hostels h ON b.hostel_id = h.id
             LEFT JOIN rooms r ON b.room_id = r.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [user_id]
        );

        res.json({ status: 'success', bookings: bookings });

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = bookingsHandler;
