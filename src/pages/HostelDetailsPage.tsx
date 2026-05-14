import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  CheckCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Shield,
  Zap,
  Droplets,
  BookOpen,
  X,
  Users,
  DoorOpen,
  ArrowLeft
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import {
  createBooking,
  verifyPayment,
  submitReview,
  deleteBooking
} from '../api/api.js';

const PAYSTACK_PUBLIC_KEY =
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
  'pk_live_f8ea7f2de573926d15775e4fae12d7cdc020b7ee';

export default function HostelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    filteredRooms,
    isAuthenticated,
    savedHostels,
    user,
    hostel,
    hostelRooms,
    hostelReviews,
    toggleSaveHostel,
    refreshBookings,
    refreshNotifications,
    refreshData,
    addBooking,
    removeBooking,
    addReview,
  } = useApp();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const [roomGenderFilter, setRoomGenderFilter] = useState<
    'all' | 'male' | 'female'
  >((user?.gender as 'all' | 'male' | 'female') || 'all');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Hostel not found
          </h2>

          <button
            onClick={() => navigate('/hostels')}
            className="text-amber-600 font-medium"
          >
            Back to hostels
          </button>
        </div>
      </div>
    );
  }

  // SAFE FALLBACKS
  const safeGallery = hostel?.gallery || [];
  const safeFacilities = hostel?.facilities || [];
  const safeHostelReviews = hostelReviews || [];
  const safeHostelRooms = hostelRooms || [];
  const safeFilteredRooms = filteredRooms || [];

  const selectedRoomData = selectedRoom
    ? safeFilteredRooms.find((r) => r.id === selectedRoom)
    : undefined;

  const filteredHostelRooms = safeHostelRooms.filter((room) => {
    if (roomGenderFilter === 'all') return true;
    return room.gender === roomGenderFilter;
  });

  const hiddenRoomCount =
    safeHostelRooms.length - filteredHostelRooms.length;

  useEffect(() => {
    if (
      selectedRoom &&
      !filteredHostelRooms.some((room) => room.id === selectedRoom)
    ) {
      setSelectedRoom(null);
    }
  }, [filteredHostelRooms, selectedRoom]);

  const facilityIcons: Record<string, typeof Wifi> = {
    WiFi: Wifi,
    Security: Shield,
    Generator: Zap,
    'Water Tank': Droplets,
    'Study Room': BookOpen,
  };

  const isSaved = (savedHostels || []).includes(hostel.id);

  const cleanupPendingBooking = async (bookingId: string) => {
    try {
      const response = await deleteBooking(bookingId);

      if (response.status === 'success') {
        removeBooking(bookingId);
      }
    } catch (error) {
      console.warn('Unable to cleanup pending booking', error);
    }
  };

  const handleBookRoom = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedRoom) return;

    const room = selectedRoomData;

    if (!room) return;

    const bookingDate = new Date().toISOString().split('T')[0];

    let bookingId: string | null = null;

    try {
      const response = await createBooking(
        selectedRoom,
        hostel.id,
        bookingDate
      );

      if (response.status !== 'success' || !response.booking_id) {
        throw new Error(response.message || 'Booking failed');
      }

      bookingId = response.booking_id;

      if (!(window as any).PaystackPop) {
        throw new Error(
          'Payment system initializing... Please refresh and try again.'
        );
      }

      const PLATFORM_FEE_PERCENTAGE = 0.05;

      const platformFee = Math.round(
        room.price * PLATFORM_FEE_PERCENTAGE
      );

      const totalAmount = room.price + platformFee;

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user?.email,
        amount: totalAmount * 100,
        currency: 'GHS',

        ...(hostel.subaccountCode
          ? {
              subaccount: hostel.subaccountCode,
              transaction_charge: platformFee * 100,
              bearer: 'account',
            }
          : {}),

        reference:
          'BK_' +
          Math.floor(Math.random() * 1000000000 + 1).toString(),

        callback: function (paystackResponse: any) {
          verifyPayment(
            paystackResponse.reference,
            bookingId as string
          )
            .then((verification) => {
              if (verification.status === 'success') {
                addBooking({
                  id: bookingId as string,
                  userId: user!.id,
                  roomId: selectedRoom,
                  hostelId: hostel.id,
                  bookingDate,
                  status: 'approved',
                  paymentStatus: 'paid',
                  reservationFee: totalAmount,
                  totalPrice: totalAmount,
                });

                refreshBookings();
                refreshNotifications();
                refreshData();

                setBookingSuccess(true);
              } else {
                alert(
                  verification.message ||
                    'Payment verification failed'
                );
              }
            })
            .catch((error: any) => {
              console.error(error);

              alert(
                'Payment completed but verification failed.'
              );
            });
        },

        onClose: function () {
          if (bookingId) {
            cleanupPendingBooking(bookingId);
          }

          alert(
            'Payment window closed. You can complete payment later.'
          );

          setBookingSuccess(true);
        },
      });

      handler.openIframe();
    } catch (error: any) {
      console.error(error);

      if (bookingId) {
        cleanupPendingBooking(bookingId);
      }

      alert(
        'System Error: ' +
          (error.message || 'Unknown error')
      );
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return;

    setLoadingReview(true);

    try {
      const response = await submitReview({
        hostel_id: hostel.id,
        rating: reviewRating,
        comment: reviewComment,
      });

      if (response.status === 'success') {
        addReview({
          id: response.review_id.toString(),
          userId: user.id,
          hostelId: hostel.id,
          rating: reviewRating,
          comment: reviewComment,
          date: new Date().toISOString().split('T')[0],
          userName: user.name,
          userAvatar: user.avatar,
        });

        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      alert(error.message || 'Network error');
    } finally {
      setLoadingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <div className="relative bg-black">

        <button
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="relative h-[300px] md:h-[450px] overflow-hidden">

          <img
            src={
              typeof safeGallery?.[activeImage] === 'string'
                ? safeGallery?.[activeImage]
                : safeGallery?.[activeImage]?.url
            }
            alt={hostel.name}
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-4 left-4 text-white">
            <span className="bg-black/50 px-3 py-1 rounded-full text-sm">
              {activeImage + 1} / {safeGallery.length}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2">

            <button
              onClick={() =>
                setActiveImage(
                  (prev) =>
                    (prev - 1 + safeGallery.length) %
                    safeGallery.length
                )
              }
              className="bg-white/90 p-2 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                setActiveImage(
                  (prev) =>
                    (prev + 1) % safeGallery.length
                )
              }
              className="bg-white/90 p-2 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* THUMBNAILS */}
        <div className="flex gap-2 p-2 bg-gray-900 overflow-x-auto">

          {safeGallery.map((img: any, i: number) => (

            <button
              key={i}
              onClick={() => setActiveImage(i)}
              className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${
                i === activeImage
                  ? 'border-amber-500'
                  : 'border-transparent opacity-60'
              }`}
            >
              <img
                src={typeof img === 'string' ? img : img?.url}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>

          ))}

        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">

            {/* HEADER */}
            <div>

              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-3 mb-2">

                    <h1 className="text-3xl font-bold text-gray-900">
                      {hostel.name}
                    </h1>

                    {hostel.verified && (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}

                  </div>

                  <p className="text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {hostel.address}
                  </p>

                </div>

                {isAuthenticated && (
                  <button
                    onClick={() =>
                      toggleSaveHostel(hostel.id)
                    }
                    className={`p-3 rounded-full border ${
                      isSaved
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isSaved ? 'fill-red-500' : ''
                      }`}
                    />
                  </button>
                )}

              </div>

              <div className="flex items-center gap-1 mt-3">

                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(hostel.rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}

                <span className="font-bold ml-1">
                  {hostel.rating}
                </span>

              </div>

            </div>

            {/* DESCRIPTION */}
            <div className="bg-white rounded-2xl p-6 border">

              <h2 className="text-xl font-bold mb-3">
                About this hostel
              </h2>

              <p className="text-gray-600 leading-relaxed">
                {hostel.description}
              </p>

            </div>

            {/* FACILITIES */}
            <div className="bg-white rounded-2xl p-6 border">

              <h2 className="text-xl font-bold mb-4">
                Facilities & Amenities
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

                {safeFacilities.map((f: string) => {

                  const Icon =
                    facilityIcons[f] || CheckCircle;

                  return (
                    <div
                      key={f}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <Icon className="w-5 h-5 text-amber-500" />

                      <span className="text-sm font-medium">
                        {f}
                      </span>
                    </div>
                  );
                })}

              </div>

            </div>

            {/* ROOMS */}
            <div className="bg-white rounded-2xl p-6 border">

              <div className="flex justify-between items-center mb-4">

                <h2 className="text-xl font-bold">
                  Available Rooms
                </h2>

                <select
                  value={roomGenderFilter}
                  onChange={(e) =>
                    setRoomGenderFilter(
                      e.target.value as any
                    )
                  }
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

                {filteredHostelRooms.map((room: any) => (

                  <div
                    key={room.id}
                    className={`border rounded-xl p-4 ${
                      selectedRoom === room.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      if (room.available) {
                        setSelectedRoom(room.id);
                      }
                    }}
                  >

                    <img
                      src={room.image}
                      alt={room.type}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />

                    <div className="flex justify-between items-start">

                      <div>
                        <h3 className="font-bold">
                          {room.type}
                        </h3>

                        <p className="text-sm text-gray-500">
                          Room {room.roomNumber}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-amber-600">
                          GH₵
                          {room.price?.toLocaleString()}
                        </p>

                        <p className="text-xs text-gray-400">
                          per semester
                        </p>
                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* SIDEBAR */}
          <div>

            <div className="bg-white rounded-2xl p-6 border sticky top-20">

              <div className="text-center mb-5">

                <p className="text-sm text-gray-500">
                  Price Range
                </p>

                <p className="text-2xl font-bold text-amber-600">
                  {hostel.priceRange}
                </p>

              </div>

              {selectedRoom ? (
                <div className="bg-amber-50 rounded-xl p-4 mb-5">

                  <p className="text-sm text-gray-500">
                    Selected Room
                  </p>

                  <p className="font-bold">
                    {selectedRoomData?.type}
                  </p>

                  <p className="text-amber-600 font-bold">
                    GH₵
                    {selectedRoomData?.price?.toLocaleString()}
                  </p>

                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center mb-5">
                  Select a room to continue
                </p>
              )}

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                    return;
                  }

                  if (selectedRoom) {
                    setShowBookingModal(true);
                  }
                }}
                disabled={!selectedRoom}
                className={`w-full py-3 rounded-xl font-bold ${
                  selectedRoom
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isAuthenticated
                  ? 'Book This Room'
                  : 'Sign In to Book'}
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}