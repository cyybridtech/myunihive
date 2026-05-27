/**
 * Verify Payment API
 * POST /api/verifyPayment
 * Verifies Paystack payment and auto-approves booking
 */

const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const { sendBookingEmail } = require('./sendEmail');
const https = require('https');

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
            // Lock the booking and associated room/hostel/user info
            const [bookings] = await connection.execute(
                `SELECT b.user_id, b.room_id, b.payment_status, b.auth_code, b.total_price,
                        u.email as user_email, u.full_name, u.gender as user_gender,
                        r.room_number, r.type as room_type, r.capacity, r.manual_occupancy,
                        h.name as hostel_name, h.manager_id
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

            // --- CAPACITY CHECK (CRITICAL FOR RACE CONDITIONS) ---
            // Lock all relevant bookings for this room to get accurate count
            const [occupancyResult] = await connection.execute(
                "SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND (payment_status = 'paid' OR status = 'approved') FOR UPDATE",
                [details.room_id]
            );

            const currentAppOccupancy = parseInt(occupancyResult[0].count) || 0;
            const currentManualOccupancy = parseInt(details.manual_occupancy) || 0;
            const totalOccupancy = currentAppOccupancy + currentManualOccupancy;
            const capacity = parseInt(details.capacity) || 1;

            if (totalOccupancy >= capacity) {
                // Room is full! Mark as paid but keep status pending for manual resolution/refund
                await connection.execute(
                    `UPDATE bookings SET payment_status = 'paid' WHERE id = ?`,
                    [booking_id]
                );

                const overbookingMsg = `Payment confirmed for booking #${booking_id}, BUT the room reached capacity just before your payment was processed. Please contact support for a refund or room change.`;
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                     VALUES (?, 'Payment Confirmed - ROOM FULL', ?, 'payment', 0, CURDATE())`,
                    [details.user_id, overbookingMsg]
                );

                if (details.manager_id) {
                    await connection.execute(
                        `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                         VALUES (?, 'OVERBOOKING ALERT', ?, 'booking', 0, CURDATE())`,
                        [details.manager_id, `OVERBOOKING: ${details.full_name} paid for room ${details.room_number} but it is now full. Refund required.`]
                    );
                }

                await connection.commit();
                connection.release();

                return res.json({
                    status: 'overbooked',
                    message: 'Payment received but room is already full. Please contact support.',
                    roomDetails: { number: details.room_number, type: details.room_type }
                });
            }

            // Room has space - Proceed with approval
            const authCode = 'UNH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            await connection.execute(
                `UPDATE bookings SET payment_status = 'paid', status = 'approved', auth_code = ? WHERE id = ?`,
                [authCode, booking_id]
            );

            // Update room availability if now full
            if (totalOccupancy + 1 >= capacity) {
                await connection.execute(
                    `UPDATE rooms SET available = 0 WHERE id = ?`,
                    [details.room_id]
                );
            }

            const receiptAmount = Number(details.total_price || 0).toFixed(2);
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

            await connection.commit();
            connection.release();

            if (!details.user_email) {
                console.error(`[BOOKING] Payment verification ERROR: Missing user_email for booking ID ${booking_id}. Details:`, {
                    user_id: details.user_id,
                    full_name: details.full_name
                });
            } else {
                try {
                    const emailSent = await sendBookingEmail(details.user_email, details.full_name, booking_id, details.room_number, details.hostel_name, authCode);
                    if (!emailSent) {
                        console.error(`[BOOKING] Payment verification WARNING: Booking confirmation email to ${details.user_email} (Booking #${booking_id}) was NOT sent (returned false). Check SMTP configuration.`);
                    } else {
                        console.log(`[BOOKING] Confirmation email sent successfully to ${details.user_email} for booking #${booking_id}`);
                    }
                } catch (err) {
                    console.error(`[BOOKING] Payment verification FATAL: Booking confirmation email failed for ${details.user_email} (Booking #${booking_id}):`, err && err.message ? err.message : err);
                }
            }

            return res.json({
                status: 'success',
                message: 'Payment verified and booking automatically approved',
                authCode: authCode,
                roomDetails: {
                    number: details.room_number,
                    type: details.room_type
                }
            });
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
