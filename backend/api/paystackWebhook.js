/**
 * Paystack Webhook Handler
 * POST /api/webhook/paystack
 * 
 * Verifies Paystack HMAC-SHA512 signature and processes background payment events
 * (e.g. mobile money approvals when the user's browser is closed or phone dies).
 */

const crypto = require('crypto');
const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const { sendBookingEmail } = require('./sendEmail');

async function paystackWebhookHandler(req, res) {
    if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY === 'YOUR_PAYSTACK_SECRET_KEY') {
        console.error('[WEBHOOK] Paystack secret key not configured');
        return res.status(500).json({ status: 'error', message: 'Paystack secret key is not configured' });
    }

    // 1. Validate Paystack HMAC SHA512 signature
    const signature = req.headers['x-paystack-signature'];
    if (!signature) {
        console.warn('[WEBHOOK] Rejected: Missing x-paystack-signature header');
        return res.status(401).json({ status: 'error', message: 'Missing signature' });
    }

    const payload = req.rawBody ? req.rawBody : JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.warn('[WEBHOOK] Rejected: Invalid HMAC signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body?.event;
    const data = req.body?.data;

    // Acknowledge receipt to Paystack immediately for non-charge events
    if (event !== 'charge.success' || !data) {
        return res.status(200).json({ status: 'ignored', message: `Event ${event} received` });
    }

    const reference = data.reference;
    const paidAmount = Number(data.amount); // in pesewas

    if (!reference) {
        return res.status(400).json({ status: 'error', message: 'Missing transaction reference' });
    }

    console.log(`[WEBHOOK] Processing charge.success for reference: ${reference}, amount: ${paidAmount / 100} GHS`);

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Locate booking by reference or ID
        const [bookings] = await connection.execute(
            `SELECT b.id, b.user_id, b.room_id, b.hostel_id, b.payment_status, b.status, b.auth_code, b.total_price,
                    u.email as user_email, u.full_name, u.gender as user_gender,
                    r.room_number, r.type as room_type, r.capacity, r.manual_occupancy,
                    h.name as hostel_name, h.manager_id
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             JOIN hostels h ON b.hostel_id = h.id
             WHERE b.paystack_reference = ? OR b.id = ?
             LIMIT 1
             FOR UPDATE`,
            [reference, reference.split('-')[1] || 0]
        );

        if (bookings.length === 0) {
            console.warn(`[WEBHOOK] No booking found matching reference ${reference}`);
            await connection.rollback();
            connection.release();
            // Return 200 so Paystack does not repeatedly retry an unmapped transaction
            return res.status(200).json({ status: 'skipped', message: 'No matching booking found' });
        }

        const booking = bookings[0];

        // 3. Idempotency: If already marked as paid, return 200 immediately
        if (booking.payment_status === 'paid') {
            console.log(`[WEBHOOK] Booking #${booking.id} is already paid. Skipping redundant fulfillment.`);
            await connection.rollback();
            connection.release();
            return res.status(200).json({ status: 'already_paid', booking_id: booking.id });
        }

        // 4. Validate amount paid
        const expectedAmountInPesewas = Math.round(Number(booking.total_price) * 100);
        if (paidAmount < expectedAmountInPesewas) {
            console.error(`[WEBHOOK] Amount mismatch on booking #${booking.id}. Expected: ${expectedAmountInPesewas}, Received: ${paidAmount}`);
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Insufficient payment amount' });
        }

        // 5. Lock and calculate real-time room occupancy
        const [occupancyResult] = await connection.execute(
            `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE room_id = ? AND (status = 'approved' OR (payment_status = 'paid' AND status NOT IN ('cancelled', 'rejected', 'completed', 'expired'))) AND id != ?`,
            [booking.room_id, booking.id]
        );

        const currentOccupancy = (parseInt(occupancyResult[0].count) || 0) + (parseInt(booking.manual_occupancy) || 0);
        const capacity = parseInt(booking.capacity) || 1;

        let finalStatus = 'approved';
        let authCode = booking.auth_code;

        if (currentOccupancy >= capacity) {
            finalStatus = 'pending';
            authCode = null;
            console.warn(`[WEBHOOK] Room ${booking.room_number} reached capacity. Transitioned booking #${booking.id} to pending review.`);
        } else {
            if (!authCode) {
                authCode = 'UNH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
            }
        }

        // 6. Update booking status
        await connection.execute(
            `UPDATE bookings SET payment_status = 'paid', status = ?, auth_code = ? WHERE id = ?`,
            [finalStatus, authCode, booking.id]
        );

        // 7. Update room availability if full
        if (finalStatus === 'approved' && currentOccupancy + 1 >= capacity) {
            await connection.execute(`UPDATE rooms SET available = 0 WHERE id = ?`, [booking.room_id]);
        } else if (finalStatus === 'pending') {
            await connection.execute(`UPDATE rooms SET available = 0 WHERE id = ?`, [booking.room_id]);
        }

        // 8. Save authorization for one-click re-booking if card is reusable
        const authInfo = data.authorization;
        if (authInfo && authInfo.reusable && authInfo.authorization_code) {
            try {
                await connection.execute(
                    `INSERT INTO saved_cards (user_id, authorization_code, email, last4, exp_month, exp_year, card_type, bank)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE authorization_code = ?, last4 = ?, exp_month = ?, exp_year = ?`,
                    [
                        booking.user_id,
                        authInfo.authorization_code,
                        data.customer?.email || booking.user_email,
                        authInfo.last4 || null,
                        authInfo.exp_month || null,
                        authInfo.exp_year || null,
                        authInfo.card_type || null,
                        authInfo.bank || null,
                        authInfo.authorization_code,
                        authInfo.last4 || null,
                        authInfo.exp_month || null,
                        authInfo.exp_year || null
                    ]
                );
            } catch (cardErr) {
                console.warn('[WEBHOOK] Could not save card authorization:', cardErr.message);
            }
        }

        // 9. Dispatch notifications
        const receiptAmount = Number(booking.total_price || 0).toFixed(2);
        if (finalStatus === 'approved') {
            const studentMsg = `Payment confirmed for booking #${booking.id}. Hostel: ${booking.hostel_name}. Room: ${booking.room_number} (${booking.room_type}). Amount: GH₵${receiptAmount}. Security Code: ${authCode}`;
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                 VALUES (?, 'Payment Confirmed - Booking Active', ?, 'payment', 0, CURDATE())`,
                [booking.user_id, studentMsg]
            );

            if (booking.manager_id) {
                const managerMsg = `New paid booking from ${booking.full_name} (${booking.user_gender}) for Room ${booking.room_number} at ${booking.hostel_name}. Code: ${authCode}.`;
                await connection.execute(
                    `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                     VALUES (?, 'New Paid Booking', ?, 'booking', 0, CURDATE())`,
                    [booking.manager_id, managerMsg]
                );
            }

            // Send confirmation email with check-in code
            try {
                await sendBookingEmail(booking.user_email, booking.full_name, {
                    booking_id: booking.id,
                    hostel_name: booking.hostel_name,
                    room_number: booking.room_number,
                    auth_code: authCode
                });
            } catch (emailErr) {
                console.error('[WEBHOOK] Failed to dispatch confirmation email:', emailErr.message);
            }
        } else {
            const notifMsg = `Payment received for booking #${booking.id} (${booking.hostel_name}, Room: ${booking.room_number}). However, the room is currently full. Your reservation is pending manager reallocation or refund.`;
            await connection.execute(
                `INSERT INTO notifications (user_id, title, message, type, read_status, notification_date)
                 VALUES (?, 'Payment Received - Room Full', ?, 'payment', 0, CURDATE())`,
                [booking.user_id, notifMsg]
            );
        }

        await connection.commit();
        connection.release();

        console.log(`[WEBHOOK] Booking #${booking.id} successfully finalized with status: ${finalStatus}`);
        return res.status(200).json({ status: 'success', booking_id: booking.id, state: finalStatus });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('[WEBHOOK ERROR]', error);
        return res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
    }
}

module.exports = paystackWebhookHandler;
