/**
 * UniHive API Handlers Export
 * This file exports all API handlers for easy importing in server.js
 */

const loginHandler = require('./login');
const registerHandler = require('./register');
const logoutHandler = require('./logout');
const userHandler = require('./user');
const getHostelsHandler = require('./getHostels');
const getRoomsHandler = require('./getRooms');
const createHostelHandler = require('./createHostel');
const createRoomHandler = require('./createRoom');
const deleteHostelHandler = require('./deleteHostel');
const bookingsHandler = require('./bookings');
const getAllBookingsHandler = require('./getAllBookings');
const getUserBookingsHandler = require('./getUserBookings');
const approveBookingHandler = require('./approveBooking');
const verifyPaymentHandler = require('./verifyPayment');
const updateRoomStatusHandler = require('./updateRoomStatus');
const getUniversitiesHandler = require('./getUniversities');
const createUniversityHandler = require('./createUniversity');
const reviewsHandler = require('./reviews');
const getNotificationsHandler = require('./getNotifications');
const markNotificationReadHandler = require('./markNotificationRead');

module.exports = {
    loginHandler,
    registerHandler,
    logoutHandler,
    userHandler,
    getHostelsHandler,
    getRoomsHandler,
    createHostelHandler,
    createRoomHandler,
    deleteHostelHandler,
    bookingsHandler,
    getAllBookingsHandler,
    getUserBookingsHandler,
    approveBookingHandler,
    verifyPaymentHandler,
    updateRoomStatusHandler,
    getUniversitiesHandler,
    createUniversityHandler,
    reviewsHandler,
    getNotificationsHandler,
    markNotificationReadHandler
};
