import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Heart, ChevronLeft, ChevronRight, Wifi, Shield, Zap, Droplets, BookOpen, X, Users, DoorOpen, ArrowLeft, Share, MessageSquare, Bell } from 'lucide-react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import { updateMetaTags, injectJsonLd } from '../utils/seo';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY3l5YnJpZCIsImEiOiJjbXA4ZDZyZDIwb2ZmMnFzZnNpZjJ0aHF2In0.wPt2DmSb2voR6LjTI7vfyg';


import { useApp } from '../context/AppContext';
import { createBooking, verifyPayment, submitReview, deleteBooking, resetHostelRooms } from '../api/api.js';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_f8ea7f2de573926d15775e4fae12d7cdc020b7ee';

export default function HostelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { filteredHostels, filteredRooms, reviews, universities, isAuthenticated, savedHostels, toggleSaveHostel, addBooking, removeBooking, user, addReview, refreshBookings, refreshData, refreshNotifications } = useApp();

  const hostel = filteredHostels.find(h => h.id === id);
  const hostelRooms = filteredRooms.filter(r => r.hostelId === id);
  const hostelReviews = reviews.filter(r => r.hostelId === id);
  const uni = universities.find(u => u.id === hostel?.universityId);



  const [activeImage, setActiveImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [roomGenderFilter, setRoomGenderFilter] = useState<'all' | 'male' | 'female'>(user?.gender || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [reviewComment, setReviewComment] = useState('');
  const [isAnonymousReview, setIsAnonymousReview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [walkingDistance, setWalkingDistance] = useState<string | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const mapRef = useRef<any>(null);
  
  const isManagerOrAdmin = user?.role === 'admin' || user?.id === hostel?.managerId;

  const selectedRoomData = selectedRoom ? filteredRooms.find(r => r.id === selectedRoom) : undefined;

  const filteredHostelRooms = hostelRooms.filter(room => {
    if (roomGenderFilter === 'all') return true;
    return room.gender === roomGenderFilter;
  });
  const hiddenRoomCount = hostelRooms.length - filteredHostelRooms.length;

  useEffect(() => {
    if (selectedRoom && !filteredHostelRooms.some(room => room.id === selectedRoom)) {
      setSelectedRoom(null);
    }
  }, [filteredHostelRooms, selectedRoom]);

  useEffect(() => {
    if (hostel) {
      const uniName = uni ? uni.name : "Campus";
      const minPrice = hostelRooms.length > 0 ? Math.min(...hostelRooms.map(r => r.price)) : 0;
      const priceText = minPrice > 0 ? ` starting from GHS ${minPrice}` : "";
      
      const title = `${hostel.name} | Verified Hostel near ${uniName} | UNIHIVE`;
      const description = `Book student accommodation at ${hostel.name} near ${uniName}${priceText}. Highly rated hostel featuring ${hostel.facilities.slice(0, 5).join(', ')}. Secure verified booking.`;
      const keywords = `${hostel.name}, student hostel ${uniName}, unihive, hostel booking ghana, student accommodation ghana`;
      
      // Update standard and social tags
      updateMetaTags({
        title,
        description,
        keywords,
        image: hostel.images && hostel.images.length > 0 ? hostel.images[0] : undefined,
      });

      // Prepare JSON-LD schema markup
      const schemaData: any = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        "name": hostel.name,
        "description": hostel.description || `Verified student accommodation at ${hostel.name} located near ${uniName}.`,
        "image": hostel.images || [],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": hostel.address || "Ghana",
          "addressLocality": uniName,
          "addressCountry": "GH"
        },
        "url": window.location.href,
        "priceRange": hostelRooms.length > 0 
          ? `GHS ${Math.min(...hostelRooms.map(r => r.price))} - GHS ${Math.max(...hostelRooms.map(r => r.price))}`
          : "Price Varies",
        "amenityFeature": hostel.facilities.map((f: string) => ({
          "@type": "LocationFeatureSpecification",
          "name": f,
          "value": true
        }))
      };

      if (hostel.lat && hostel.lng) {
        schemaData.geo = {
          "@type": "GeoCoordinates",
          "latitude": hostel.lat,
          "longitude": hostel.lng
        };
      }

      if (hostelReviews.length > 0) {
        schemaData.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": hostel.rating || 5,
          "reviewCount": hostelReviews.length
        };
        schemaData.review = hostelReviews.slice(0, 5).map((rev: any) => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": rev.userName || "Student"
          },
          "datePublished": rev.createdAt || new Date().toISOString(),
          "reviewBody": rev.comment || "",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": rev.rating || 5
          }
        }));
      }

      // Inject and clean up
      const cleanup = injectJsonLd(`hostel-schema-${hostel.id}`, schemaData);
      return () => {
        cleanup();
      };
    }
  }, [hostel, uni, hostelRooms, hostelReviews]);

  useEffect(() => {
    if (hostel?.lat && hostel?.lng && uni && (uni as any).lat && (uni as any).lng && MAPBOX_TOKEN) {
      fetch(`https://api.mapbox.com/directions/v5/mapbox/walking/${hostel.lng},${hostel.lat};${(uni as any).lng},${(uni as any).lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
            const durationMin = Math.round(data.routes[0].duration / 60);
            setWalkingDistance(`${distanceKm}km (${durationMin} min walk)`);
            setRouteGeometry(data.routes[0].geometry);
          }
        })
        .catch(console.error);
    }
  }, [hostel?.lat, hostel?.lng, uni]);

  if (!hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hostel not found</h2>
          <button onClick={() => navigate('/hostels')} className="text-amber-600 font-medium">Back to hostels</button>
        </div>
      </div>
    );
  }

  const facilityIcons: Record<string, typeof Wifi> = { WiFi: Wifi, Security: Shield, Generator: Zap, 'Water Tank': Droplets, 'Study Room': BookOpen };
  const isSaved = savedHostels.includes(hostel.id);

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
      const response = await createBooking(selectedRoom, hostel.id, bookingDate);
      if (response.status !== 'success' || !response.booking_id) {
        throw new Error(response.message || 'Booking failed');
      }

      bookingId = response.booking_id;

      if (!(window as any).PaystackPop) {
        throw new Error('Payment system initializing... Please refresh the page once and try again.');
      }

      const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% markup
      const platformFee = Math.round(room.price * PLATFORM_FEE_PERCENTAGE);
      const totalAmount = room.price + platformFee;

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: user?.email,
        amount: totalAmount * 100,
        currency: 'GHS',
        ...(hostel.subaccountCode ? { 
          subaccount: hostel.subaccountCode,
          transaction_charge: platformFee * 100, // Admin takes this exact fee
          bearer: 'account' // Admin bears Paystack processing fees so manager gets exactly the room price
        } : {}),
        reference: 'BK_' + Math.floor((Math.random() * 1000000000) + 1).toString(),
        callback: function(paystackResponse: any) {
          verifyPayment(paystackResponse.reference, bookingId as string)
            .then(verification => {
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
                addBooking({
                  id: bookingId as string,
                  userId: user!.id,
                  roomId: selectedRoom,
                  hostelId: hostel.id,
                  bookingDate,
                  status: 'pending',
                  paymentStatus: 'unpaid',
                  reservationFee: totalAmount,
                  totalPrice: totalAmount,
                });
                alert('Payment could not be confirmed: ' + (verification.message || 'Please retry from your dashboard.'));
                setBookingSuccess(true);
              }
            })
            .catch((error: any) => {
              console.error('Payment verification failed:', error);
              addBooking({
                id: bookingId as string,
                userId: user!.id,
                roomId: selectedRoom,
                hostelId: hostel.id,
                bookingDate,
                status: 'pending',
                paymentStatus: 'unpaid',
                reservationFee: totalAmount,
                totalPrice: totalAmount,
              });
              refreshBookings();
              refreshNotifications();
              refreshData();
              alert('Payment was completed but verification failed. Please refresh and check your bookings dashboard.');
              setBookingSuccess(true);
            });
        },
        onClose: function() {
          if (bookingId) {
            cleanupPendingBooking(bookingId);
          }
          alert('Payment window closed. You can pay your rent later from your dashboard.');
          setBookingSuccess(true);
        }
      });
      handler.openIframe();
    } catch (error: any) {
      console.error('Booking error:', error);
      if (bookingId) {
        cleanupPendingBooking(bookingId);
      }
      alert('System Error: ' + (error.message || 'Unknown crash') + '. Please try refreshing the page.');
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
        is_anonymous: isAnonymousReview
      });
      if (response.status === 'success') {
        // Add to local state
        addReview({
          id: response.review_id.toString(),
          userId: user.id,
          hostelId: hostel.id,
          rating: reviewRating,
          comment: reviewComment,
          date: new Date().toISOString().split('T')[0],
          userName: isAnonymousReview ? 'Anonymous Student' : user.name,
          userAvatar: isAnonymousReview ? 'A' : user.avatar,
        });
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
        setIsAnonymousReview(false);
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      alert('Network error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingReview(false);
    }
  };

  const handleResetRooms = async () => {
    if (!window.confirm('Are you sure you want to reset all rooms for a new term? This will set all rooms to available and mark past bookings as expired.')) return;
    setIsResetting(true);
    try {
      const res = await resetHostelRooms(hostel.id);
      if (res.status === 'success') {
        alert('All rooms have been successfully reset.');
        refreshData();
        refreshBookings();
      } else {
        alert('Failed to reset rooms: ' + res.message);
      }
    } catch (e: any) {
      alert('Error resetting rooms: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${hostel.name} on UniHive`,
        text: `Check out ${hostel.name} on UniHive! It's a great verified hostel.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Hostel link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative bg-black">
        <button aria-label="Go back" onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="max-w-7xl mx-auto">
          <div className="relative h-[300px] md:h-[450px] overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
            <img src={typeof hostel.gallery[activeImage] === 'string' ? hostel.gallery[activeImage] : (hostel.gallery[activeImage] as any)?.url} alt={hostel.name} className="w-full h-full object-cover" />
            {(typeof hostel.gallery[activeImage] === 'object' && (hostel.gallery[activeImage] as any)?.desc) && (
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm shadow-lg z-10">
                {(hostel.gallery[activeImage] as any).desc}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button aria-label="Previous image" onClick={e => { e.stopPropagation(); setActiveImage(prev => (prev - 1 + hostel.gallery.length) % hostel.gallery.length); }} className="bg-white/90 p-2 rounded-full shadow hover:bg-white"><ChevronLeft className="w-5 h-5" /></button>
              <button aria-label="Next image" onClick={e => { e.stopPropagation(); setActiveImage(prev => (prev + 1) % hostel.gallery.length); }} className="bg-white/90 p-2 rounded-full shadow hover:bg-white"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <span className="text-sm bg-black/50 rounded-full px-3 py-1">{activeImage + 1} / {hostel.gallery.length}</span>
            </div>
          </div>
          <div className="flex gap-2 p-2 bg-gray-900 overflow-x-auto">
            {hostel.gallery.map((img, i) => (
              <button key={i} aria-label={`View image ${i + 1}`} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors relative group ${i === activeImage ? 'border-amber-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={typeof img === 'string' ? img : (img as any).url} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
                {(typeof img === 'object' && (img as any).desc) && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] py-0.5 px-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {(img as any).desc}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{hostel.name}</h1>
                    {hostel.verified && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> {hostel.address} • {walkingDistance || hostel.distanceFromCampus} from {uni?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button aria-label="Share hostel" onClick={handleShare} className="p-3 rounded-full border transition-colors bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:text-amber-500">
                    <Share className="w-5 h-5" />
                  </button>
                  {isAuthenticated && (
                      <button aria-label={isSaved ? 'Remove saved hostel' : 'Save hostel'} onClick={() => toggleSaveHostel(hostel.id)} className={`p-3 rounded-full border transition-colors ${isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white'}`}>
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= Math.round(hostel.rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-1 font-bold text-gray-800">{hostel.rating}</span>
                  <span className="text-gray-500 text-sm">({hostel.reviewCount} reviews)</span>
                </div>
                {isManagerOrAdmin && (
                  <button onClick={handleResetRooms} disabled={isResetting} className="ml-auto px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                    {isResetting ? 'Resetting...' : 'Reset Rooms for New Term'}
                  </button>
                )}
              </div>
            </div>

            {/* Map Preview */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Location</h2>
                  <p className="text-sm text-gray-500">{hostel.address}</p>
                </div>
                {hostel.lat != null && hostel.lng != null && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${hostel.lat},${hostel.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Get Directions
                  </button>
                )}

              </div>

              {hostel.lat != null && hostel.lng != null ? (
                <div className="w-full h-[260px] rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                  {MAPBOX_TOKEN ? (
                    <Map
                      ref={mapRef}
                      initialViewState={{
                        longitude: hostel.lng as number,
                        latitude: hostel.lat as number,
                        zoom: 12,
                        pitch: 0,
                        bearing: 0
                      }}
                      onLoad={() => {
                        setTimeout(() => {
                          mapRef.current?.flyTo({
                            center: [hostel.lng, hostel.lat],
                            zoom: 17,
                            pitch: 65,
                            bearing: -17.6,
                            duration: 2500,
                            essential: true
                          });
                        }, 500);
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      antialias={true}
                    >
                      <Layer
                        id="3d-buildings"
                        source="composite"
                        source-layer="building"
                        filter={['==', 'extrude', 'true']}
                        type="fill-extrusion"
                        minzoom={15}
                        paint={{
                          'fill-extrusion-color': '#aaa',
                          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
                          'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
                          'fill-extrusion-opacity': 0.6
                        }}
                      />
                      <Marker longitude={hostel.lng as number} latitude={hostel.lat as number} anchor="bottom">
                        <MapPin className="w-8 h-8 text-amber-500 fill-amber-500 shadow-md rounded-full animate-bounce" />
                      </Marker>

                      {uni && (uni as any).lng && (uni as any).lat && (
                        <Marker longitude={(uni as any).lng} latitude={(uni as any).lat} anchor="bottom">
                          <div className="bg-orange-500 p-2 rounded-full shadow-lg border-2 border-white text-white flex items-center justify-center transform hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        </Marker>
                      )}

                      {routeGeometry && (
                        <Source id="route-source" type="geojson" data={{
                          type: 'Feature',
                          properties: {},
                          geometry: routeGeometry
                        }}>
                          <Layer
                            id="route-layer"
                            type="line"
                            paint={{
                              'line-color': '#f59e0b',
                              'line-width': 5,
                              'line-opacity': 0.85
                            }}
                          />
                        </Source>
                      )}
                    </Map>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center p-6 text-center">
                      <p className="text-gray-500 font-medium">Map cannot load: VITE_MAPBOX_TOKEN is missing in the environment variables.</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Map location not available for this hostel yet.</p>
              )}

            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About this hostel</h2>
              <p className="text-gray-600 leading-relaxed">{hostel.description}</p>
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hostel.facilities.map(f => {
                  const Icon = facilityIcons[f] || CheckCircle;
                  return (
                    <div key={f} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <Icon className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Available Rooms</h2>
                  {hiddenRoomCount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{hiddenRoomCount} room{hiddenRoomCount > 1 ? 's' : ''} hidden by the current gender filter.</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select aria-label="Filter hostel rooms by gender" value={roomGenderFilter} onChange={e => setRoomGenderFilter(e.target.value as 'all' | 'male' | 'female')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    <option value="all">All rooms</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                    <button type="button" onClick={() => setViewMode('grid')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Grid</button>
                    <button type="button" onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>List</button>
                  </div>
                </div>
              </div>
              <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 gap-5' : 'space-y-4'}`}>
                {filteredHostelRooms.length === 0 && (
                  <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
                    No rooms match the selected gender filter. Change the filter to see more rooms.
                  </div>
                )}
                {filteredHostelRooms.length > 0 ? filteredHostelRooms.map(room => (
                  <div key={room.id} className={`border rounded-xl p-4 transition-all ${selectedRoom === room.id ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-300'} ${!room.available ? 'opacity-50' : 'cursor-pointer'}`}
                    onClick={() => { if (room.available) navigate(`/rooms/${room.id}`); }}>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img src={room.image} alt={room.type} className="w-full sm:w-32 h-24 object-cover rounded-lg" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{room.type}</h3>
                            <p className="text-sm text-gray-500">Room {room.roomNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-amber-600">GH₵{room.price.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">per {hostel.paymentPeriod === 'academic_year' ? 'academic year' : 'semester'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" /> {room.capacity} {room.capacity === 1 ? 'person' : 'people'}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500"><DoorOpen className="w-3.5 h-3.5" /> Room {room.roomNumber}</span>
                          <span className={`text-xs font-semibold ${room.available ? 'text-green-600' : 'text-red-500'}`}>
                            {room.available ? `Available • ${room.occupancy || 0}/${room.capacity} booked` : `Occupied • ${room.capacity}/${room.capacity} booked`}
                          </span>
                        </div>
                        {(room as any).amenities && (room as any).amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(room as any).amenities.map((amenity: string, idx: number) => (
                              <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : null}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reviews ({hostelReviews.length})</h2>
                {isAuthenticated && (
            <button onClick={() => setShowReviewModal(true)} className="text-amber-600 hover:text-amber-700 text-sm font-semibold" disabled={!isAuthenticated}>Write a Review</button>
          )}
        </div>
              {hostelReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-5">
                  {hostelReviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">{review.userAvatar}</div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{review.userName}</p>
                          <p className="text-xs text-gray-400">{review.date}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 mb-1">Price range</p>
                  <p className="text-2xl font-bold text-amber-600">{hostel.priceRange}</p>
                  <p className="text-xs text-gray-400">per {hostel.paymentPeriod === 'academic_year' ? 'academic year' : 'semester'}</p>
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Distance</span>
                    <span className="font-medium text-gray-800">{walkingDistance || hostel.distanceFromCampus}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Available rooms</span>
                    <span className="font-medium text-green-600">{hostelRooms.filter(r => r.available).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Booking model</span>
                    <span className="font-medium text-gray-800">No hidden fees</span>
                  </div>
                </div>
                {selectedRoom ? (
                  <div className="bg-amber-50 rounded-xl p-3 mb-4">
                    <p className="text-xs text-amber-600 font-medium mb-1">Selected Room</p>
                    <p className="font-bold text-gray-800">{selectedRoomData?.type} - Room {selectedRoomData?.roomNumber}</p>
                    <p className="text-amber-600 font-bold mb-1">GH₵{selectedRoomData?.price.toLocaleString()}/{hostel.paymentPeriod === 'academic_year' ? 'academic year' : 'semester'}</p>
                    <p className="text-xs font-semibold text-gray-600 bg-amber-100/50 inline-block px-2 py-1 rounded">
                      {selectedRoomData ? (selectedRoomData.capacity - (selectedRoomData.occupancy || 0)) : 0} bed(s) remaining out of {selectedRoomData?.capacity}
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 mb-4">Select a room above to book</p>
                )}
                <p className="text-xs text-gray-500 mb-3">By booking, you agree to UniHive terms and conditions. Cancellations or misuse may result in penalties.</p>
                <button
                  onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } if (selectedRoom) setShowBookingModal(true); }}
                  disabled={!selectedRoom}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${selectedRoom ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {isAuthenticated ? 'Book This Room' : 'Sign In to Book'}
                </button>
                {hostelRooms.filter(r => r.available).length === 0 && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) navigate('/login');
                      else alert("You've been added to the waitlist! We will email you the moment a room becomes available here.");
                    }}
                    className="w-full mt-3 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-lg text-sm flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" /> Notify Me When Available
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">Quick Info</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> Physically verified by UniHive</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> Secure reservation system</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> Direct messaging available</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> Student-verified reviews</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 mt-4">
                <h3 className="font-bold text-gray-900 mb-3">Hostel Manager</h3>
                <p className="text-sm text-gray-600 mb-4">Have questions about the rooms, facilities, or policies?</p>
                <button
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    if (!hostel.managerId) { alert('This hostel has not been claimed by a manager yet.'); return; }
                    navigate('/messages', { state: { startChatWith: hostel.managerId } });
                  }}
                  className="w-full py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Message Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {!bookingSuccess ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-gray-900">Confirm Booking</h3>
                  <button aria-label="Close booking modal" onClick={() => setShowBookingModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Hostel</span><span className="font-medium">{hostel.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Room</span><span className="font-medium">{selectedRoomData?.type} ({selectedRoomData?.roomNumber})</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Platform Fee</span><span className="font-medium">GH₵{selectedRoomData ? Math.round(selectedRoomData.price * 0.05).toLocaleString() : 0}</span></div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm"><span className="text-gray-500">Total Rent & Fees</span><span className="font-bold text-amber-600">GH₵{selectedRoomData ? (selectedRoomData.price + Math.round(selectedRoomData.price * 0.05)).toLocaleString() : 0}</span></div>
                </div>
                <p className="text-xs text-gray-500 mb-5">By confirming, you will be prompted to securely pay your full rent via Paystack. Funds are safely held.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleBookRoom} className="flex-1 py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600 shadow-lg">Confirm Booking</button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Submitted!</h3>
                <p className="text-gray-500 text-sm mb-6">Your booking request has been submitted. If you closed the payment window, please pay the rent from your dashboard to secure your room.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setShowBookingModal(false); setBookingSuccess(false); }} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
                  <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600">Go to Dashboard</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
              <button aria-label="Close review modal" onClick={() => setShowReviewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} aria-label={`Select ${s} star rating`} onClick={() => setReviewRating(s)}>
                    <Star className={`w-8 h-8 transition-colors ${s <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 hover:text-amber-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <p className="text-sm text-gray-500 mb-2">Your Review</p>
              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} placeholder="Share your experience..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
            <div className="mb-5 flex items-center gap-2">
              <input type="checkbox" id="anonymous" checked={isAnonymousReview} onChange={e => setIsAnonymousReview(e.target.checked)} className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500" />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">Submit anonymously</label>
            </div>
            <button onClick={handleSubmitReview} disabled={!reviewComment.trim() || loadingReview} className="w-full py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400">
              {loadingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Full Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button aria-label="Close gallery" onClick={() => setShowGallery(false)} className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 z-10"><X className="w-6 h-6 text-white" /></button>
          <button aria-label="Previous gallery image" onClick={() => setActiveImage(prev => (prev - 1 + hostel.gallery.length) % hostel.gallery.length)} className="absolute left-4 bg-white/20 p-3 rounded-full hover:bg-white/30"><ChevronLeft className="w-6 h-6 text-white" /></button>
          <img src={typeof hostel.gallery[activeImage] === 'string' ? hostel.gallery[activeImage] : (hostel.gallery[activeImage] as any)?.url} alt="Hostel gallery" className="max-w-full max-h-full object-contain" />
          {(typeof hostel.gallery[activeImage] === 'object' && (hostel.gallery[activeImage] as any)?.desc) && (
            <div className="absolute bottom-12 text-white bg-black/60 px-4 py-2 rounded-xl text-lg font-medium shadow-lg">
              {(hostel.gallery[activeImage] as any).desc}
            </div>
          )}
          <button aria-label="Next gallery image" onClick={() => setActiveImage(prev => (prev + 1) % hostel.gallery.length)} className="absolute right-4 bg-white/20 p-3 rounded-full hover:bg-white/30"><ChevronRight className="w-6 h-6 text-white" /></button>
          <div className="absolute bottom-4 text-white text-sm">{activeImage + 1} / {hostel.gallery.length}</div>
        </div>
      )}
    </div>
  );
}
