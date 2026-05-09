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
            const [bookings] = await connection.execute(
                `SELECT b.user_id, b.payment_status, b.auth_code, b.total_price, u.email as user_email, u.full_name, u.gender as user_gender, r.room_number, r.type as room_type, h.name as hostel_name, h.manager_id
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

            if (details.user_id !== user_id && user_role !== 'admin') {
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

            const authCode = 'UNH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            await connection.execute(
                `UPDATE bookings SET payment_status = 'paid', status = 'approved', auth_code = ? WHERE id = ?`,
                [authCode, booking_id]
            );

            const [roomResult] = await connection.execute(
                "SELECT capacity FROM rooms WHERE id = (SELECT room_id FROM bookings WHERE id = ?)",
                [booking_id]
            );
            const [occupancyResult] = await connection.execute(
                "SELECT COUNT(*) as count FROM bookings WHERE room_id = (SELECT room_id FROM bookings WHERE id = ?) AND (payment_status = 'paid' OR status = 'approved')",
                [booking_id]
            );
            
            if (occupancyResult[0].count + 1 >= roomResult[0].capacity) {
                await connection.execute(
                    `UPDATE rooms SET available = 0 WHERE id = (SELECT room_id FROM bookings WHERE id = ?)`,
                    [booking_id]
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

            sendBookingEmail(details.user_email, details.full_name, booking_id, details.room_number, details.hostel_name, authCode)
                .catch(err => console.error('Email error:', err.message));

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
