/**
 * Update Booking Resident Details API
 * POST /api/updateBookingDetails
 * Allows students to fill/update their resident KYC and emergency contact details for a booking.
 */

const { getPool } = require('./config');

async function updateBookingDetailsHandler(req, res) {
    const user_id = req.user_id;
    const user_role = req.role;

    if (!user_id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const {
        booking_id,
        bookingId,
        student_id_number,
        studentIdNumber,
        level,
        program_of_study,
        programOfStudy,
        emergency_contact_name,
        emergencyContactName,
        emergency_contact_phone,
        emergencyContactPhone,
        emergency_contact_relation,
        emergencyContactRelation,
        expected_check_in_date,
        expectedCheckInDate,
        special_requests,
        specialRequests
    } = req.body || {};

    const id = booking_id || bookingId;
    if (!id) {
        return res.status(400).json({ status: 'error', message: 'Missing booking ID' });
    }

    const studentId = student_id_number ?? studentIdNumber ?? null;
    const lvl = level ?? null;
    const program = program_of_study ?? programOfStudy ?? null;
    const emergName = emergency_contact_name ?? emergencyContactName ?? null;
    const emergPhone = emergency_contact_phone ?? emergencyContactPhone ?? null;
    const emergRelation = emergency_contact_relation ?? emergencyContactRelation ?? null;
    const checkInDate = expected_check_in_date ?? expectedCheckInDate ?? null;
    const notes = special_requests ?? specialRequests ?? null;

    const pool = getPool();

    try {
        // Verify booking ownership or manager/admin role
        const [bookings] = await pool.execute(
            `SELECT b.user_id, h.manager_id 
             FROM bookings b
             LEFT JOIN hostels h ON b.hostel_id = h.id
             WHERE b.id = ?`,
            [id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
        }

        const booking = bookings[0];
        const isOwner = String(booking.user_id) === String(user_id);
        const isManager = String(booking.manager_id) === String(user_id);
        const isAdmin = user_role === 'admin';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).json({ status: 'error', message: 'Unauthorized to update this booking' });
        }

        // Update booking details
        await pool.execute(
            `UPDATE bookings SET
                student_id_number = COALESCE(?, student_id_number),
                level = COALESCE(?, level),
                program_of_study = COALESCE(?, program_of_study),
                emergency_contact_name = COALESCE(?, emergency_contact_name),
                emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                emergency_contact_relation = COALESCE(?, emergency_contact_relation),
                expected_check_in_date = COALESCE(?, expected_check_in_date),
                special_requests = COALESCE(?, special_requests)
             WHERE id = ?`,
            [studentId, lvl, program, emergName, emergPhone, emergRelation, checkInDate, notes, id]
        );

        // Also update student user profile if owner
        if (isOwner) {
            await pool.execute(
                `UPDATE users SET
                    student_id_number = COALESCE(?, student_id_number),
                    level = COALESCE(?, level),
                    program_of_study = COALESCE(?, program_of_study),
                    emergency_contact_name = COALESCE(?, emergency_contact_name),
                    emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                    emergency_contact_relation = COALESCE(?, emergency_contact_relation)
                 WHERE id = ?`,
                [studentId, lvl, program, emergName, emergPhone, emergRelation, user_id]
            );
        }

        res.json({
            status: 'success',
            message: 'Resident details saved successfully'
        });

    } catch (error) {
        console.error('Update booking details error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = updateBookingDetailsHandler;
