import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CheckCircle, XCircle, Calendar, CreditCard, Bell, Heart, Clock, Users, Sparkles, Star, MapPin, Trash2, ExternalLink, Download, GraduationCap, Phone, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { verifyPayment, subscribeToPush, getSavedCard, chargeCard, updateBookingDetails } from '../api/api.js';

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
  const { user, bookings, notifications, hostels, rooms, universities, savedHostels, toggleSaveHostel, markNotificationRead, markAllNotificationsRead, refreshBookings, refreshNotifications, cancelBooking, deleteNotification } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [savedCard, setSavedCard] = useState<{ card_type: string; last4: string; exp_month: string; exp_year: string } | null | undefined>(undefined);
  const [isChargingCard, setIsChargingCard] = useState<string | null>(null);

  // Resident Intake Modal State
  const [residentModalBooking, setResidentModalBooking] = useState<any | null>(null);
  const [residentFormData, setResidentFormData] = useState({
    studentIdNumber: '',
    level: '100',
    programOfStudy: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Parent',
    expectedCheckInDate: '',
    specialRequests: ''
  });
  const [isSavingResident, setIsSavingResident] = useState(false);

  const handleOpenResidentModal = (booking: any) => {
    setResidentModalBooking(booking);
    setResidentFormData({
      studentIdNumber: booking.studentIdNumber || (user as any)?.student_id_number || '',
      level: booking.level || (user as any)?.level || '100',
      programOfStudy: booking.programOfStudy || (user as any)?.program_of_study || '',
      emergencyContactName: booking.emergencyContactName || (user as any)?.emergency_contact_name || '',
      emergencyContactPhone: booking.emergencyContactPhone || (user as any)?.emergency_contact_phone || '',
      emergencyContactRelation: booking.emergencyContactRelation || (user as any)?.emergency_contact_relation || 'Parent',
      expectedCheckInDate: booking.expectedCheckInDate ? String(booking.expectedCheckInDate).split('T')[0] : '',
      specialRequests: booking.specialRequests || ''
    });
  };

  const handleSaveResidentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentModalBooking) return;
    setIsSavingResident(true);
    try {
      const res: any = await updateBookingDetails(residentModalBooking.id, residentFormData);
      if (res.status === 'success') {
        alert('Resident check-in details saved and shared with your hostel manager! 🎉');
        setResidentModalBooking(null);
        refreshBookings();
      } else {
        alert(res.message || 'Failed to save resident details');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving resident details');
    } finally {
      setIsSavingResident(false);
    }
  };

  useEffect(() => {
    refreshBookings();
    refreshNotifications();
    // Fetch saved card silently
    getSavedCard()
      .then((res: any) => setSavedCard(res.card || null))
      .catch(() => setSavedCard(null));
  }, []);

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
    // Use stored idempotency reference — prevents double charge on retry
    const reference = booking.paystackReference || booking.paystack_reference || ('BK_' + Math.floor((Math.random() * 1000000000) + 1).toString());
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: booking.totalPrice * 100,
      currency: 'GHS',
      ...(hostel?.subaccountCode ? { subaccount: hostel.subaccountCode } : {}),
      reference,
      callback: function (paystackResponse: any) {
        verifyPayment(paystackResponse.reference, booking.id)
          .then(verification => {
            if (verification.status === 'success') {
              refreshBookings();
              refreshNotifications();
              // Refresh saved card — a new card may have been used
              getSavedCard().then((res: any) => setSavedCard(res.card || null)).catch(() => {});
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

  const handleSavedCardPay = async (booking: any) => {
    if (!confirm(`Pay GH₵${booking.totalPrice} using your saved ${savedCard?.card_type?.toUpperCase() || 'card'} ending in ${savedCard?.last4}?`)) return;
    setIsChargingCard(booking.id);
    try {
      const result = await chargeCard(booking.id);
      if (result.status === 'success') {
        refreshBookings();
        refreshNotifications();
        alert(`Payment successful! Check-in code: ${result.authCode}`);
      } else if (result.status === 'overbooked') {
        refreshBookings();
        alert('Payment received but room is full. Your booking is pending manager review.');
      } else {
        alert(result.message || 'Card charge failed. Please try with a new card.');
      }
    } catch (err: any) {
      alert(err?.message || 'Card charge failed. Please try with a new card.');
    } finally {
      setIsChargingCard(null);
    }
  };

  const generateReceipt = (booking: any, hostel: any, room: any) => {
    const amount = Number(booking.totalPrice).toFixed(2);
    const paidDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-GH', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A';
    const receiptHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>UniHive Receipt #${String(booking.id).slice(-6)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f8f8; color: #1a1a1a; }
        .receipt { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 28px 32px; }
        .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
        .paid-stamp { display: inline-block; border: 3px solid #22c55e; color: #22c55e; font-size: 11px; font-weight: 900; letter-spacing: 2px; padding: 4px 12px; border-radius: 6px; margin-top: 12px; }
        .body { padding: 28px 32px; }
        .section-title { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .row:last-child { border-bottom: none; }
        .row .label { font-size: 13px; color: #6b7280; }
        .row .value { font-size: 13px; font-weight: 600; color: #111827; text-align: right; }
        .amount-row { background: #fef3c7; border-radius: 10px; padding: 14px 16px; display: flex; justify-content: space-between; margin-top: 16px; }
        .amount-row .label { font-size: 13px; font-weight: 600; color: #92400e; }
        .amount-row .value { font-size: 20px; font-weight: 800; color: #92400e; }
        .code-box { margin-top: 16px; background: #fff7ed; border: 2px dashed #fed7aa; border-radius: 10px; padding: 14px; text-align: center; }
        .code-box p { font-size: 10px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .code-box span { font-size: 22px; font-family: monospace; font-weight: 900; color: #92400e; letter-spacing: 4px; }
        .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { background: #fff; } .receipt { box-shadow: none; margin: 0; } }
      </style></head><body>
      <div class="receipt">
        <div class="header">
          <h1>🏠 UniHive</h1>
          <p>Official Payment Receipt</p>
          <div class="paid-stamp">✓ PAID</div>
        </div>
        <div class="body">
          <p class="section-title">Booking Details</p>
          <div class="row"><span class="label">Receipt No.</span><span class="value">#${String(booking.id).slice(-6).toUpperCase()}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${paidDate}</span></div>
          <div class="row"><span class="label">Hostel</span><span class="value">${hostel?.name || booking.hostelName || 'N/A'}</span></div>
          <div class="row"><span class="label">Room</span><span class="value">${room?.roomNumber || booking.roomNumber || 'N/A'} (${room?.type || booking.roomType || 'Standard'})</span></div>
          <div class="row"><span class="label">Student</span><span class="value">${user.name || 'N/A'}</span></div>
          <div class="row"><span class="label">Payment Method</span><span class="value">Paystack (Secured)</span></div>
          <div class="amount-row">
            <span class="label">Total Paid</span>
            <span class="value">GH₵${amount}</span>
          </div>
          ${booking.authCode ? `<div class="code-box"><p>Check-in Code</p><span>${booking.authCode}</span></div>` : ''}
        </div>
        <div class="footer">UniHive — Secure Student Housing Platform<br/>This is an official digital receipt. Keep it for your records.</div>
      </div>
      <script>window.onload = function() { window.print(); }<\/script>
      </body></html>`;
    const win = window.open('', '_blank', 'width=600,height=800');
    if (win) { win.document.write(receiptHtml); win.document.close(); }
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
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-bold overflow-hidden shadow-md shrink-0">
                {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:') || user.avatar.includes('/')) ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.avatar && user.avatar.length <= 4 ? user.avatar : (user.name?.charAt(0) || 'U')}</span>
                )}
              </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Bookings', value: userBookings.length.toString(), icon: Calendar, color: 'bg-blue-500' },
                { label: 'Active Bookings', value: userBookings.filter(b => b.status === 'approved').length.toString(), icon: CheckCircle, color: 'bg-green-500' },
                { label: 'Saved Hostels', value: saved.length.toString(), icon: Heart, color: 'bg-red-500' },
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
                  <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:border-gray-200 transition-all flex flex-col sm:flex-row sm:justify-between gap-6">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-extrabold text-gray-900">{hostel?.name || 'Unknown Hostel'}</h3>
                          <span className="text-xs text-gray-400 font-mono">#{booking.id.slice(-6)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Room <span className="font-bold text-gray-800">{room?.roomNumber || booking.roomNumber || 'N/A'}</span> • {room?.type || booking.roomType || 'Standard'}
                        </p>
                      </div>

                      {booking.authCode && (
                        <div className="bg-amber-50 border border-amber-200/70 rounded-xl px-3.5 py-2 inline-block">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Official Check-in Passcode</span>
                          <span className="font-mono text-base font-black text-amber-950 tracking-wider">{booking.authCode}</span>
                          <span className="text-[11px] text-amber-700 block mt-0.5">Show this to the hostel manager when checking in.</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusColor(booking.status)}`}>
                          {statusIcon(booking.status)} {booking.status.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus.toUpperCase()}
                        </span>
                        
                        {/* Resident KYC status badge */}
                        {booking.emergencyContactPhone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Resident Info On File
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ Complete Check-in Info
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                      <div>
                        <span className="text-xs text-gray-400 block sm:text-right">Total Rent</span>
                        <p className="text-2xl font-black text-gray-900 sm:text-right">GH₵{booking.totalPrice}</p>
                      </div>

                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {/* Resident Info button */}
                        <button
                          type="button"
                          onClick={() => handleOpenResidentModal(booking)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <GraduationCap className="w-4 h-4 text-amber-600" />
                          {booking.emergencyContactPhone ? 'Edit Check-In Details' : 'Fill Check-In Details'}
                        </button>

                        {booking.paymentStatus === 'unpaid' && (
                          <button onClick={() => handlePayBooking(booking, hostel)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer">
                            Pay Now with MoMo / Card
                          </button>
                        )}
                        {booking.paymentStatus === 'unpaid' && booking.status === 'pending' && (
                          <button onClick={() => handleCancelBooking(booking)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
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
            {userBookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-500">No payment transactions found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {userBookings.map(booking => {
                  const hostel = hostels.find(h => h.id === booking.hostelId);
                  const room = rooms.find(r => r.id === booking.roomId);
                  const isUnpaid = booking.paymentStatus === 'unpaid';

                  if (isUnpaid) {
                    return (
                      <div key={booking.id} className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-xs font-semibold text-gray-400">INVOICE #{booking.id.slice(-6)}</span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 animate-pulse">
                              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> PENDING PAYMENT
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{hostel?.name || booking.hostelName || 'Unknown Hostel'}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {hostel?.address || 'Hostel Address'}
                          </p>
                          <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-4 mb-4">
                            <span className="text-xs text-amber-700 font-semibold block mb-1">RENT PAYMENT REQUIRED</span>
                            <p className="text-xs text-amber-700/80">Complete your payment of <b>GH₵{booking.totalPrice}</b> to secure your room and generate your check-in code.</p>
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
                        <div className="flex items-end justify-between mt-2 pt-2 border-t border-amber-100 gap-4">
                          <div>
                            <span className="text-xs text-gray-400 block">Amount Due</span>
                            <span className="text-2xl font-bold text-gray-900">GH₵{booking.totalPrice}</span>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {/* Saved card one-click option */}
                            {savedCard && (
                              <button
                                onClick={() => handleSavedCardPay(booking)}
                                disabled={isChargingCard === booking.id}
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-semibold"
                              >
                                {isChargingCard === booking.id ? (
                                  <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3 inline-block"></span> Charging...</>
                                ) : (
                                  <><CreditCard className="w-3.5 h-3.5" /> Pay with {savedCard.card_type?.toUpperCase() || 'Card'} ••••{savedCard.last4}</>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handlePayBooking(booking, hostel)}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-md flex items-center gap-2 text-sm font-semibold"
                            >
                              <CreditCard className="w-4 h-4" /> {savedCard ? 'New Card' : 'Pay Now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="text-xs font-semibold text-gray-400">RECEIPT #{booking.id.slice(-6)}</span>
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
                          <span className="text-2xl font-bold text-gray-900">GH₵{booking.totalPrice}</span>
                        </div>
                        <button
                          onClick={() => generateReceipt(booking, hostel, room)}
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
                  <div key={notif.id} onClick={() => markNotificationRead(notif)} className={`group p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-amber-50/50' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
{/* RESIDENT INTAKE & CHECK-IN MODAL */}
      {residentModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative my-8 border border-gray-100">
            <button
              onClick={() => setResidentModalBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Resident Check-In Registration</h3>
                <p className="text-xs text-gray-500">Shared directly with your hostel manager for key handover & records.</p>
              </div>
            </div>

            <form onSubmit={handleSaveResidentDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Student ID / Index No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={residentFormData.studentIdNumber}
                    onChange={e => setResidentFormData({ ...residentFormData, studentIdNumber: e.target.value })}
                    placeholder="e.g. 10982341"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Academic Level *
                  </label>
                  <select
                    value={residentFormData.level}
                    onChange={e => setResidentFormData({ ...residentFormData, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="100">Level 100 (Freshman)</option>
                    <option value="200">Level 200 (Sophomore)</option>
                    <option value="300">Level 300 (Junior)</option>
                    <option value="400">Level 400 (Senior)</option>
                    <option value="Postgraduate">Postgraduate / Masters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Program / Course of Study *
                </label>
                <input
                  type="text"
                  required
                  value={residentFormData.programOfStudy}
                  onChange={e => setResidentFormData({ ...residentFormData, programOfStudy: e.target.value })}
                  placeholder="e.g. BSc Computer Science, BA Economics"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider block mb-2.5">
                  Emergency Contact (Parent / Guardian)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={residentFormData.emergencyContactName}
                      onChange={e => setResidentFormData({ ...residentFormData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Mr. Emmanuel Mensah"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Relationship *</label>
                    <select
                      value={residentFormData.emergencyContactRelation}
                      onChange={e => setResidentFormData({ ...residentFormData, emergencyContactRelation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sibling">Brother / Sister</option>
                      <option value="Other">Other Relative</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Emergency Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={residentFormData.emergencyContactPhone}
                    onChange={e => setResidentFormData({ ...residentFormData, emergencyContactPhone: e.target.value })}
                    placeholder="e.g. 0244123456"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Expected Arrival Date
                  </label>
                  <input
                    type="date"
                    value={residentFormData.expectedCheckInDate}
                    onChange={e => setResidentFormData({ ...residentFormData, expectedCheckInDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                    Special Requests / Notes
                  </label>
                  <input
                    type="text"
                    value={residentFormData.specialRequests}
                    onChange={e => setResidentFormData({ ...residentFormData, specialRequests: e.target.value })}
                    placeholder="e.g. Arriving late afternoon"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResidentModalBooking(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResident}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingResident ? 'Saving Details...' : 'Save & Share with Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}