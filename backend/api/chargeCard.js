/**
 * Charge Saved Card API
 * POST /api/chargeCard
 * Charges the user's saved Paystack authorization_code directly (no popup needed)
 * Body: { booking_id }
 */

const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const { sendBookingEmail } = require('./sendEmail');
const https = require('https');

async function chargeCardHandler(req, res) {
    const { booking_id } = req.body || {};
    const user_id = req.user_id;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    if (!booking_id) {
        return res.status(400).json({ status: 'error', message: 'booking_id is required' });
    }
    if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'YOUR_PAYSTACK_SECRET_KEY') {
        return res.status(500).json({ status: 'error', message: 'Paystack not configured' });
    }

    const pool = getPool();

    try {
        // Fetch the booking and the user's saved card
        const [[bookingRows], [cardRows]] = await Promise.all([
            pool.execute(
                `SELECT b.id, b.total_price, b.payment_status, b.room_id, b.hostel_id, b.paystack_reference,
                        u.email as user_email, u.full_name,
                        r.room_number, r.type as room_type, r.capacity, r.manual_occupancy,
                        h.name as hostel_name, h.subaccount_code, h.manager_id
                 FROM bookings b
                 JOIN users u ON b.user_id = u.id
                 JOIN rooms r ON b.room_id = r.id
                 JOIN hostels h ON b.hostel_id = h.id
                 WHERE b.id = ? AND b.user_id = ?`,
                [booking_id, user_id]
            ),
            pool.execute(
                `SELECT authorization_code, email FROM saved_cards WHERE user_id = ? LIMIT 1`,
                [user_id]
            )
        ]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }
        if (cardRows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No saved card found. Please pay with a new card first.' });
        }

        const booking = bookingRows[0];
        const card = cardRows[0];

        if (booking.payment_status === 'paid') {
            return res.json({ status: 'success', message: 'Booking is already paid' });
        }

        // Use stored paystack_reference or generate one
        const reference = booking.paystack_reference || `UNH-RECHARGE-${booking_id}-${Date.now()}`;
        const amountInPesewas = Math.round(Number(booking.total_price) * 100);

        // Charge the authorization via Paystack API
        const chargePayload = JSON.stringify({
            authorization_code: card.authorization_code,
            email: card.email,
            amount: amountInPesewas,
            currency: 'GHS',
            reference,
            ...(booking.subaccount_code ? { subaccount: booking.subaccount_code } : {})
        });

        const chargeResult = await makePaystackRequest('/transaction/charge_authorization', 'POST', chargePayload);

        if (!chargeResult || chargeResult.status !== true || chargeResult.data?.status !== 'success') {
            const errMsg = chargeResult?.message || 'Card charge failed';
            return res.status(400).json({ status: 'error', message: errMsg });
        }

        // Payment succeeded — run the same approval flow as verifyPayment
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [roomLock] = await connection.execute(
                `SELECT id, capacity, manual_occupancy FROM rooms WHERE id = ? FOR UPDATE`,
                [booking.room_id]
            );
            const [occupancyResult] = await connection.execute(
                `SELECT COUNT(*) as count FROM bookings 
                 WHERE room_id = ? AND (status = 'approved' OR (payment_status = 'paid' AND status NOT IN ('cancelled', 'rejected', 'completed', 'expired'))) AND id != ?`,
                [booking.room_id, booking_id]
            );

            const currentOccupancy = (parseInt(occupancyResult[0].count) || 0) + (parseInt(roomLock[0]?.manual_occupancy) || 0);
            const capacity = parseInt(roomLock[0]?.capacity) || 1;

            let finalStatus = currentOccupancy < capacity ? 'approved' : 'pending';
            let authCode = finalStatus === 'approved'
                ? ('UNH-' + Math.random().toString(36).substring(2, 8).toUpperCase())
                : null;

            await connection.execute(
                `UPDATE bookings SET payment_status = 'paid', status = ?, auth_code = ?, paystack_reference = ? WHERE id = ?`,
                [finalStatus, authCode, reference, booking_id]
            );

            if (finalStatus === 'approved') {
                if (currentOccupancy + 1 >= capacity) {
                    await connection.execute(`UPDATE rooms SET available = 0 WHERE id = ?`, [booking.room_id]);
                }
                const receiptAmount = Number(booking.total_price || 0).toFixed(2);
                const notifMsg = `Payment confirmed (saved card) for booking #${booking_id}. Hostel: ${booking.hostel_name}. Room: ${booking.room_number}. Amount: GH₵${receiptAmount}. Code: ${authCode}`;
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                     VALUES (?, 'Payment Confirmed - Saved Card', ?, 'payment', 0, CURDATE())`,
                    [user_id, notifMsg]
                );
                if (booking.manager_id) {
                    await connection.execute(
                        `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                         VALUES (?, 'New Paid Booking', ?, 'booking', 0, CURDATE())`,
                        [booking.manager_id, `Paid booking from ${booking.full_name} for Room ${booking.room_number} at ${booking.hostel_name}. Code: ${authCode}`]
                    );
                }
            } else {
                await connection.execute(`UPDATE rooms SET available = 0 WHERE id = ?`, [booking.room_id]);
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                     VALUES (?, 'Payment Received - Room Full', ?, 'payment', 0, CURDATE())`,
                    [user_id, `Payment received for booking #${booking_id} but the room is now full. Pending manager review.`]
                );
            }

            await connection.commit();
            connection.release();

            // Send email
            if (finalStatus === 'approved' && booking.user_email) {
                try {
                    await sendBookingEmail(booking.user_email, booking.full_name, booking_id, booking.room_number, booking.hostel_name, authCode);
                } catch (e) {
                    console.error('Email failed after saved card charge:', e.message);
                }
            }

            return res.json({
                status: finalStatus === 'approved' ? 'success' : 'overbooked',
                message: finalStatus === 'approved'
                    ? 'Payment via saved card successful!'
                    : 'Payment received but room is full. Booking placed as pending.',
                authCode,
            });

        } catch (innerErr) {
            await connection.rollback();
            connection.release();
            throw innerErr;
        }

    } catch (error) {
        console.error('chargeCard error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

function makePaystackRequest(endpoint, method, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            path: endpoint,
            method,
            headers: {
                'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

module.exports = chargeCardHandler;
