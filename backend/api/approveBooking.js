/**
 * Approve Booking API
 * POST /api/approveBooking
 * Requires: admin or manager role
 */

const { getPool } = require('./config');

async function approveBookingHandler(req, res) {
    const { booking_id, status } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;

    if (!booking_id || !status) {
        return res.status(400).json({ status: 'error', message: 'Invalid booking_id or status' });
    }

    if (!user_id || !user_role) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
    if (user_role !== 'admin' && !isManagerRole) {
        return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
    }

    // Validate status
    const validStatuses = ['approved', 'rejected', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    // Managers can only confirm completed bookings
    if (isManagerRole && status !== 'completed') {
        return res.status(403).json({ status: 'error', message: 'Hostel manager can only confirm completed bookings' });
    }

    const pool = getPool();

    try {
        // Check manager's permission for this booking
        if (isManagerRole && status === 'completed') {
            const [bookings] = await pool.execute(
                `SELECT h.manager_id, b.status FROM bookings b 
                 JOIN hostels h ON b.hostel_id = h.id 
                 WHERE b.id = ?`,
                [booking_id]
            );

            if (bookings.length === 0 || bookings[0].manager_id != user_id) {
                return res.status(403).json({ status: 'error', message: 'Booking not found for this manager' });
            }
            if (bookings[0].status !== 'approved') {
                return res.status(400).json({ status: 'error', message: 'Only approved bookings can be confirmed' });
            }
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Get booking and room details first
            const [bookingDetails] = await connection.execute(
                `SELECT b.*, r.id as room_id, r.room_number, r.capacity, r.manual_occupancy, h.name as hostel_name
                 FROM bookings b
                 JOIN rooms r ON b.room_id = r.id
                 JOIN hostels h ON b.hostel_id = h.id
                 WHERE b.id = ? FOR UPDATE`,
                [booking_id]
            );

            if (bookingDetails.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ status: 'error', message: 'Booking not found' });
            }

            const booking = bookingDetails[0];
            let authCode = booking.auth_code;

            // Generate auth_code if approving and none exists
            if (status === 'approved' && !authCode) {
                authCode = 'UNH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            }

            // Update booking status
            await connection.execute(
                'UPDATE bookings SET status = ?, auth_code = ? WHERE id = ?',
                [status, authCode, booking_id]
            );

            // Update room availability based on REAL occupancy
            const [occResult] = await connection.execute(
                "SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND (payment_status = 'paid' OR status = 'approved')",
                [booking.room_id]
            );
            const totalOccupancy = (parseInt(occResult[0].count) || 0) + (parseInt(booking.manual_occupancy) || 0);
            const isAvailable = totalOccupancy < (parseInt(booking.capacity) || 1);

            await connection.execute(
                'UPDATE rooms SET available = ? WHERE id = ?',
                [isAvailable ? 1 : 0, booking.room_id]
            );

            // Notifications
            const title = status.charAt(0).toUpperCase() + status.slice(1) + ' Booking';
            const statusText = status === 'approved' ? 'Congratulations! Your booking for' : 'Your booking for';
            let message = `${statusText} ${booking.hostel_name} (Room ${booking.room_number}) has been ${status}.`;
            if (status === 'approved' && authCode) {
                message += ` Security Code: ${authCode}`;
            }

            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                 VALUES (?, ?, ?, 'booking', 0, CURDATE())`,
                [booking.user_id, title, message]
            );

            await connection.commit();
            connection.release();

            res.json({
                status: 'success',
                message: `Booking ${status} successfully`,
                booking_id: booking_id
            });

        } catch (innerError) {
            await connection.rollback();
            connection.release();
            throw innerError;
        }

    } catch (error) {
        console.error('Approve booking error:', error);
        res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
    }
}

module.exports = approveBookingHandler;
