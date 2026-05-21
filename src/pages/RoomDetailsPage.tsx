import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, CheckCircle, Heart, ArrowLeft, Wifi, Shield, Zap, Droplets, BookOpen, Users, DoorOpen, CreditCard, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createBooking, verifyPayment, deleteBooking } from '../api/api.js';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_f8ea7f2de573926d15775e4fae12d7cdc020b7ee';

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { filteredRooms, hostels, universities, isAuthenticated, user, addBooking, removeBooking, refreshBookings, refreshData, refreshNotifications, toggleSaveHostel, savedHostels } = useApp();
  const room = filteredRooms.find(r => r.id === id);
  const hostel = room ? hostels.find(h => h.id === room.hostelId) : undefined;
  const university = hostel ? universities.find(u => u.id === hostel.universityId) : undefined;

  const [activeImage, setActiveImage] = useState(0);
  const [bookingState, setBookingState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [bookingError, setBookingError] = useState('');
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    setActiveImage(0);
  }, [room?.id]);

  if (!room || !hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Room not found</h2>
          <p className="text-gray-500 mb-4">The room you tried to open may no longer exist or has been moved.</p>
          <button onClick={() => navigate('/hostels')} className="inline-flex items-center px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">Back to hostels</button>
        </div>
      </div>
    );
  }

  const gallery = (room.gallery && room.gallery.length > 0) 
    ? room.gallery 
    : [room.image, ...(hostel.gallery || [])].filter(Boolean);
  const isSaved = savedHostels.includes(hostel.id);
  const facilityIcons: Record<string, typeof Wifi> = { WiFi: Wifi, Security: Shield, Generator: Zap, 'Water Tank': Droplets, 'Study Room': BookOpen };

  const handleBookRoom = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowBookingConfirm(true);
  };

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

  const confirmBooking = async () => {
    if (!room || !hostel) return;

    setBookingState('processing');
    setBookingError('');
    setShowBookingConfirm(false);

    const bookingDate = new Date().toISOString().split('T')[0];
    let bookingId = '';

    try {
      const response = await createBooking(room.id, hostel.id, bookingDate);

      if (response.status !== 'success' || !response.booking_id) {
        throw new Error(response.message || 'Booking could not be created');
      }

      bookingId = response.booking_id;

      if (!(window as any).PaystackPop) {
        throw new Error('Payment system not available. Refresh the page and try again.');
      }

      const totalAmount = hostel.commissionType === 'flat' ? room.price + (hostel.platformFee || 0) : room.price;

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user?.email,
        amount: totalAmount * 100,
        currency: 'GHS',
        ...(hostel.subaccountCode ? { subaccount: hostel.subaccountCode } : {}),
        ...(hostel.commissionType === 'flat' && hostel.platformFee ? { transaction_charge: hostel.platformFee * 100 } : {}),
        reference: 'BK_' + Math.floor((Math.random() * 1000000000) + 1).toString(),
        callback: function (paystackResponse: any) {
          verifyPayment(paystackResponse.reference, bookingId)
            .then(verification => {
              const paid = verification.status === 'success';
              addBooking({
                id: bookingId,
                userId: user!.id,
                roomId: room.id,
                hostelId: hostel.id,
                bookingDate,
                status: paid ? 'approved' : 'pending',
                paymentStatus: paid ? 'paid' : 'unpaid',
                reservationFee: room.price,
                totalPrice: totalAmount,
              });
              setBookingState('success');
              refreshBookings();
              refreshNotifications();
              refreshData();
            })
            .catch(error => {
              setBookingError(error.message || 'Payment verification failed');
              setBookingState('failed');
            });
        },
        onClose: () => {
          if (bookingId) {
            cleanupPendingBooking(bookingId);
          }
          setBookingError('Payment window closed before completion. You can pay later from your dashboard.');
          setBookingState('failed');
        }
      });

      handler.openIframe();
    } catch (error: any) {
      setBookingError(error.message || 'Booking failed');
      setBookingState('failed');
      if (bookingId && user) {
        const totalAmount = hostel.commissionType === 'flat' ? room.price + (hostel.platformFee || 0) : room.price;
        addBooking({
          id: bookingId,
          userId: user.id,
          roomId: room.id,
          hostelId: hostel.id,
          bookingDate,
          status: 'pending',
          paymentStatus: 'unpaid',
          reservationFee: room.price,
          totalPrice: totalAmount,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-800">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Room {room.roomNumber} – {room.type}</h1>
            <p className="mt-2 text-sm text-gray-500">{hostel.name} • {university?.name || 'University'} • {hostel.address}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button onClick={() => toggleSaveHostel(hostel.id)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isSaved ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500' : ''}`} /> {isSaved ? 'Saved' : 'Save hostel'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="relative h-[380px] bg-black/5 cursor-pointer" onClick={() => setShowGallery(true)}>
              <img src={typeof gallery[activeImage] === 'string' ? gallery[activeImage] : (gallery[activeImage] as any)?.url} alt={`Room image ${activeImage + 1}`} className="w-full h-full object-cover" />
              {(typeof gallery[activeImage] === 'object' && (gallery[activeImage] as any)?.desc) && (
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm shadow-lg z-10">
                  {(gallery[activeImage] as any).desc}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white text-sm rounded-full bg-black/40 px-3 py-1">{activeImage + 1} / {gallery.length}</div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                {gallery.map((img, index) => (
                  <button key={index} onClick={e => { e.stopPropagation(); setActiveImage(index); }} className={`w-16 h-12 overflow-hidden rounded-xl border relative group ${index === activeImage ? 'border-amber-400' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={typeof img === 'string' ? img : (img as any).url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-600 font-semibold">GH₵{room.price.toLocaleString()}</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">Room {room.roomNumber}</h2>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${room.available ? 'text-green-700' : 'text-red-600'}`}>{room.available ? 'Available' : 'Occupied'}</p>
                <p className="text-xs text-gray-500">{room.capacity} {room.capacity === 1 ? 'bed' : 'beds'}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mb-6">
              <div className="rounded-3xl bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3"><Users className="w-4 h-4" /> Capacity</div>
                <p className="text-lg font-semibold text-gray-900">{room.capacity} {room.capacity === 1 ? 'person' : 'people'}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3"><DoorOpen className="w-4 h-4" /> Room number</div>
                <p className="text-lg font-semibold text-gray-900">{room.roomNumber}</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Room details</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{room.description || `Comfortable ${room.type.toLowerCase()} room near campus with ${hostel.name}.`}</p>
                
                {(room as any).amenities && (room as any).amenities.length > 0 && (
                  <div>
                    <h4 className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-3">Room Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(room as any).amenities.map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-3">Gender</p>
                  <p className="text-base font-semibold text-gray-900 capitalize">{room.gender}</p>
                </div>
                <div className="rounded-3xl bg-gray-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-3">Hostel</p>
                  <p className="text-base font-semibold text-gray-900">{hostel.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hostel facilities</h3>
                <p className="text-sm text-gray-500">Shared amenities available at this location.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400">{university?.name}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {hostel.facilities.map(facility => {
                const Icon = facilityIcons[facility] || CheckCircle;
                return (
                  <div key={facility} className="flex items-center gap-3 rounded-3xl border border-gray-100 p-4 bg-gray-50">
                    <Icon className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{facility}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bed setup</h3>
                <p className="text-sm text-gray-500">Visualize room capacity and comfort.</p>
              </div>
              <div className="text-sm font-semibold text-amber-600">{room.capacity} {room.capacity === 1 ? 'bed' : 'beds'}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: room.capacity }, (_, index) => (
                <div key={index} className="h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">Bed {index + 1}</div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="sticky top-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-gray-500">Start your reservation</p>
                <p className="text-3xl font-bold text-amber-600">GH₵{(hostel.commissionType === 'flat' ? room.price + (hostel.platformFee || 0) : room.price).toLocaleString()}</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {room.available ? 'Available' : 'Occupied'}
              </div>
            </div>
            <div className="space-y-4 mb-4">
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Hostel</p>
                <p className="font-semibold text-gray-900">{hostel.name}</p>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">University</p>
                <p className="font-semibold text-gray-900">{university?.name || 'N/A'}</p>
              </div>
            </div>
            {bookingError && (
              <div className="rounded-3xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{bookingError}</div>
            )}
            <button onClick={handleBookRoom} disabled={!room.available || bookingState === 'processing'} className={`w-full rounded-3xl py-4 text-sm font-bold transition ${room.available ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
              {bookingState === 'processing' ? 'Processing...' : room.available ? 'Book this room' : 'Room unavailable'}
            </button>
            <p className="text-xs text-gray-500 mt-3">Bookings are secured with Paystack. Keep your student ID ready if requested.</p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Hostel snapshot</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> {hostel.address}</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-500" /> {hostel.verified ? 'Verified property' : 'Unverified listing'}</div>
              <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /> Full rent paid online</div>
            </div>
          </div>
        </aside>
      </div>

      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <button aria-label="Close gallery" onClick={() => setShowGallery(false)} className="absolute top-6 right-6 rounded-full bg-white/90 p-3 hover:bg-white"><X className="w-5 h-5 text-gray-800" /></button>
          <img src={typeof gallery[activeImage] === 'string' ? gallery[activeImage] : (gallery[activeImage] as any)?.url} alt={`Gallery image ${activeImage + 1}`} className="max-h-full max-w-full object-contain rounded-3xl" />
          {(typeof gallery[activeImage] === 'object' && (gallery[activeImage] as any)?.desc) && (
            <div className="absolute bottom-12 text-white bg-black/60 px-4 py-2 rounded-xl text-lg font-medium shadow-lg">
              {(gallery[activeImage] as any).desc}
            </div>
          )}
        </div>
      )}

      {showBookingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Confirm your booking</h3>
              <button aria-label="Close confirmation modal" onClick={() => setShowBookingConfirm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Room</p>
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900">{room.type} • Room {room.roomNumber}</p>
                  <p className="font-semibold text-gray-900">GH₵{room.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Hostel</p>
                <p className="font-semibold text-gray-900">{hostel.name}</p>
              </div>
              {hostel.commissionType === 'flat' && hostel.platformFee ? (
                <div className="rounded-3xl bg-gray-50 p-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">Platform Fee</p>
                  <p className="font-semibold text-gray-900">GH₵{hostel.platformFee.toLocaleString()}</p>
                </div>
              ) : null}
              <div className="rounded-3xl bg-amber-50 p-4 flex justify-between items-center">
                <p className="text-sm text-amber-700 font-semibold">Total to Pay</p>
                <p className="font-bold text-amber-700 text-lg">GH₵{(hostel.commissionType === 'flat' ? room.price + (hostel.platformFee || 0) : room.price).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBookingConfirm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmBooking} className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600">Confirm and Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
