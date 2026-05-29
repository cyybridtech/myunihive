import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserBookings, getNotifications, getAllBookings, getUniversities, getHostels, getRooms, submitReview, deleteBooking as deleteBookingApi, markNotificationRead as markNotificationReadApi } from '../api/api.js';
import {
  User, Booking, Notification, Message, Hostel, Room, Review, University,
  sampleBookings, sampleNotifications, sampleMessages, reviews as initialReviews,
} from '../data/mockData';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  selectedUniversity: string;
  bookings: Booking[];
  notifications: Notification[];
  messages: Message[];
  hostels: Hostel[];
  rooms: Room[];
  filteredHostels: Hostel[];
  filteredRooms: Room[];
  reviews: Review[];
  universities: University[];
  savedHostels: string[];
  logout: () => void;
  setSelectedUniversity: (id: string) => void;
  addUniversity: (uni: University) => void;
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  updatePaymentStatus: (id: string, status: Booking['paymentStatus']) => void;
  removeBooking: (id: string) => void;
  cancelBooking: (bookingId: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  addReview: (review: Review) => void;
  sendMessage: (msg: Message) => void;
  markNotificationRead: (notification: Notification) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  toggleSaveHostel: (id: string) => void;
  addHostel: (hostel: Hostel) => void;
  addRoom: (room: Room) => void;
  deleteHostel: (id: string) => void;
  deleteRoom: (id: string) => void;
  deleteUniversity: (id: string) => void;
  updateRoom: (room: Room) => void;
  updateHostel: (hostel: Hostel) => void;
}

const AppContext = createContext<AppState>({} as AppState);

export const useApp = () => useContext(AppContext);

// Helper: map raw DB booking row → typed Booking
function mapBooking(b: any): Booking {
  return {
    id: String(b.id),
    userId: String(b.user_id),
    roomId: String(b.room_id),
    hostelId: String(b.hostel_id),
    bookingDate: b.booking_date,
    status: b.status ?? 'pending',
    paymentStatus: b.payment_status ?? 'unpaid',
    reservationFee: parseFloat(b.reservation_fee || 0),
    totalPrice: parseFloat(b.total_price || 0),
    authCode: b.auth_code || b.authCode || undefined,
    userName: b.user_name || b.userName || undefined,
    userGender: b.user_gender || b.userGender || undefined,
    roomNumber: b.roomNumber || b.room_number || undefined,
    roomType: b.room_type || b.roomType || undefined,
    hostelName: b.hostel_name || b.hostelName || undefined,
  };
}

function mapHostel(h: any): Hostel {
  return {
    ...h,
    id: String(h.id),
    universityId: String(h.universityId || h.university_id),
    managerId: h.managerId || h.manager_id ? String(h.managerId || h.manager_id) : undefined,
    rating: parseFloat(h.rating || 0),
    reviewCount: parseInt(h.reviewCount || h.review_count || 0),
    platformFee: parseFloat(h.platformFee || h.platform_fee || 0),
  };
}

function mapRoom(r: any): Room {
  return {
    ...r,
    id: String(r.id),
    hostelId: String(r.hostelId || r.hostel_id),
    price: parseFloat(r.price || 0),
    capacity: parseInt(r.capacity || 0),
    occupancy: parseInt(r.occupancy || 0),
    manualOccupancy: parseInt(r.manual_occupancy || r.manualOccupancy || 0),
    gender: r.gender || 'unisex'
  };
}

