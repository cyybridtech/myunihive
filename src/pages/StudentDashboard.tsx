import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CheckCircle, XCircle, Calendar, CreditCard, Bell, Heart, Clock, Users, Sparkles, Star, MapPin, Trash2, ExternalLink, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { verifyPayment, subscribeToPush } from '../api/api.js';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_f8ea7f2de573926d15775e4fae12d7cdc020b7ee';
const VAPID_PUBLIC_KEY = 'BEE90AIGS9HcdCmGywp5CXHdNlELSVjR93xMop7gQbKP34yjYCKnS1MKa7HVTemmxvKmloDdDvxNSU31NBJ3S3s';

// Utility function
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Tab = 'overview' | 'bookings' | 'payments' | 'notifications' | 'saved';

export default function StudentDashboard() {
  // 1. ALL HOOKS AT THE TOP
  const { user, bookings, notifications, hostels, rooms, universities, savedHostels, markNotificationRead, markAllNotificationsRead, refreshBookings, refreshNotifications, cancelBooking } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');

  const enablePushNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
        }
        await subscribeToPush(subscription);
        setPushEnabled(true);
        alert('Push notifications enabled!');
      } else {
        alert('Push notifications are blocked. Please click the padlock icon in your browser address bar to allow notifications, then try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to enable push notifications.');
    }
  };

  // 2. CONDITIONAL REDIRECT
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  // 3. COMPONENT LOGIC
  const userBookings = bookings.filter(b => String(b.userId) === String(user.id));
  const userNotifications = notifications.filter(n => String(n.userId) === String(user.id));
  const uni = universities.find(u => u.id === user.universityId);
  const saved = hostels.filter(h => savedHostels.includes(h.id));

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': case 'refunded': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'paid': return 'bg-green-100 text-green-700';
      case 'rejected': case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'saved', label: 'Saved', icon: Heart },
  ];

  const handlePayBooking = (booking: any, hostel: any) => {
    if (!(window as any).PaystackPop) {
      alert("Payment system initializing... Please refresh.");
      return;
    }
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: booking.totalPrice * 100,
      currency: 'GHS',
      ...(hostel?.subaccountCode ? { subaccount: hostel.subaccountCode } : {}),
      reference: 'BK_' + Math.floor((Math.random() * 1000000000) + 1).toString(),
      callback: function (paystackResponse: any) {
        verifyPayment(paystackResponse.reference, booking.id)
          .then(verification => {
            if (verification.status === 'success') {
              refreshBookings();
              refreshNotifications();
              alert('Payment successful!');
            } else {
              alert('Payment completed but could not be verified: ' + (verification.message || 'Please refresh and check your bookings.'));
            }
          })
          .catch((error: any) => {
            console.error('Payment verification failed:', error);
            alert('Payment completed but verification failed. Please refresh and check your bookings.');
          });
      },
      onClose: () => alert('Payment window closed.')
    });
    handler.openIframe();
  };

  const handleCancelBooking = async (booking: any) => {
    if (!confirm('Cancel this unpaid booking?')) return;

    try {
      await cancelBooking(booking.id);
      await refreshBookings();
      alert('Booking cancelled successfully.');
    } catch (error: any) {
      console.error('Cancel booking failed:', error);
      alert(error?.message || 'Unable to cancel booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-bold">{user.avatar}</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 text-sm">{uni?.name} • Member since {user.joinDate}</p>
              </div>
            </div>
            {!pushEnabled && (
              <button onClick={enablePushNotifications} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                <Bell className="w-4 h-4" /> Enable Push Alerts
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'notifications' && userNotifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center">
                    {userNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Bookings', value: userBookings.filter(b => b.status !== 'rejected').length.toString(), icon: Calendar, color: 'bg-blue-500' },
                { label: 'Active Bookings', value: userBookings.filter(b => b.status === 'approved' || b.status === 'completed').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
                { label: 'Saved Hostels', value: saved.length.toString(), icon: Heart, color: 'bg-red-500' },
                { label: 'Credit Balance', value: `GH₵${user.credits}`, icon: CreditCard, color: 'bg-amber-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 font-medium">{stat.label}</span>
                    <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* HiveMatch AI Roommate Finder CTA Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">HiveMatch AI Roommate Finder</h3>
                  <p className="text-amber-50 text-sm mt-0.5">Find compatible students who share your schedule, social habits, and cleanliness level!</p>
                </div>
              </div>
              <Link 
                to="/roommate-finder" 
                className="relative z-10 px-5 py-2.5 bg-white hover:bg-amber-50 text-amber-600 font-bold rounded-xl text-sm transition-all shadow-md shrink-0 flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Match Roommates Now
              </Link>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {userBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bookings found.</p>
              </div>
            ) : (
              userBookings.map(booking => {
                const hostel = hostels.find(h => h.id === booking.hostelId);
                const room = rooms.find(r => r.id === booking.roomId);
                return (
                  <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col sm:flex-row sm:justify-between shadow-sm gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{hostel?.name || booking.hostelName || 'Unknown Hostel'}</h3>
                      <p className="text-sm text-gray-500">Booking ID: #{String(booking.id).slice(-6)}</p>
                      <p className="text-sm text-gray-500 mt-2">Room {room?.roomNumber || booking.roomNumber || 'N/A'} • {room?.type || booking.roomType || 'Standard'}</p>
                      {booking.authCode && (
                        <p className="text-sm text-amber-700 mt-2">Your check-in code: <span className="font-semibold">{booking.authCode}</span></p>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium mt-3 ${statusColor(booking.status)}`}>
                        {statusIcon(booking.status)} {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 mb-2">GH₵{booking.totalPrice}</p>
                      <div className="flex flex-col gap-2">
                        {booking.paymentStatus === 'unpaid' && (
                          <button onClick={() => handlePayBooking(booking, hostel)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            Pay Now
                          </button>
                        )}
                        {booking.paymentStatus === 'unpaid' && booking.status === 'pending' && (
                          <button onClick={() => handleCancelBooking(booking)} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {userBookings.filter(b => b.paymentStatus === 'paid' || b.status === 'approved' || b.status === 'completed').length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500">No payment transactions found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {userBookings
                  .filter(b => b.paymentStatus === 'paid' || b.status === 'approved' || b.status === 'completed')
                  .map(booking => {
                    const hostel = hostels.find(h => h.id === booking.hostelId);
                    const room = rooms.find(r => r.id === booking.roomId);
                    return (
                      <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-xs font-semibold text-gray-400">RECEIPT #{String(booking.id).slice(-6)}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> PAID & CONFIRMED
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{hostel?.name || booking.hostelName || 'Unknown Hostel'}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {hostel?.address || 'Hostel Address'}
                          </p>
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4">
                            <span className="text-xs text-amber-600 font-semibold block mb-1">SECURE CHECK-IN CODE</span>
                            <span className="text-xl font-mono font-bold text-amber-800 tracking-wider">
                              {booking.authCode || 'UNH-PENDING'}
                            </span>
                            <p className="text-xs text-amber-600/80 mt-1">Present this code to the hostel manager at check-in.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4 border-t border-b border-gray-50 py-3">
                            <div>
                              <span className="text-xs text-gray-400 block">Room Number</span>
                              <span className="font-semibold text-gray-800">{room?.roomNumber || booking.roomNumber || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block">Room Type</span>
                              <span className="font-semibold text-gray-800">{room?.type || booking.roomType || 'Standard'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-xs text-gray-400 block">Total Amount Paid</span>
                            <span className="text-2xl font-bold text-gray-900 text-gray-900">GH₵{booking.totalPrice}</span>
                          </div>
                          <button 
                            onClick={() => alert('Receipt downloaded!')}
                            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-xl transition-all border border-gray-200/50 flex items-center gap-2 text-xs font-semibold"
                          >
                            <Download className="w-4 h-4" /> Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">{userNotifications.filter(n => !n.read).length} unread</p>
              </div>
              {userNotifications.some(n => !n.read) && (
                <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y">
              {userNotifications.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No new notifications.</div>
              ) : (
                userNotifications.map(notif => (
                  <div key={notif.id} onClick={() => markNotificationRead(notif)} className={`p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-amber-50/50' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div>
            {saved.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500">No saved hostels yet.</p>
                <Link to="/hostels" className="mt-4 inline-block text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Explore Hostels
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {saved.map(hostel => {
                  const hostelRooms = rooms.filter(r => r.hostelId === hostel.id);
                  const availableRooms = hostelRooms.filter(r => r.available).length;
                  return (
                    <div key={hostel.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <Link to={`/hostels/${hostel.id}`}>
                          <img src={hostel.mainImage} alt={hostel.name} className="w-full h-full object-cover" />
                        </Link>
                        {hostel.verified && (
                          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </div>
                        )}
                        <button
                          onClick={() => toggleSaveHostel(hostel.id)}
                          className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-gray-800">{hostel.rating}</span>
                          <span className="text-[10px] text-gray-500">({hostel.reviewCount})</span>
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <Link to={`/hostels/${hostel.id}`}>
                            <h3 className="font-bold text-gray-900 text-base mb-1 hover:text-amber-600 transition-colors">{hostel.name}</h3>
                          </Link>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3 flex-shrink-0" /> {hostel.address}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {hostel.facilities.slice(0, 3).map(f => (
                              <span key={f} className="bg-gray-50 text-gray-600 text-[10px] px-2 py-0.5 rounded-md border border-gray-100">{f}</span>
                            ))}
                            {hostel.facilities.length > 3 && (
                              <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-md font-medium border border-amber-100">+{hostel.facilities.length - 3}</span>
                            )}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div>
                            <span className="text-amber-600 font-bold text-sm">{hostel.priceRange}</span>
                            <span className="text-[10px] text-gray-400 block">per {hostel.paymentPeriod === 'academic_year' ? 'academic year' : 'semester'}</span>
                          </div>
                          <Link 
                            to={`/hostels/${hostel.id}`}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}