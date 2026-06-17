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
            // If status is approved, we perform overbooking checks and generate an auth_code if needed
            if (status === 'approved') {
                // Get the booking details and lock the room for update
                const [roomCheck] = await connection.execute(
                    `SELECT r.id, r.capacity, r.manual_occupancy 
                     FROM rooms r 
                     JOIN bookings b ON r.id = b.room_id 
                     WHERE b.id = ? 
                     FOR UPDATE`,
                    [booking_id]
                );

                if (roomCheck.length === 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ status: 'error', message: 'Room associated with booking not found' });
                }

                const roomId = roomCheck[0].id;
                const capacity = parseInt(roomCheck[0].capacity) || 1;
                const manualOccupancy = parseInt(roomCheck[0].manual_occupancy) || 0;

                // Count active bookings (paid or approved) excluding this booking
                const [occupancyCheck] = await connection.execute(
                    `SELECT COUNT(*) as count 
                     FROM bookings 
                     WHERE room_id = ? AND (payment_status = 'paid' OR status = 'approved') AND id != ?`,
                    [roomId, booking_id]
                );

                const currentOccupancy = (parseInt(occupancyCheck[0].count) || 0) + manualOccupancy;

                if (currentOccupancy >= capacity) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ status: 'error', message: 'Cannot approve booking: Room has reached full capacity.' });
                }

                // Generate auth code if it doesn't exist
                const authCode = 'UNH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                
                await connection.execute(
                    `UPDATE bookings SET status = ?, auth_code = COALESCE(auth_code, ?) WHERE id = ?`,
                    [status, authCode, booking_id]
                );

                // If room becomes full after this approval, set available = 0
                if (currentOccupancy + 1 >= capacity) {
                    await connection.execute(
                        `UPDATE rooms SET available = 0 WHERE id = ?`,
                        [roomId]
                    );
                }
            } else {
                // For other statuses, just update booking status
                await connection.execute(
                    'UPDATE bookings SET status = ? WHERE id = ?',
                    [status, booking_id]
                );
            }

            // If rejected, completed, or cancelled, make room available again
            if (['rejected', 'completed', 'cancelled'].includes(status)) {
                await connection.execute(
                    'UPDATE rooms r JOIN bookings b ON r.id = b.room_id SET r.available = 1 WHERE b.id = ?',
                    [booking_id]
                );
            }

            // Get details for notification
            const [details] = await connection.execute(
                `SELECT b.user_id, b.auth_code, h.name as hostel_name, r.room_number
                 FROM bookings b
                 LEFT JOIN hostels h ON b.hostel_id = h.id
                 LEFT JOIN rooms r ON b.room_id = r.id
                 WHERE b.id = ?`,
                [booking_id]
            );

            if (details.length > 0) {
                const { user_id: notifUserId, auth_code, hostel_name, room_number } = details[0];
                const title = status.charAt(0).toUpperCase() + status.slice(1) + ' Booking';
                const statusText = status === 'approved' ? 'Congratulations! Your booking for' : 'Your booking for';
                let message = `${statusText} ${hostel_name} (Room ${room_number}) has been ${status}.`;
                if (status === 'approved' && auth_code) {
                    message += ` Your secure check-in code is: ${auth_code}`;
                }

                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                     VALUES (?, ?, ?, 'booking', 0, CURDATE())`,
                    [notifUserId, title, message]
                );
            }

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
