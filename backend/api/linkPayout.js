/**
 * Link or Update Paystack Payout Subaccount API
 * POST /api/hostel/link-payout
 * Accessible by: Admin or the Hostel's assigned Manager
 */

const { getPool, PAYSTACK_SECRET_KEY } = require('./config');
const { resolveGhanaBankCode, getBankNameByCode } = require('./paystackBanks');
const auth = require('./auth');
const https = require('https');

function makePaystackRequest(endpoint, method, data) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'api.paystack.co',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
                'Content-Type': 'application/json',
                ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
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
        if (postData) req.write(postData);
        req.end();
    });
}

async function linkPayoutHandler(req, res) {
    const authData = auth.getRequestAuth(req);
    const userId = authData?.id || req.user_id;
    const userRole = authData?.role || req.role;

    if (!userId) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    const { hostel_id, bank_code, account_number, percentage_charge } = req.body || {};

    if (!hostel_id || !bank_code || !account_number) {
        return res.status(400).json({
            status: 'error',
            message: 'hostel_id, bank_code, and account_number are required'
        });
    }

    const pool = getPool();

    try {
        // Fetch hostel details to check permissions and existing subaccount
        const [hostels] = await pool.execute(
            'SELECT id, name, manager_id, subaccount_code, bank_name, account_number FROM hostels WHERE id = ?',
            [hostel_id]
        );

        if (hostels.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Hostel not found' });
        }

        const hostel = hostels[0];

        // Authorization check: Admin or assigned manager
        const isAuthorized = userRole === 'admin' || String(hostel.manager_id) === String(userId);
        if (!isAuthorized) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to update payout settings for this hostel'
            });
        }

        const cleanBankCode = resolveGhanaBankCode(bank_code);
        const cleanAccountNumber = String(account_number).trim();
        const splitPercentage = Number(percentage_charge) || 5;

        let subaccountCode = hostel.subaccount_code;
        let accountName = '';

        // If subaccount already exists, update it on Paystack
        if (subaccountCode) {
            try {
                const updateRes = await makePaystackRequest(`/subaccount/${subaccountCode}`, 'PUT', {
                    settlement_bank: cleanBankCode,
                    account_number: cleanAccountNumber,
                    percentage_charge: splitPercentage
                });

                if (updateRes && updateRes.status) {
                    accountName = updateRes.data?.account_name || '';
                } else {
                    console.warn('Paystack subaccount update failed, creating new subaccount:', updateRes?.message);
                    subaccountCode = null; // Fallback to creating a new one
                }
            } catch (err) {
                console.warn('Paystack subaccount update error:', err.message);
                subaccountCode = null;
            }
        }

        // Create subaccount if it doesn't exist or update failed
        if (!subaccountCode) {
            const createRes = await makePaystackRequest('/subaccount', 'POST', {
                business_name: hostel.name,
                settlement_bank: cleanBankCode,
                account_number: cleanAccountNumber,
                percentage_charge: splitPercentage
            });

            if (!createRes || !createRes.status) {
                return res.status(400).json({
                    status: 'error',
                    message: createRes?.message || 'Paystack rejected the bank account details. Please verify your account number and bank.'
                });
            }

            subaccountCode = createRes.data?.subaccount_code;
            accountName = createRes.data?.account_name || '';
        }

        // Persist to database
        await pool.execute(
            'UPDATE hostels SET subaccount_code = ?, bank_name = ?, account_number = ? WHERE id = ?',
            [subaccountCode, cleanBankCode, cleanAccountNumber, hostel_id]
        );

        return res.json({
            status: 'success',
            message: 'Payout subaccount successfully linked and activated!',
            subaccount_code: subaccountCode,
            account_name: accountName,
            bank_name: getBankNameByCode(cleanBankCode),
            account_number: cleanAccountNumber
        });

    } catch (error) {
        console.error('Link payout error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to link payout account: ' + error.message
        });
    }
}

module.exports = linkPayoutHandler;
