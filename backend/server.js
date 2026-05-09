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
const path = require('path');
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
const bookingsHandler = require('./api/bookings');
const getAllBookingsHandler = require('./api/getAllBookings');
const getUserBookingsHandler = require('./api/getUserBookings');
const approveBookingHandler = require('./api/approveBooking');
const verifyPaymentHandler = require('./api/verifyPayment');
const deleteBookingHandler = require('./api/deleteBooking');
const updateRoomStatusHandler = require('./api/updateRoomStatus');
const updateRoomOccupancyHandler = require('./api/updateRoomOccupancy');
const getUniversitiesHandler = require('./api/getUniversities');
const createUniversityHandler = require('./api/createUniversity');
const reviewsHandler = require('./api/reviews');
const getNotificationsHandler = require('./api/getNotifications');
const markNotificationReadHandler = require('./api/markNotificationRead');
const uploadImageHandler = require('./api/uploadImage');
const auth = require('./api/auth');

// Debug route for OTP checking (remove in production)
const requestOtpHandler = require('./api/requestOtp');
app.get('/api/debug-otp/:email', requestOtpHandler);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: true, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.post('/api/login', wrapHandler(loginHandler));
app.post('/api/request-otp', wrapHandler(requestOtpHandler));
app.post('/api/register', wrapHandler(registerHandler));
app.post('/api/forgot-password', wrapHandler(forgotPasswordHandler));
app.post('/api/reset-password', wrapHandler(resetPasswordHandler));
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

// Notifications
app.get('/api/getNotifications', wrapHandler(getNotificationsHandler));
app.post('/api/getNotifications', wrapHandler(getNotificationsHandler));
app.post('/api/markNotificationRead', wrapHandler(markNotificationReadHandler));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded images and public static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║         UniHive API Server Started               ║
║         http://localhost:${PORT}                   ║
╚═══════════════════════════════════════════════════╝
    `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

module.exports = app;
