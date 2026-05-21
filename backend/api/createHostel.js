/**
 * Create Hostel API
 * POST /api/createHostel
 * Requires: admin or manager role
 */

const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const https = require('https');

async function createHostelHandler(req, res) {
    console.log('[CREATE_HOSTEL] incoming', {
        role: req.role,
        user_id: req.user_id,
        bodyKeys: req.body ? Object.keys(req.body) : []
    });

    const { name, university_id, address, description, distance_from_campus, price_range, main_image, 
           bank_code, account_number, manager_full_name, manager_email, manager_password, manager_phone, manager_gender,
           lat, lng, payment_period } = req.body || {};
    const user_role = req.role;
    const user_id = req.user_id;


    const isManagerRole = user_role === 'manager' || user_role === 'hostel_manager';
    if (!user_role || !user_id || (user_role !== 'admin' && !isManagerRole)) {
        return res.status(403).json({ status: 'error', message: 'Admin or hostel manager access required' });
    }

    if (!name || !university_id) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const pool = getPool();
    let manager_id = null;
    let subaccount_code = null;
    let paystack_data = { success: false, message: 'No bank details provided' };

    try {
        // Create Paystack subaccount if bank details provided
        if (bank_code && account_number) {
            const subData = JSON.stringify({
                business_name: name,
                settlement_bank: bank_code,
                account_number: account_number,
                percentage_charge: 5
            });

            try {
                const paystackResult = await makePaystackRequest('/subaccount', 'POST', subData);
                if (paystackResult.status) {
                    subaccount_code = paystackResult.data.subaccount_code;
                    paystack_data = { success: true, message: 'Subaccount created' };
                } else {
                    console.error('Paystack subaccount rejection:', paystackResult.message);
                    paystack_data = { success: false, message: paystackResult.message };
                }
            } catch (paystackError) {
                console.error('Paystack network error:', paystackError.message);
                paystack_data = { success: false, message: paystackError.message };
            }
        }

        // Create hostel manager user if provided, otherwise use current manager account for manager role
        if (isManagerRole) {
            manager_id = user_id;
        } else if (manager_full_name && manager_email && manager_password) {
            // Check if manager email exists
            const [existing] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [manager_email]
            );

            if (existing.length > 0) {
                return res.status(400).json({ status: 'error', message: 'Manager email already exists' });
            }

            const bcrypt = require('bcryptjs');
            const managerPassword = bcrypt.hashSync(manager_password, 10);

            const [managerResult] = await pool.execute(
                `INSERT INTO users (full_name, email, phone, university_id, password, role, gender, credits, created_at) 
                VALUES (?, ?, ?, ?, ?, 'manager', ?, 0, NOW())`,
                [manager_full_name, manager_email, manager_phone || null, university_id, managerPassword, manager_gender || 'male']
            );

            manager_id = managerResult.insertId;
        }

        // Generate hostel ID
        const id = 'h' + Date.now() + Math.floor(Math.random() * 900) + 100;
        
        let gallery_json = null;
        if (req.body.gallery && Array.isArray(req.body.gallery)) {
            gallery_json = JSON.stringify(req.body.gallery);
        }



        // Build insert dynamically to match whatever columns exist in the connected DB.
        // Your current XAMPP `hostels` table does NOT include `commission_type` and `platform_fee`.
        const [columnsRows] = await pool.execute('SHOW COLUMNS FROM hostels');
        const existingCols = new Set(columnsRows.map(r => r.Field));

        const allCols = [
            'id', 'name', 'university_id', 'address', 'description', 'distance_from_campus',
            'price_range', 'main_image', 'gallery',
            'lat', 'lng',
            'verified', 'manager_id', 'subaccount_code', 'bank_name', 'account_number',
            'commission_type', 'platform_fee', 'payment_period', 'facilities'
        ];

        let facilities_json = null;
        if (req.body.facilities) {
            try {
                // Front end sends a comma-separated string
                const arr = req.body.facilities.split(',').map(f => f.trim()).filter(Boolean);
                facilities_json = JSON.stringify(arr);
            } catch (e) {
                console.error("Facilities parse error", e);
            }
        }

        const allVals = [
            id,
            name,
            university_id,
            address || '',
            description || '',
            distance_from_campus || '1.0km',
            price_range || 'GH₵1000-2000',
            main_image || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
            gallery_json,
            lat != null && lat !== '' ? Number(lat) : null,
            lng != null && lng !== '' ? Number(lng) : null,
            1,
            manager_id,
            subaccount_code,
            bank_code || '',
            account_number || '',
            req.body.commission_type || 'split',
            req.body.platform_fee != null ? req.body.platform_fee : 0,
            payment_period || 'semester',
            facilities_json
        ];

        // Filter to only columns that exist
        const finalCols = [];
        const finalVals = [];
        for (let i = 0; i < allCols.length; i++) {
            if (existingCols.has(allCols[i])) {
                finalCols.push(allCols[i]);
                finalVals.push(allVals[i]);
            }
        }

        // If critical columns are missing, fail loudly
        const critical = ['id', 'name', 'university_id'];
        const missingCritical = critical.filter(c => !existingCols.has(c));
        if (missingCritical.length) {
            throw new Error('Hostels table missing critical columns: ' + missingCritical.join(', '));
        }

        const placeholders = finalCols.map(() => '?').join(', ');
        const insertSql = `INSERT INTO hostels (${finalCols.join(', ')}) VALUES (${placeholders})`;

        await pool.execute(insertSql, finalVals);


        res.json({
            status: 'success',
            id: id,
            manager_id: manager_id,
            paystack: paystack_data,
            subaccount_code: subaccount_code
        });

    } catch (error) {
        const mysqlMessage = error && error.message ? error.message : String(error);
        const mysqlCode = error && error.code ? error.code : undefined;
        const sqlMessage = error && error.sqlMessage ? error.sqlMessage : undefined;
        const sqlState = error && error.sqlState ? error.sqlState : undefined;

        console.error('[CREATE_HOSTEL] DB insert failed:', {
            message: mysqlMessage,
            code: mysqlCode,
            sqlMessage,
            sqlState,
        });

        res.status(500).json({
            status: 'error',
            message: 'DB insert failed',
            db_error: sqlMessage || mysqlMessage,
            db_code: mysqlCode,
            db_sql_state: sqlState,
            paystack: paystack_data
        });
    }
}


/**
 * Helper function to make Paystack API requests
 */
function makePaystackRequest(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result);
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

module.exports = createHostelHandler;
