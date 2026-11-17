/**
 * UniHive API Server
 * Express.js server that connects frontend to MySQL database
 * 
 * Usage:
 *   cd backend && npm start
 * Or from repo root:
 *   npm run server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('./api/loadEnv');

// Import API handlers
const loginHandler = require('./api/login');
const registerHandler = require('./api/register');
const requestOtpHandler = require('./api/requestOtp');
const forgotPasswordHandler = require('./api/forgotPassword');
const resetPasswordHandler = require('./api/resetPassword');
const logoutHandler = require('./api/logout');
const { userHandler, updateProfileHandler, changePasswordHandler } = require('./api/user');
const statsHandler = require('./api/stats');
const updateUniversityHandler = require('./api/updateUniversity');
const getHostelsHandler = require('./api/getHostels');
const getRoomsHandler = require('./api/getRooms');
const createHostelHandler = require('./api/createHostel');
const createRoomHandler = require('./api/createRoom');
const deleteRoomHandler = require('./api/deleteRoom');
const updateRoomHandler = require('./api/updateRoom');
const updateHostelHandler = require('./api/updateHostel');
const deleteHostelHandler = require('./api/deleteHostel');
const deleteUniversityHandler = require('./api/deleteUniversity');
const deleteBookingHandler = require('./api/deleteBooking');
const resetHostelRoomsHandler = require('./api/resetHostelRooms');
const messagesHandler = require('./api/messages');
const { pushHandler } = require('./api/push');
const bookingsHandler = require('./api/bookings');
const getAllBookingsHandler = require('./api/getAllBookings');
const getUserBookingsHandler = require('./api/getUserBookings');
const updateBookingDetailsHandler = require('./api/updateBookingDetails');
const approveBookingHandler = require('./api/approveBooking');
const verifyPaymentHandler = require('./api/verifyPayment');
const updateRoomStatusHandler = require('./api/updateRoomStatus');
const updateRoomOccupancyHandler = require('./api/updateRoomOccupancy');
const getUniversitiesHandler = require('./api/getUniversities');
const createUniversityHandler = require('./api/createUniversity');
const reviewsHandler = require('./api/reviews');
const getNotificationsHandler = require('./api/getNotifications');
const markNotificationReadHandler = require('./api/markNotificationRead');
const deleteNotificationHandler = require('./api/deleteNotification');
const uploadImageHandler = require('./api/uploadImage');
const testEmailHandler = require('./api/testEmail');
const roommateHandler = require('./api/roommate');
const getSavedCardHandler = require('./api/getSavedCard');
const chargeCardHandler = require('./api/chargeCard');
const getPayoutStatsHandler = require('./api/getPayoutStats');
const paystackWebhookHandler = require('./api/paystackWebhook');
const verifyIdentityHandler = require('./api/verifyIdentity');
const linkPayoutHandler = require('./api/linkPayout');
const auth = require('./api/auth');
const { getPool, initSchema } = require('./api/config');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Hardening: Disable Express fingerprinting
app.disable('x-powered-by');

// Security Hardening: Helmet HTTP Headers
app.use(helmet({
    contentSecurityPolicy: false, // Handled via vercel.json & HTML headers to prevent breaking dynamic CDN maps/Paystack
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security Hardening: Restrict CORS to trusted origins
const allowedOrigins = [
    'https://www.myunihive.com',
    'https://myunihive.com',
    'https://testhive-zeta.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: origin not permitted'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Security Hardening: Rate Limiters
const generalApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 180, // 180 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many requests, please slow down.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // 25 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 6, // 6 code requests per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many verification code requests. Please wait 10 minutes.' }
});

// Middleware
app.use('/api', generalApiLimiter);
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy schema initialization for serverless / local environments
let schemaInitialized = false;
app.use(async (req, res, next) => {
    if (!schemaInitialized) {
        schemaInitialized = true;
        try {
            await initSchema();
            console.log('Database schema initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database schema:', error);
        }
    }
    next();
});

// Debug route for OTP checking, strictly disabled in production
if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EMAIL === 'true') {
    app.get('/api/debug-otp/:email', async (req, res) => {
        const { email } = req.params;
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        try {
            const pool = getPool();
            const [rows] = await pool.execute(
                'SELECT otp_code, expires_at FROM otps WHERE email = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
                [email]
            );

            if (rows.length === 0) {
                return res.json({ found: false, message: 'No active OTP found for this email' });
            }

            return res.json({
                found: true,
                email,
                otp_code: rows[0].otp_code,
                expires_at: rows[0].expires_at
            });
        } catch (error) {
            console.error('Debug OTP error:', error);
            res.status(500).json({ error: 'Database error' });
        }
    });
}

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Create mock req/res objects for handler compatibility
function createHandlerContext(req, res) {
    const authData = auth.getRequestAuth(req);

    return {
        body: req.body,
        query: req.query,
        params: req.params,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        headers: req.headers,
        method: req.method,
        httpMethod: req.method,
        auth: authData,
        user_id: authData?.id,
        role: authData?.role
    };
}

// Wrap handler to add req/res context and catch async errors
function wrapHandler(handler) {
    return async (req, res, next) => {
        try {
            const context = createHandlerContext(req, res);
            await handler(context, res);
        } catch (error) {
            next(error);
        }
    };
}

// API Routes

// Auth (Protected with rate limiters against brute-force attacks)
app.post('/api/login', authLimiter, wrapHandler(loginHandler));
app.post('/api/request-otp', otpLimiter, wrapHandler(requestOtpHandler));
app.post('/api/register', authLimiter, wrapHandler(registerHandler));
app.post('/api/forgot-password', authLimiter, wrapHandler(forgotPasswordHandler));
app.post('/api/reset-password', authLimiter, wrapHandler(resetPasswordHandler));
app.post('/api/logout', wrapHandler(logoutHandler));
app.get('/api/user', wrapHandler(userHandler));
app.post('/api/user', wrapHandler(userHandler));
app.post('/api/user/update', wrapHandler(updateProfileHandler));
app.post('/api/user/change-password', wrapHandler(changePasswordHandler));
app.post('/api/verify-identity', wrapHandler(verifyIdentityHandler));
app.get('/api/stats', wrapHandler(statsHandler));

// Hostels
app.get('/api/getHostels', wrapHandler(getHostelsHandler));
app.post('/api/hostel/link-payout', wrapHandler(linkPayoutHandler));

// Rooms
app.get('/api/getRooms', wrapHandler(getRoomsHandler));

// Create Hostel (Admin)
app.post('/api/createHostel', wrapHandler(createHostelHandler));

// Create Room (Admin/Manager)
app.post('/api/createRoom', wrapHandler(createRoomHandler));
app.post('/api/updateRoom', wrapHandler(updateRoomHandler));
app.post('/api/deleteRoom', wrapHandler(deleteRoomHandler));

// Delete Hostel (Admin)
app.post('/api/deleteHostel', wrapHandler(deleteHostelHandler));
app.post('/api/updateHostel', wrapHandler(updateHostelHandler));
app.post('/api/deleteUniversity', wrapHandler(deleteUniversityHandler));
app.post('/api/resetHostelRooms', wrapHandler(resetHostelRoomsHandler));

// Bookings
app.get('/api/bookings', wrapHandler(bookingsHandler));
app.post('/api/bookings', wrapHandler(bookingsHandler));
app.get('/api/getAllBookings', wrapHandler(getAllBookingsHandler));
app.get('/api/getUserBookings', wrapHandler(getUserBookingsHandler));
app.post('/api/getUserBookings', wrapHandler(getUserBookingsHandler));
app.post('/api/updateBookingDetails', wrapHandler(updateBookingDetailsHandler));

// Approve Booking
app.post('/api/approveBooking', wrapHandler(approveBookingHandler));

// Verify Payment
app.post('/api/verifyPayment', wrapHandler(verifyPaymentHandler));
app.post('/api/webhook/paystack', paystackWebhookHandler);

// Upload images
app.post('/api/uploadImage', uploadImageHandler);

// Cancel / Delete unpaid booking
app.post('/api/deleteBooking', wrapHandler(deleteBookingHandler));

// Room Status
app.post('/api/updateRoomStatus', wrapHandler(updateRoomStatusHandler));
app.post('/api/updateRoomOccupancy', wrapHandler(updateRoomOccupancyHandler));

// Universities
app.get('/api/getUniversities', wrapHandler(getUniversitiesHandler));
app.post('/api/createUniversity', wrapHandler(createUniversityHandler));
app.post('/api/updateUniversity', wrapHandler(updateUniversityHandler));

// Reviews
app.get('/api/reviews', wrapHandler(reviewsHandler));
app.post('/api/reviews', wrapHandler(reviewsHandler));

// Messages
app.get('/api/messages', wrapHandler(messagesHandler));
app.post('/api/messages', wrapHandler(messagesHandler));

// Push Notifications
app.post('/api/push/subscribe', wrapHandler(pushHandler));

// Notifications
app.get('/api/getNotifications', wrapHandler(getNotificationsHandler));
app.post('/api/getNotifications', wrapHandler(getNotificationsHandler));
app.post('/api/markNotificationRead', wrapHandler(markNotificationReadHandler));
app.post('/api/deleteNotification', wrapHandler(deleteNotificationHandler));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test email delivery endpoint
app.post('/api/test-email', wrapHandler(testEmailHandler));

// Roommate Matching
app.get('/api/roommate/profile', wrapHandler(roommateHandler));
app.post('/api/roommate/profile', wrapHandler(roommateHandler));
app.get('/api/roommate/matches', wrapHandler(roommateHandler));

// Saved Card & One-click Charge
app.get('/api/getSavedCard', wrapHandler(getSavedCardHandler));
app.post('/api/chargeCard', wrapHandler(chargeCardHandler));

// Manager Payout Stats
app.get('/api/getPayoutStats', wrapHandler(getPayoutStatsHandler));

// Serve uploaded images and public static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.resolve(__dirname, '../public')));

// Serve built React app for all other routes
app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        const distPath = path.resolve(__dirname, '../dist/index.html');
        const rootPath = path.resolve(__dirname, '../index.html');
        if (fs.existsSync(distPath)) {
            res.sendFile(distPath);
        } else if (fs.existsSync(rootPath)) {
            res.sendFile(rootPath);
        } else {
            // No index.html found - return a simple HTML message
            res.type('html').send('<html><body><h1>UniHive API</h1><p>Server is running. Build the frontend and redeploy for the full app.</p></body></html>');
        }
    } else {
        next();
    }
});


// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Only start listening when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║         UniHive API Server Started               ║
║         http://localhost:${PORT}                   ║
╚═══════════════════════════════════════════════════╝
        `);
    });
}

// Process error resilience to prevent server crashes
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]', reason);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

module.exports = app;
