const { getPool } = require('./config');

async function deleteBookingHandler(req, res) {
  const { booking_id } = req.body || {};
  const user_id = req.user_id;

  if (!booking_id) {
    return res.status(400).json({ status: 'error', message: 'Missing booking ID' });
  }
  if (!user_id) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  const pool = getPool();

  try {
    const [rows] = await pool.execute(
      `SELECT user_id, room_id, status, payment_status FROM bookings WHERE id = ?`,
      [booking_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    }

    const booking = rows[0];
    if (String(booking.user_id) !== String(user_id)) {
      return res.status(403).json({ status: 'error', message: 'You can only cancel your own bookings' });
    }

    if (booking.payment_status === 'paid' || booking.status === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Cannot cancel a paid booking' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        `DELETE FROM bookings WHERE id = ?`,
        [booking_id]
      );

      // Recalculate room availability
      const [roomStats] = await connection.execute(
          `SELECT r.capacity, r.manual_occupancy,
           (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND b.id != ? AND (b.status = 'approved' OR b.payment_status = 'paid')) as app_occupancy
           FROM rooms r WHERE r.id = ?`,
          [booking_id, booking.room_id]
      );
      if (roomStats.length > 0) {
          const r = roomStats[0];
          const isFull = (parseInt(r.app_occupancy) + parseInt(r.manual_occupancy)) >= parseInt(r.capacity);
          await connection.execute('UPDATE rooms SET available = ? WHERE id = ?', [isFull ? 0 : 1, booking.room_id]);
      }

      await connection.commit();
      connection.release();

      res.json({ status: 'success', message: 'Booking cancelled successfully' });
    } catch (innerError) {
      await connection.rollback();
      connection.release();
      throw innerError;
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
  }
}

module.exports = deleteBookingHandler;
