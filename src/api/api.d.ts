// Type declarations for api.js (JavaScript module without TypeScript source)

export interface IdVerificationResponse {
  status: 'success' | 'warning' | 'error';
  match_score: number;
  extracted: {
    name: string;
    age: number;
    gender: string;
  };
  raw_text: string;
}

export declare const loginUser: (email: string, password: string) => Promise<any>;
export declare const registerUser: (userData: any) => Promise<any>;
export declare const requestOtp: (email: string, fullName?: string, type?: 'register' | 'login') => Promise<any>;
export declare const forgotPassword: (email: string) => Promise<any>;
export declare const resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
export declare const logoutUser: () => Promise<any>;

export declare const createBooking: (roomId: string, hostelId: string, bookingDate: string) => Promise<any>;
export declare const getUserBookings: () => Promise<any>;
export declare const getAllBookings: () => Promise<any>;
export declare const deleteBooking: (bookingId: string | number) => Promise<any>;
export declare const approveBooking: (bookingId: string | number, status: string) => Promise<any>;
export declare const verifyPayment: (reference: string, bookingId: string | number) => Promise<any>;

export declare const getNotifications: () => Promise<any>;
export declare const markNotificationRead: (notificationId: string | number) => Promise<any>;
export declare const deleteNotification: (notificationId: string | number) => Promise<any>;

export declare const createHostel: (hostelData: any) => Promise<any>;
export declare const getHostels: () => Promise<any>;
export declare const deleteHostel: (hostelId: string) => Promise<any>;
export declare const updateHostel: (hostelId: string, hostelData: any) => Promise<any>;
export declare const resetHostelRooms: (hostelId: string) => Promise<any>;

export declare const createRoom: (roomData: any) => Promise<any>;
export declare const getRooms: () => Promise<any>;
export declare const updateRoomStatus: (roomId: string, available: boolean) => Promise<any>;
export declare const updateRoomOccupancy: (roomId: string, action: 'increment' | 'decrement') => Promise<any>;
export declare const deleteRoom: (roomId: string) => Promise<any>;
export declare const updateRoom: (roomId: string, roomData: any) => Promise<any>;

export declare const getUniversities: () => Promise<any>;
export declare const createUniversity: (uniData: any) => Promise<any>;
export declare const updateUniversity: (id: string, uniData: any) => Promise<any>;
export declare const deleteUniversity: (universityId: string) => Promise<any>;

export declare const getReviewsForHostel: (hostelId: string) => Promise<any>;
export declare const submitReview: (reviewData: any) => Promise<any>;

export declare const uploadImage: (file: File) => Promise<any>;

export declare const getMessages: (chatWithId?: string | null) => Promise<any>;
export declare const sendMessage: (receiverId: string, content: string) => Promise<any>;
export declare const subscribeToPush: (subscription: any) => Promise<any>;

export declare const getRoommateProfile: () => Promise<any>;
export declare const saveRoommateProfile: (profileData: any) => Promise<any>;
export declare const getRoommateMatches: () => Promise<any>;

export declare const getSavedCard: () => Promise<any>;
export declare const chargeCard: (bookingId: string | number) => Promise<any>;
export declare const getPayoutStats: () => Promise<any>;

export declare const getPlatformStats: () => Promise<any>;
export declare const updateUserProfile: (userData: any) => Promise<any>;
export declare const changeUserPassword: (passwordData: any) => Promise<any>;
