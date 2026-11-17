/**
 * Verify Payment API
 * POST /api/verifyPayment
 * Verifies Paystack payment and auto-approves booking
 */

const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const { sendBookingEmail } = require('./sendEmail');
const https = require('https');
const crypto = require('crypto');

async function verifyPaymentHandler(req, res) {
    const { reference, booking_id } = req.body || {};

    if (!reference || !booking_id) {
        return res.status(400).json({ status: 'error', message: 'Missing reference or booking ID' });
    }

    const pool = getPool();

    if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'YOUR_PAYSTACK_SECRET_KEY') {
        return res.status(500).json({ status: 'error', message: 'Paystack secret key is not configured' });
    }

    try {
        // Verify with Paystack
        const paystackResult = await makePaystackRequest('/transaction/verify/' + encodeURIComponent(reference), 'GET');

        if (!paystackResult || paystackResult.status !== true || paystackResult.data.status !== 'success') {
            console.error('Paystack verification response:', paystackResult);
            return res.status(400).json({ status: 'error', message: 'Payment verification failed' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [bookings] = await connection.execute(
                `SELECT b.user_id, b.room_id, b.hostel_id, b.payment_status, b.auth_code, b.total_price, u.email as user_email, u.full_name, u.gender as user_gender, r.room_number, r.type as room_type, h.name as hostel_name, h.manager_id
                 FROM bookings b
                 JOIN users u ON b.user_id = u.id
                 JOIN rooms r ON b.room_id = r.id
                 JOIN hostels h ON b.hostel_id = h.id
                 WHERE b.id = ?
                 FOR UPDATE`,
                [booking_id]
            );

            if (bookings.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ status: 'error', message: 'Booking details not found' });
            }

            const details = bookings[0];
            const user_id = req.user_id;
            const user_role = req.role;

            if (!user_id || !user_role) {
                await connection.rollback();
                connection.release();
                return res.status(401).json({ status: 'error', message: 'Authentication required' });
            }

            if (String(details.user_id) !== String(user_id) && user_role !== 'admin') {
                await connection.rollback();
                connection.release();
                return res.status(403).json({ status: 'error', message: 'You are not authorized to verify this booking' });
            }

            const expectedAmountInPesewas = Math.round(Number(details.total_price) * 100);
            const paidAmount = Number(paystackResult.data.amount);

            if (paidAmount < expectedAmountInPesewas) {
                console.error(`Insufficient amount paid. Expected: ${expectedAmountInPesewas}, Paid: ${paidAmount}`);
                await connection.rollback();
                connection.release();
                return res.status(400).json({ status: 'error', message: 'Payment verification failed: insufficient amount paid' });
            }

            if (details.payment_status === 'paid') {
                await connection.rollback();
                connection.release();
                return res.json({
                    status: 'success',
                    message: 'Booking is already paid and verified',
                    authCode: details.auth_code || null,
                    roomDetails: { number: details.room_number, type: details.room_type }
                });
            }

            // Lock room record for update
            const [roomLock] = await connection.execute(
                `SELECT id, capacity, manual_occupancy FROM rooms WHERE id = ? FOR UPDATE`,
                [details.room_id]
            );

            if (roomLock.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ status: 'error', message: 'Room associated with booking not found' });
            }

            // Count bookings already paid or approved for this room
            const [occupancyResult] = await connection.execute(
                `SELECT COUNT(*) as count 
                 FROM bookings 
                 WHERE room_id = ? AND (status = 'approved' OR (payment_status = 'paid' AND status NOT IN ('cancelled', 'rejected', 'completed', 'expired'))) AND id != ?`,
                [details.room_id, booking_id]
            );

            const currentOccupancy = (parseInt(occupancyResult[0].count) || 0) + (parseInt(roomLock[0].manual_occupancy) || 0);
            const capacity = parseInt(roomLock[0].capacity) || 1;

            let finalStatus = 'approved';
            let authCode = details.auth_code;

            if (currentOccupancy >= capacity) {
                // Gracefully transition to pending due to overbooking
                finalStatus = 'pending';
                authCode = null;
            } else {
                if (!authCode) {
                    authCode = 'UNH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
                }
            }

            await connection.execute(
                `UPDATE bookings SET payment_status = 'paid', status = ?, auth_code = ? WHERE id = ?`,
                [finalStatus, authCode, booking_id]
            );

            // Sync room availability
            if (finalStatus === 'approved') {
                if (currentOccupancy + 1 >= capacity) {
                    await connection.execute(
                        `UPDATE rooms SET available = 0 WHERE id = ?`,
                        [details.room_id]
                    );
                }
            } else {
                // Room is full, make sure available is set to 0
                await connection.execute(
                    `UPDATE rooms SET available = 0 WHERE id = ?`,
                    [details.room_id]
                );
            }

            const receiptAmount = Number(details.total_price || 0).toFixed(2);
            if (finalStatus === 'approved') {
                const notifMsg = `Payment confirmed for booking #${booking_id}. Hostel: ${details.hostel_name}. Room: ${details.room_number} (${details.room_type}). Amount: GH₵${receiptAmount}. Security Code: ${authCode}`;
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                     VALUES (?, 'Payment Receipt - Booking Confirmed', ?, 'payment', 0, CURDATE())`,
                    [details.user_id, notifMsg]
                );

                if (details.manager_id) {
                    const managerMsg = `New paid booking from ${details.full_name} (${details.user_gender}) for room ${details.room_number} at ${details.hostel_name}. Code: ${authCode}.`;
                    await connection.execute(
                        `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                         VALUES (?, 'New Paid Booking', ?, 'booking', 0, CURDATE())`,
                        [details.manager_id, managerMsg]
                    );
                }
            } else {
                const notifMsg = `Payment received for booking #${booking_id} (Hostel: ${details.hostel_name}, Room: ${details.room_number}). However, the room has reached full capacity. Your booking is pending manager review or refund.`;
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                     VALUES (?, 'Payment Received - Room Full', ?, 'payment', 0, CURDATE())`,
                    [details.user_id, notifMsg]
                );

                if (details.manager_id) {
                    const managerMsg = `Overbooked Payment received from ${details.full_name} for room ${details.room_number} at ${details.hostel_name} (Booking #${booking_id}). The room is full. Action required: Refund or manual reallocation.`;
                    await connection.execute(
                        `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date) 
                         VALUES (?, 'Overbooked Booking Alert', ?, 'booking', 0, CURDATE())`,
                        [details.manager_id, managerMsg]
                    );
                }
            }

            await connection.commit();
            connection.release();

            // Save card authorization for future one-click payments
            try {
                const auth = paystackResult.data?.authorization;
                if (auth && auth.authorization_code && auth.channel === 'card') {
                    await pool.execute(
                        `INSERT INTO saved_cards (user_id, authorization_code, card_type, last4, exp_month, exp_year, email)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                           authorization_code = VALUES(authorization_code),
                           card_type = VALUES(card_type),
                           last4 = VALUES(last4),
                           exp_month = VALUES(exp_month),
                           exp_year = VALUES(exp_year),
                           email = VALUES(email)`,
                        [
                            details.user_id,
                            auth.authorization_code,
                            auth.card_type || null,
                            auth.last4 || null,
                            auth.exp_month || null,
                            auth.exp_year || null,
                            paystackResult.data.customer?.email || details.user_email
                        ]
                    );
                }
            } catch (cardErr) {
                console.warn('[PAYMENT] Could not save card authorization:', cardErr.message);
            }

            if (!details.user_email) {
                console.error('[BOOKING] Missing user_email for booking:', booking_id);
            } else {
                try {
                    if (finalStatus === 'approved') {
                        await sendBookingEmail(details.user_email, details.full_name, booking_id, details.room_number, details.hostel_name, authCode);
                    }
                } catch (err) {
                    console.error('[BOOKING] Booking confirmation email failed:', err && err.message ? err.message : err);
                }
            }

            if (finalStatus === 'approved') {
                return res.json({
                    status: 'success',
                    message: 'Payment verified and booking automatically approved',
                    authCode: authCode,
                    roomDetails: {
                        number: details.room_number,
                        type: details.room_type
                    }
                });
            } else {
                return res.json({
                    status: 'overbooked',
                    message: 'Payment verified but room capacity was reached. Booking is placed as pending for review.',
                    authCode: null,
                    roomDetails: {
                        number: details.room_number,
                        type: details.room_type
                    }
                });
            }
        } catch (innerError) {
            await connection.rollback();
            connection.release();
            throw innerError;
        }

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
    }
}

/**
 * Helper to make Paystack API request
 */
function makePaystackRequest(endpoint, method, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                'Cache-Control': 'no-cache'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

module.exports = verifyPaymentHandler;
