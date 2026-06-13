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
const userHandler = require('./api/user');
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
const approveBookingHandler = require('./api/approveBooking');
const verifyPaymentHandler = require('./api/verifyPayment');
const updateRoomStatusHandler = require('./api/updateRoomStatus');
const updateRoomOccupancyHandler = require('./api/updateRoomOccupancy');
const getUniversitiesHandler = require('./api/getUniversities');
const createUniversityHandler = require('./api/createUniversity');
const reviewsHandler = require('./api/reviews');
const getNotificationsHandler = require('./api/getNotifications');
const markNotificationReadHandler = require('./api/markNotificationRead');
const uploadImageHandler = require('./api/uploadImage');
const testEmailHandler = require('./api/testEmail');
const roommateHandler = require('./api/roommate');
const auth = require('./api/auth');
const { getPool, initSchema } = require('./api/config');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting (important for Vercel/Render/Fly.io)
app.set('trust proxy', 1);

// Middleware
app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per window
    message: { status: 'error', message: 'Too many attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', generalLimiter);

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

// Debug route for OTP checking, enabled only when DEBUG_EMAIL=true
if (process.env.DEBUG_EMAIL === 'true') {
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
        method: req.method,
        httpMethod: req.method,
        auth: authData,
        user_id: authData?.id,
        role: authData?.role
    };
}

// Wrap handler to add req/res context
function wrapHandler(handler) {
    return async (req, res) => {
        const context = createHandlerContext(req, res);
        await handler(context, res);
    };
}

// API Routes

// Auth
app.post('/api/login', authLimiter, wrapHandler(loginHandler));
app.post('/api/request-otp', authLimiter, wrapHandler(requestOtpHandler));
app.post('/api/register', authLimiter, wrapHandler(registerHandler));
app.post('/api/forgot-password', authLimiter, wrapHandler(forgotPasswordHandler));
app.post('/api/reset-password', authLimiter, wrapHandler(resetPasswordHandler));
app.post('/api/logout', wrapHandler(logoutHandler));
app.get('/api/user', wrapHandler(userHandler));
app.post('/api/user', wrapHandler(userHandler));

// Hostels
app.get('/api/getHostels', wrapHandler(getHostelsHandler));

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

// Approve Booking
app.post('/api/approveBooking', wrapHandler(approveBookingHandler));

// Verify Payment
app.post('/api/verifyPayment', wrapHandler(verifyPaymentHandler));

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

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

module.exports = app;
