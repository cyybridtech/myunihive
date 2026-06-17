// API Base URL
// - Development: use Vite proxy (/api -> localhost:3001)
// - Production: defaults to relative /api (uses same origin on Vercel)
const getBaseUrl = () => {
  // In production (Vercel unified hosting), always communicate via relative '/api'
  // endpoints of the same origin to bypass stale VITE_API_BASE_URL environment variables.
  if (!import.meta.env.DEV) {
    return '/api';
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) return envUrl;

  // Dev: let Vite proxy handle it
  return '/api';
};
const BASE_URL = getBaseUrl();
const defaultFetchOptions = { credentials: 'include' };

const normalizeHeaders = (headers) => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
};

const getAuthToken = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.token) {
        return parsed.token;
      }
    }

    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      return parsedAuth?.token || '';
    }

    return '';
  } catch (error) {
    console.warn('Failed to read auth token from localStorage', error);
    return '';
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
    const message = data?.message || data?.error || res.statusText || 'Unknown API error';
    throw new Error(`API error ${res.status}: ${message}`);
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from ${res.url}: ${text.slice(0, 200)}`);
    }
  }

  throw new Error(`Unexpected response content type from ${res.url}: ${contentType || 'unknown'}\n${text.slice(0, 200)}`);
};

const buildApiUrl = (url) => {
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  const baseUrl = getBaseUrl();
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return url.startsWith(baseUrl) ? url : `${baseUrl}${url}`;
  }
  
  return url.startsWith(baseUrl) ? url : `${baseUrl}${url}`;
};

const fetchJson = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    ...normalizeHeaders(options.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fullUrl = buildApiUrl(url);
  const res = await fetch(fullUrl, { ...defaultFetchOptions, ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('user');
  }

  return parseJsonResponse(res);
};

// Get user ID from localStorage
const getUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr).id : '';
  } catch {
    return '';
  }
};

// ============ AUTH APIS ============

export const loginUser = async (email, password) => {
  return fetchJson(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const requestOtp = async (email, fullName) => {
  return fetchJson(`${BASE_URL}/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, full_name: fullName }),
  });
};

export const registerUser = async (userData) => {
  return fetchJson(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
};

export const forgotPassword = async (email) => {
  return fetchJson(`${BASE_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (email, otp, newPassword) => {
  return fetchJson(`${BASE_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  });
};

export const logoutUser = async () => {
  return fetchJson(`${BASE_URL}/logout`, {
    method: "POST",
  });
};

// ============ HOSTEL APIS ============

export const getHostels = async () => {
  return fetchJson(`${BASE_URL}/getHostels`);
};

export const createHostel = async (hostelData) => {
  return fetchJson(`${BASE_URL}/createHostel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hostelData)
  });
};

export const deleteHostel = async (hostelId) => {
  return fetchJson(`${BASE_URL}/deleteHostel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostel_id: hostelId })
  });
};

export const resetHostelRooms = async (hostelId) => {
  return fetchJson(`${BASE_URL}/resetHostelRooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostel_id: hostelId })
  });
};

export const sendMessage = async (receiverId, content) => {
  return fetchJson(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
};

export const getMessages = async (chatWithId = null) => {
  const query = chatWithId ? `?chat_with_id=${encodeURIComponent(chatWithId)}` : '';
  return fetchJson(`${BASE_URL}/messages${query}`);
};

export const subscribeToPush = async (subscription) => {
  return fetchJson(`${BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
};

// ============ ROOM APIS ============

export const getRooms = async () => {
  return fetchJson(`${BASE_URL}/getRooms`);
};

export const createRoom = async (roomData) => {
  return fetchJson(`${BASE_URL}/createRoom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(roomData)
  });
};

export const updateRoomStatus = async (roomId, available) => {
  return fetchJson(`${BASE_URL}/updateRoomStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, available })
  });
};

