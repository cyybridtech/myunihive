/**
 * UniHive Frontend API Configuration
 * Points to Express.js backend server
 */

// Set this to your Express server URL when running
// When running locally with Vite dev server, use proxy or local server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const getAuthToken = () => {
    try {
        const authStr = localStorage.getItem('auth');
        return authStr ? JSON.parse(authStr).token : '';
    } catch {
        return '';
    }
};

const defaultFetchOptions = { 
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
};

const parseJsonResponse = async (res) => {
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
        const message = data?.message || data?.error || res.statusText || 'Unknown error';
        throw new Error(message);
    }

    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error(`Invalid JSON response from ${res.url}: ${text.slice(0, 200)}`);
        }
    }

    return text;
};

const fetchJson = async (url, options = {}) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const token = getAuthToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(fullUrl, { ...defaultFetchOptions, ...options, headers: { ...defaultFetchOptions.headers, ...authHeaders, ...options.headers } });
    return parseJsonResponse(res);
};

// ============ Auth APIs ============

export const loginUser = async (email, password) => {
    return fetchJson('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
};

export const registerUser = async (userData) => {
    return fetchJson('/api/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
};

export const logoutUser = async () => {
    return fetchJson('/api/logout', {
        method: 'POST'
    });
};

export const getUser = async () => {
    return fetchJson('/api/user', {
        method: 'GET'
    });
};

// ============ Hostels APIs ============

export const getHostels = async () => {
    return fetchJson('/api/getHostels');
};

export const createHostel = async (hostelData) => {
    return fetchJson('/api/createHostel', {
        method: 'POST',
        body: JSON.stringify(hostelData)
    });
};

export const deleteHostel = async (hostelId) => {
    return fetchJson('/api/deleteHostel', {
        method: 'POST',
        body: JSON.stringify({ hostel_id: hostelId })
    });
};

// ============ Rooms APIs ============

export const getRooms = async () => {
    return fetchJson('/api/getRooms');
};

export const createRoom = async (roomData) => {
    return fetchJson('/api/createRoom', {
        method: 'POST',
        body: JSON.stringify(roomData)
    });
};

export const updateRoomStatus = async (roomId, available) => {
    return fetchJson('/api/updateRoomStatus', {
        method: 'POST',
        body: JSON.stringify({ room_id: roomId, available })
    });
};

// ============ Bookings APIs ============

export const createBooking = async (roomId, hostelId, bookingDate) => {
    return fetchJson('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ 
            room_id: roomId, 
            hostel_id: hostelId, 
            booking_date: bookingDate 
        })
    });
};

export const getUserBookings = async () => {
    return fetchJson('/api/getUserBookings', {
        method: 'GET'
    });
};

export const getAllBookings = async () => {
    return fetchJson('/api/getAllBookings', {
        method: 'GET'
    });
};

export const approveBooking = async (bookingId, status) => {
    return fetchJson('/api/approveBooking', {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId, status })
    });
};

export const verifyPayment = async (reference, bookingId) => {
    return fetchJson('/api/verifyPayment', {
        method: 'POST',
        body: JSON.stringify({ reference, booking_id: bookingId })
    });
};

// ============ Universities APIs ============

export const getUniversities = async () => {
    return fetchJson('/api/getUniversities');
};

export const createUniversity = async (uniData) => {
    return fetchJson('/api/createUniversity', {
        method: 'POST',
        body: JSON.stringify(uniData)
    });
};

// ============ Reviews APIs ============

export const getReviewsForHostel = async (hostelId) => {
    return fetchJson(`/api/reviews?hostel_id=${encodeURIComponent(hostelId)}`);
};

export const submitReview = async (hostelId, rating, comment) => {
    return fetchJson('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ 
            hostel_id: hostelId, 
            rating, 
            comment 
        })
    });
};

// ============ Notifications APIs ============

export const getNotifications = async () => {
    return fetchJson('/api/getNotifications', {
        method: 'GET'
    });
};

export const markNotificationRead = async (dbId) => {
    return fetchJson('/api/markNotificationRead', {
        method: 'POST',
        body: JSON.stringify({ db_id: dbId })
    });
};

// ============ Export API Base URL for use in components ============
export { API_BASE_URL };
