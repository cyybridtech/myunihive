/**
 * Update Hostel API
 * POST /api/updateHostel
 * Requires: admin role
 */

const { getPool } = require('./config');

async function updateHostelHandler(req, res) {
    const {
        hostel_id,
        name,
        university_id,
        address,
        description,
        distance_from_campus,
        price_range,
        main_image,
        verified
    } = req.body || {};
    const user_role = req.role;

    if (!user_role || user_role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'Admin access required' });
    }
    if (!hostel_id) {
        return res.status(400).json({ status: 'error', message: 'Hostel id is required' });
    }

    const pool = getPool();

    try {
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (university_id !== undefined) { updates.push('university_id = ?'); values.push(university_id); }
        if (address !== undefined) { updates.push('address = ?'); values.push(address); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (distance_from_campus !== undefined) { updates.push('distance_from_campus = ?'); values.push(distance_from_campus); }
        if (price_range !== undefined) { updates.push('price_range = ?'); values.push(price_range); }
        if (main_image !== undefined) { updates.push('main_image = ?'); values.push(main_image); }
        if (verified !== undefined) { updates.push('verified = ?'); values.push(verified ? 1 : 0); }
        if (req.body.commission_type !== undefined) { updates.push('commission_type = ?'); values.push(req.body.commission_type); }
        if (req.body.platform_fee !== undefined) { updates.push('platform_fee = ?'); values.push(req.body.platform_fee); }
        if (req.body.bank_name !== undefined) { updates.push('bank_name = ?'); values.push(req.body.bank_name); }
        if (req.body.account_number !== undefined) { updates.push('account_number = ?'); values.push(req.body.account_number); }
        if (req.body.subaccount_code !== undefined) { updates.push('subaccount_code = ?'); values.push(req.body.subaccount_code); }

        if (updates.length === 0) {
            return res.status(400).json({ status: 'error', message: 'No fields to update' });
        }

        values.push(hostel_id);
        await pool.execute(`UPDATE hostels SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ status: 'success', message: 'Hostel updated' });
    } catch (error) {
        console.error('Update hostel error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update hostel: ' + error.message });
    }
}

module.exports = updateHostelHandler;