// Helper: map raw Auth user → typed mockData User
function mapAuthUser(authUser: any): User {
  const isManagerRole = authUser.role === 'manager' || authUser.role === 'hostel_manager';
  return {
    id: String(authUser.id),
    name: authUser.full_name || authUser.name || '',
    email: authUser.email || '',
    phone: authUser.phone || '',
    universityId: authUser.university_id || authUser.universityId || 'u1',
    role: authUser.role === 'admin' ? 'admin' : isManagerRole ? 'manager' : 'student',
    gender: authUser.gender || authUser.user_gender || undefined,
    avatar: authUser.avatar || (authUser.email?.[0]?.toUpperCase() ?? '?'),
    credits: Number(authUser.credits) || 0,
    joinDate: (authUser.created_at ?? authUser.joinDate ?? new Date().toISOString()).split('T')[0],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('selectedUniversity') || 'u1' : 'u1';
  });
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [universities, setUniversities] = useState<University[]>([]);
  const [savedHostels, setSavedHostels] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('savedHostels');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadUniversities = async () => {
    try {
      const res: any = await getUniversities();
      if (res.status === 'success' && res.universities) {
        setUniversities(res.universities.map((u: any) => ({ ...u, id: String(u.id) })));
      }
    } catch (e: any) {
      console.error('Failed to load universities', e);
    }
  };

  const loadHostels = async () => {
    try {
      const res: any = await getHostels();
      if (res.status === 'success' && res.hostels) {
        setHostels(res.hostels.map(mapHostel));
      }
    } catch (e: any) {
      console.error('Failed to load hostels', e);
    }
  };

  const loadRooms = async () => {
    try {
      const res: any = await getRooms();
      if (res.status === 'success' && res.rooms) {
        setRooms(res.rooms.map(mapRoom));
      }
    } catch (e: any) {
      console.error('Failed to load rooms', e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res: any = await getNotifications();
      if (res.status === 'success' && res.notifications) setNotifications(res.notifications);
    } catch (e: any) {
      console.error('Failed to load notifications', e);
      setNotifications(sampleNotifications);
    }
  };

  const refreshData = async (): Promise<void> => {
    await Promise.all([loadHostels(), loadRooms()]);
  };

  const refreshNotifications = async (): Promise<void> => {
    await loadNotifications();
  };

  // Load static data (universities, hostels, rooms)
  useEffect(() => {
    loadUniversities();
    loadHostels();
    loadRooms();
  }, []);

  useEffect(() => {
    // Auto-refresh data for all users every 30 seconds so the app always feels live
    const interval = window.setInterval(() => {
      refreshData();
      if (auth.user) {
        refreshBookings();
        refreshNotifications();
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [auth.user]);

  // Sync user + bookings + notifications whenever auth.user changes
  useEffect(() => {
    if (auth.user && !auth.user.token) {
      console.warn('Auth user exists without token; clearing login state');
      auth.logout();
      return;
    }

    if (auth.user) {
      const mappedUser = mapAuthUser(auth.user);
      setUser(mappedUser);

      const fetchBookings = async () => {
        try {
          const isManagerRole = mappedUser.role === 'admin' || mappedUser.role === 'manager' || mappedUser.role === 'hostel_manager';
          const response: any = isManagerRole ? await getAllBookings() : await getUserBookings();

          if (response.status === 'success' && response.bookings) {
            setBookings(response.bookings.map(mapBooking));
          } else {
            setBookings([]);
          }
        } catch (error) {
          console.error('Bookings fetch error:', error);
          setBookings([]);
        }
      };

      fetchBookings();

      getNotifications()
        .then((response: any) => {
          console.log('getNotifications response:', response);
          if (response.status === 'success' && response.notifications) {
            setNotifications(response.notifications);
          } else {
            console.error('Notifications API error:', response);
            setNotifications(sampleNotifications);
          }
        })
        .catch((error: any) => {
          console.error('Notifications fetch error:', error);
          setNotifications(sampleNotifications);
        });
    } else {
      setUser(null);
      setBookings([]);
      setNotifications([]);
    }
  }, [auth.user]);


  const logout = () => {
    auth.logout();
  };

  const addBooking = (booking: Booking) => {
    // Optimistically add/update booking in local state
    const mappedBooking = mapBooking({
        ...booking,
        user_id: booking.userId || (booking as any).user_id,
        room_id: booking.roomId || (booking as any).room_id,
        hostel_id: booking.hostelId || (booking as any).hostel_id,
        reservation_fee: booking.reservationFee || (booking as any).reservation_fee,
        total_price: booking.totalPrice || (booking as any).total_price,
        payment_status: booking.paymentStatus || (booking as any).payment_status,
        auth_code: booking.authCode || (booking as any).auth_code,
        hostel_name: booking.hostelName || (booking as any).hostel_name,
        room_number: booking.roomNumber || (booking as any).room_number,
        room_type: booking.roomType || (booking as any).room_type
    });

    setBookings(prev => {
      const exists = prev.some(b => String(b.id) === String(mappedBooking.id));
      if (exists) {
        return prev.map(b => String(b.id) === String(mappedBooking.id) ? { ...b, ...mappedBooking } : b);
      }
      return [mappedBooking, ...prev];
    });

    setNotifications(prev => [...prev, {
      id: 'n_' + Date.now(),
      userId: booking.userId,
      title: booking.paymentStatus === 'paid' ? 'Payment Successful' : 'Booking Submitted',
      message: booking.paymentStatus === 'paid'
        ? `Your payment of GH₵${booking.totalPrice} has been confirmed.`
        : `Your booking was submitted. Pay from your dashboard to secure your room.`,
      type: 'booking' as const,
      read: false,
      date: new Date().toISOString().split('T')[0],
    }]);
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updatePaymentStatus = (id: string, status: Booking['paymentStatus']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, paymentStatus: status } : b));
  };

  const removeBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const response: any = await deleteBookingApi(bookingId);
      if (response.status === 'success') {
        removeBooking(bookingId);
        return;
      }
      throw new Error(response.message || 'Cancel booking failed');
    } catch (error: any) {
      console.error('Cancel booking failed:', error);
      throw error;
    }
  };

  const refreshBookings = async (): Promise<void> => {
    try {
      const isManagerRole = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'hostel_manager';
      const response: any = isManagerRole ? await getAllBookings() : await getUserBookings();
      if (response.status === 'success' && response.bookings) {
        setBookings(response.bookings.map(mapBooking));
      }
    } catch (e: any) {
      console.error('refreshBookings failed', e);
    }
  };

  const filteredHostels = useMemo(() => {
    if (!user) {
      return hostels;
    }
    const isManagerRole = user.role === 'manager' || user.role === 'hostel_manager';
    if (!isManagerRole) {
      return hostels;
    }
    return hostels.filter(h => String(h.managerId) === String(user.id));
  }, [hostels, user]);

  const filteredRooms = useMemo(() => {
    if (!user) {
      return rooms;
    }
    const isManagerRole = user.role === 'manager' || user.role === 'hostel_manager';
    if (!isManagerRole) {
      return rooms;
    }
    const managerHostelIds = new Set(filteredHostels.map(h => h.id));
    return rooms.filter(r => managerHostelIds.has(r.hostelId));
  }, [rooms, filteredHostels, user]);

  const addReview = async (review: Review) => {
    // Optimistic update
    setReviews(prev => [...prev, review]);
    
    if (user) {
      try {
        await submitReview({
          user_id: Number(user.id),
          hostel_id: review.hostelId,
          rating: review.rating,
          comment: review.comment || ''
        });
        // Success - ratings will refresh via getHostels
      } catch (error) {
        // Rollback on failure
        setReviews(prev => prev.filter(r => r.id !== review.id));
        console.error('Review submit failed:', error);
      }
    }
  };

  const sendMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const markNotificationRead = async (notification: Notification) => {
    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));

    const dbId = notification.dbId ?? (typeof notification.id === 'string' && notification.id.startsWith('db_')
      ? Number(notification.id.slice(3))
      : undefined);

    if (dbId) {
      try {
        await markNotificationReadApi(dbId);
      } catch (error: any) {
        console.error('Failed to persist notification read status:', error);
        setNotifications(previousNotifications);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      await Promise.all(unreadNotifications.map(async notification => {
        const dbId = notification.dbId ?? (typeof notification.id === 'string' && notification.id.startsWith('db_')
          ? Number(notification.id.slice(3))
          : undefined);

        if (dbId) {
          await markNotificationReadApi(dbId);
        }
      }));
    } catch (error: any) {
      console.error('Failed to persist all notification read states:', error);
      setNotifications(previousNotifications);
    }
  };

  const toggleSaveHostel = (hostelId: string | number) => {
    const id = String(hostelId);
    setSavedHostels(prev => {
      const next = prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id];
      localStorage.setItem('savedHostels', JSON.stringify(next));
      return next;
    });
  };

  const addUniversity = (uni: University) => {
    setUniversities(prev => [...prev, uni]);
  };

  const addHostel = (hostel: Hostel) => {
    setHostels(prev => [...prev, hostel]);
  };

  const addRoom = (room: Room) => {
    setRooms(prev => [...prev, room]);
  };

  const deleteHostel = (id: string) => {
    setHostels(prev => prev.filter(h => h.id !== id));
    setRooms(prev => prev.filter(r => r.hostelId !== id));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const deleteUniversity = (id: string) => {
    setUniversities(prev => prev.filter(u => u.id !== id));
    setHostels(prev => {
      const deletedHostelIds = new Set(prev.filter(h => h.universityId === id).map(h => h.id));
      setRooms(currentRooms => currentRooms.filter(r => !deletedHostelIds.has(r.hostelId)));
      return prev.filter(h => h.universityId !== id);
    });
  };

  const updateRoom = (room: Room) => {
    setRooms(prev => prev.map(r => r.id === room.id ? room : r));
  };

  const updateHostel = (hostel: Hostel) => {
    setHostels(prev => prev.map(h => h.id === hostel.id ? hostel : h));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedUniversity', selectedUniversity);
    }
  }, [selectedUniversity]);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      selectedUniversity,
      bookings,
      notifications,
      messages,
      hostels,
      rooms,
      reviews,
      universities,
      savedHostels,
      logout,
      setSelectedUniversity,
      isManager: user?.role === 'manager' || user?.role === 'hostel_manager',
      filteredHostels,
      filteredRooms,
      addUniversity,
      addBooking,
      updateBookingStatus,
      updatePaymentStatus,
      refreshBookings,
      refreshData,
      refreshNotifications,
      addReview,
      sendMessage,
      removeBooking,
      cancelBooking,
      markNotificationRead,
      markAllNotificationsRead,
      toggleSaveHostel,
      addHostel,
      addRoom,
      deleteHostel,
      deleteRoom,
      deleteUniversity,
      updateRoom,
      updateHostel,
    }}>
      {children}
    </AppContext.Provider>
  );
}