export const updateRoomOccupancy = async (roomId, action) => {
  return fetchJson(`${BASE_URL}/updateRoomOccupancy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, action })
  });
};

export const deleteRoom = async (roomId) => {
  return fetchJson(`${BASE_URL}/deleteRoom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId })
  });
};

export const updateRoom = async (roomId, roomData) => {
  return fetchJson(`${BASE_URL}/updateRoom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, ...roomData })
  });
};

export const updateHostel = async (hostelId, hostelData) => {
  return fetchJson(`${BASE_URL}/updateHostel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostel_id: hostelId, ...hostelData })
  });
};

export const deleteUniversity = async (universityId) => {
  return fetchJson(`${BASE_URL}/deleteUniversity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ university_id: universityId })
  });
};

// ============ BOOKING APIS ============

export const createBooking = async (roomId, hostelId, bookingDate) => {
  if (!roomId || !hostelId) {
    throw new Error('Booking requires a selected room and hostel.');
  }

  const normalizedBookingDate = bookingDate || new Date().toISOString().split('T')[0];

  return fetchJson(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      room_id: String(roomId),
      hostel_id: String(hostelId),
      booking_date: normalizedBookingDate,
    }),
  });
};

export const getUserBookings = async () => {
  return fetchJson(`${BASE_URL}/getUserBookings`, {
    method: 'GET'
  });
};

export const getAllBookings = async () => {
  return fetchJson(`${BASE_URL}/getAllBookings`, {
    method: 'GET'
  });
};

export const approveBooking = async (bookingId, status) => {
  return fetchJson(`${BASE_URL}/approveBooking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, status })
  });
};

export const verifyPayment = async (reference, bookingId) => {
  return fetchJson(`${BASE_URL}/verifyPayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, booking_id: bookingId })
  });
};

export const deleteBooking = async (bookingId) => {
  return fetchJson(`${BASE_URL}/deleteBooking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId })
  });
};

// ============ UNIVERSITY APIS ============

export const getUniversities = async () => {
  return fetchJson(`${BASE_URL}/getUniversities`);
};

export const createUniversity = async (uniData) => {
  return fetchJson(`${BASE_URL}/createUniversity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uniData)
  });
};

// ============ REVIEW APIS ============

export const getReviewsForHostel = async (hostelId) => {
  return fetchJson(`${BASE_URL}/reviews?hostel_id=${hostelId}`);
};

export const submitReview = async (reviewData) => {
  return fetchJson(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData)
  });
};

// ============ NOTIFICATION APIS ============

export const getNotifications = async () => {
  return fetchJson(`${BASE_URL}/getNotifications`, {
    method: 'GET'
  });
};

export const markNotificationRead = async (notificationId) => {
  const dbId = typeof notificationId === 'string' && notificationId.startsWith('db_')
    ? notificationId.slice(3)
    : notificationId;

  if (!dbId) {
    throw new Error('Invalid notification identifier');
  }

  return fetchJson(`${BASE_URL}/markNotificationRead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ db_id: dbId })
  });
};

// ============ IMAGE UPLOAD (if needed) ============

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return fetchJson(`${BASE_URL}/uploadImage`, {
    method: 'POST',
    body: formData
  });
};

// ============ ROOMMATE APIS ============

export const getRoommateProfile = async () => {
  return fetchJson(`${BASE_URL}/roommate/profile`);
};

export const saveRoommateProfile = async (profileData) => {
  return fetchJson(`${BASE_URL}/roommate/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
};

export const getRoommateMatches = async () => {
  return fetchJson(`${BASE_URL}/roommate/matches`);
};

// ============ PAYMENT ENHANCEMENT APIS ============

export const getSavedCard = async () => {
  return fetchJson(`${BASE_URL}/getSavedCard`, { method: 'GET' });
};

export const chargeCard = async (bookingId) => {
  return fetchJson(`${BASE_URL}/chargeCard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId })
  });
};

export const getPayoutStats = async () => {
  return fetchJson(`${BASE_URL}/getPayoutStats`, { method: 'GET' });
};
