import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, Calendar, Star, BarChart3, Plus, DoorOpen, Search, Bell, Pencil, Trash2, X, TrendingUp, Clock, ArrowUpRight, Landmark, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createRoom, updateRoomStatus, updateRoomOccupancy, approveBooking, updateRoom as updateRoomApi, updateHostel as updateHostelApi, getPayoutStats } from '../api/api.js';
import { Booking } from '../data/mockData';

type ManagerTab = 'overview' | 'hostels' | 'rooms' | 'bookings' | 'reviews' | 'notifications' | 'payouts';

export default function ManagerDashboard() {
  const auth = useAuth();
  const { hostels, rooms, bookings, reviews, universities, notifications, refreshBookings, refreshData, refreshNotifications, addRoom, updateRoom, updateHostel, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'hostel_manager';

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  const managerHostels = hostels.filter(h => String(h.managerId) === String(auth.user?.id));
  const managerHostelIds = managerHostels.map(h => String(h.id));
  const visibleRooms = rooms.filter(r => managerHostelIds.includes(String(r.hostelId)));
  const visibleBookings = bookings.filter(b => managerHostelIds.includes(String(b.hostelId)));
  const visibleReviews = reviews.filter(r => managerHostelIds.includes(String(r.hostelId)));
  const managerNotifications = notifications.filter(n => String(n.userId) === String(auth.user?.id));

  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [roomSearch, setRoomSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const [roomViewMode, setRoomViewMode] = useState<'card' | 'list'>('card');
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [payoutStats, setPayoutStats] = useState<any>(null);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationDropdownOpen && !(event.target as Element).closest('.notification-dropdown')) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationDropdownOpen]);

  useEffect(() => {
    refreshData();
    refreshBookings();
    refreshNotifications();
  }, []);

  // Edit states for Hostels and Rooms
  const [editingHostel, setEditingHostel] = useState<any | null>(null);
  const [editHostelData, setEditHostelData] = useState({ name: '', address: '', description: '', distanceFromCampus: '', priceRange: '', platformFee: '' });

  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [editRoomData, setEditRoomData] = useState({ roomNumber: '', type: '', price: '', capacity: '', gender: 'unisex' as 'male' | 'female' | 'unisex', description: '' });

  const handleUpdateHostel = (hostel: any) => {
    if (!hostel) return;
    setEditingHostel(hostel);
    setEditHostelData({
      name: hostel.name || '',
      address: hostel.address || '',
      description: hostel.description || '',
      distanceFromCampus: hostel.distanceFromCampus || '',
      priceRange: hostel.priceRange || '',
      platformFee: hostel.platformFee !== undefined && hostel.platformFee !== null ? String(hostel.platformFee) : '0',
    });
  };

  const handleSaveHostelEdit = async () => {
    if (!editingHostel) return;
    try {
      const response: any = await updateHostelApi(editingHostel.id, {
        name: editHostelData.name,
        address: editHostelData.address,
        description: editHostelData.description,
        distance_from_campus: editHostelData.distanceFromCampus,
        price_range: editHostelData.priceRange,
        platform_fee: parseFloat(editHostelData.platformFee) || 0,
      });

      if (response.status === 'success') {
        updateHostel({
          ...editingHostel,
          name: editHostelData.name,
          address: editHostelData.address,
          description: editHostelData.description,
          distanceFromCampus: editHostelData.distanceFromCampus,
          priceRange: editHostelData.priceRange,
          platformFee: parseFloat(editHostelData.platformFee) || 0,
        });
        setEditingHostel(null);
      } else {
        alert(response.message || 'Failed to update hostel');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleUpdateRoom = (room: any) => {
    if (!room) return;
    setEditingRoom(room);
    setEditRoomData({
      roomNumber: room.roomNumber || '',
      type: room.type || 'Standard',
      price: room.price !== undefined && room.price !== null ? String(room.price) : '',
      capacity: room.capacity !== undefined && room.capacity !== null ? String(room.capacity) : '',
      gender: (room.gender === 'mixed' ? 'unisex' : room.gender || 'unisex') as 'male' | 'female' | 'unisex',
      description: room.description || '',
    });
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoom) return;
    try {
      const response: any = await updateRoomApi(editingRoom.id, {
        room_number: editRoomData.roomNumber,
        type: editRoomData.type,
        price: Number(editRoomData.price),
        capacity: Number(editRoomData.capacity),
        gender: editRoomData.gender,
        description: editRoomData.description,
      });

      if (response.status === 'success') {
        updateRoom({
          ...editingRoom,
          roomNumber: editRoomData.roomNumber,
          type: editRoomData.type,
          price: Number(editRoomData.price),
          capacity: Number(editRoomData.capacity),
          gender: editRoomData.gender,
          description: editRoomData.description
        });
        setEditingRoom(null);
      } else {
        alert(response.message || 'Failed to update room');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };


  const managerName = auth.user?.full_name || 'Manager';
  const filteredRooms = visibleRooms.filter(room => {
    const query = roomSearch.trim().toLowerCase();
    if (!query) return true;
    const hostel = hostels.find(h => h.id === room.hostelId);
    return room.roomNumber.toLowerCase().includes(query)
      || room.type.toLowerCase().includes(query)
      || hostel?.name.toLowerCase().includes(query);
  });

  const totalRevenue = visibleBookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.reservationFee, 0);
  const pendingBookings = visibleBookings.filter(b => b.status === 'pending').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'paid': return 'bg-green-100 text-green-700';
      case 'rejected': case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const openAddRoom = () => {
    navigate('/add-room');
  };

  const handleUpdateOccupancy = async (roomId: string, action: 'increment' | 'decrement') => {
    try {
      const response: any = await updateRoomOccupancy(roomId, action);
      if (response.status === 'success') {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          const manualOccupancy = room.manualOccupancy || 0;
          const newManualOccupancy = action === 'increment' ? manualOccupancy + 1 : Math.max(0, manualOccupancy - 1);
          const currentOccupancy = room.occupancy || 0;
          const newOccupancy = action === 'increment' ? currentOccupancy + 1 : Math.max(0, currentOccupancy - 1);
          const newAvailable = newOccupancy < room.capacity;
          updateRoom({ ...room, manualOccupancy: newManualOccupancy, occupancy: newOccupancy, available: newAvailable });
        }
        refreshData();
      }
    } catch (error: any) {
      alert(error.message || 'Could not update room occupancy.');
    }
  };

  const handleToggleAvailability = async (roomId: string, currentAvailable: boolean) => {
    try {
      const response: any = await updateRoomStatus(roomId, !currentAvailable);
      if (response.status === 'success') {
        updateRoom({ ...rooms.find(r => r.id === roomId)!, available: !currentAvailable });
        refreshData();
      }
    } catch (error: any) {
      alert(error.message || 'Could not update room status.');
    }
  };

  const handleConfirmCode = async (booking: Booking) => {
    if (!booking.id) return;
    setIsConfirmingBooking(true);
    try {
      const response: any = await approveBooking(booking.id, 'completed');
      if (response.status === 'success') {
        await refreshBookings();
        alert('Booking confirmed successfully.');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to confirm booking.');
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  const filteredBookings = visibleBookings.filter(booking => {
    const query = bookingSearch.trim().toLowerCase();
    if (!query) return true;
    const hostel = hostels.find(h => h.id === booking.hostelId);
    const room = rooms.find(r => r.id === booking.roomId);
    return (
      booking.authCode?.toLowerCase().includes(query) ||
      booking.userName?.toLowerCase().includes(query) ||
      booking.userGender?.toLowerCase().includes(query) ||
      booking.roomNumber?.toLowerCase().includes(query) ||
      room?.roomNumber?.toLowerCase().includes(query) ||
      hostel?.name.toLowerCase().includes(query)
    );
  });

  const tabs: { id: ManagerTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'hostels', label: 'Hostels' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'payouts', label: '💰 Payouts' },
  ];

  // Fetch payout stats when Payouts tab is opened
  useEffect(() => {
    if (activeTab === 'payouts' && !payoutStats) {
      setIsLoadingPayouts(true);
      getPayoutStats()
        .then(data => setPayoutStats(data))
        .catch(err => console.error('Payout stats error:', err))
        .finally(() => setIsLoadingPayouts(false));
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Hostel Manager Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back, {managerName}. Manage your assigned hostel, rooms, walk-in reservations, and availability from one place.</p>
            </div>

            {/* Profile and Notifications */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="notification-dropdown relative">
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative p-2 text-gray-400 hover:text-amber-400 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {managerNotifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold min-w-[18px] min-h-[18px]">
                      {managerNotifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationDropdownOpen && (
                  <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      {managerNotifications.some(n => !n.read) && (
                        <button
                          onClick={() => {
                            markAllNotificationsRead();
                            setNotificationDropdownOpen(false);
                          }}
                          className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {managerNotifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No new notifications.</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {managerNotifications.slice(0, 10).map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationRead(notif);
                                setNotificationDropdownOpen(false);
                              }}
                              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-amber-50/50' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.read ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                                  <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {managerNotifications.length > 10 && (
                      <div className="p-3 border-t border-gray-100 text-center">
                        <button
                          onClick={() => {
                            setActiveTab('notifications');
                            setNotificationDropdownOpen(false);
                          }}
                          className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-full px-3 py-1.5 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                  {auth.user?.full_name?.charAt(0) || 'M'}
                </div>
                <span className="text-sm font-medium text-gray-200 max-w-[100px] truncate">
                  {auth.user?.full_name?.split(' ')[0] || 'Manager'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                {tab.label}
                {tab.id === 'notifications' && managerNotifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center">
                    {managerNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Hostels assigned', value: managerHostels.length.toString(), color: 'bg-blue-500', icon: Building2 },
                { label: 'Total Rooms', value: visibleRooms.length.toString(), color: 'bg-green-500', icon: DoorOpen },
                { label: 'Revenue (paid)', value: `GH₵${totalRevenue}`, color: 'bg-amber-500', icon: BarChart3 },
                { label: 'Pending bookings', value: pendingBookings.toString(), color: 'bg-purple-500', icon: Calendar },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Assigned Hostels</h3>
                {managerHostels.length === 0 ? (
                  <p className="text-sm text-gray-500">No hostel assigned yet. Contact an admin to get a hostel assigned.</p>
                ) : (
                  <div className="space-y-3">
                    {managerHostels.map(hostel => (
                      <div key={hostel.id} className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                        <h4 className="font-semibold text-gray-900">{hostel.name}</h4>
                        <p className="text-sm text-gray-500">{hostel.address}</p>
                        <p className="text-sm text-gray-600 mt-2">{rooms.filter(r => r.hostelId === hostel.id).length} rooms available</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Current Bookings</h3>
                {visibleBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">No booking activity for your hostels yet.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleBookings.slice(0, 5).map(booking => {
                      const hostel = hostels.find(h => h.id === booking.hostelId);
                      const room = rooms.find(r => r.id === booking.roomId);
                      return (
                        <div key={booking.id} className="rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="font-semibold text-gray-800">Booking #{booking.id}</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(booking.status)}`}>{booking.status}</span>
                          </div>
                          <p className="text-sm text-gray-600">{hostel?.name} • Room {room?.roomNumber}</p>
                          <p className="text-sm text-gray-500 mt-1">Payment: {booking.paymentStatus}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hostels' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Hostels ({managerHostels.length})</h2>
                <p className="text-sm text-gray-500">View only the hostel(s) assigned to your account.</p>
              </div>
            </div>

            {managerHostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                You do not have an assigned hostel yet. Please contact an admin to assign one to your manager account.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">University</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rooms</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {managerHostels.map(hostel => {
                        const uni = universities.find(u => u.id === hostel.universityId);
                        const hostelRooms = rooms.filter(r => r.hostelId === hostel.id);
                        return (
                          <tr key={hostel.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">{hostel.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{uni?.name.split(' ').slice(0, 3).join(' ')}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{hostelRooms.length}</td>
                            <td className="px-6 py-4 text-sm text-gray-600"><Star className="w-4 h-4 text-amber-500 fill-amber-500 inline-block mr-1" />{hostel.rating}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => navigate(`/hostels/${hostel.id}`)} className="text-amber-600 hover:text-amber-700 text-sm font-semibold">View details</button>
                                <button onClick={() => handleUpdateHostel(hostel)} className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1">
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Rooms ({filteredRooms.length})</h2>
                <p className="text-sm text-gray-500">Search rooms by number, type or hostel name.</p>
              </div>
              <button onClick={openAddRoom} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>

            <div className="mb-6 max-w-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="w-full md:max-w-md">
                  <label htmlFor="roomSearch" className="sr-only">Search rooms</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="roomSearch" type="text" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="Search rooms by number, type, or hostel..." className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => setRoomViewMode('card')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${roomViewMode === 'card' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Box view
                  </button>
                  <button onClick={() => setRoomViewMode('list')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${roomViewMode === 'list' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    List view
                  </button>
                </div>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No rooms match your search. Add a new room or change the query.
              </div>
            ) : (
              <>
                {roomViewMode === 'card' ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredRooms.map(room => {
                      const hostel = hostels.find(h => h.id === room.hostelId);
                      const occupancy = room.occupancy || 0;
                      return (
                        <div key={room.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all duration-200">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">{hostel?.name || 'Hostel'}</p>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">Room {room.roomNumber}</h3>
                              <p className="text-sm text-gray-600">{room.type || 'Standard'} • {room.gender}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {room.available ? 'Available' : 'Occupied'}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div>Capacity: {room.capacity}</div>
                            <div>Price: GH₵{room.price.toLocaleString()}</div>
                            <div className="col-span-2 text-gray-500">{room.capacity > 1 ? `${occupancy} boarded / ${room.capacity} capacity` : 'Single occupancy room'}</div>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button onClick={() => handleUpdateOccupancy(room.id, 'increment')} disabled={occupancy >= room.capacity} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${occupancy < room.capacity ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
                              Reserve bed
                            </button>
                            {(room.manualOccupancy || 0) > 0 && (
                              <button onClick={() => handleUpdateOccupancy(room.id, 'decrement')} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition">
                                Free manual bed
                              </button>
                            )}
                            <button onClick={() => handleUpdateRoom(room)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition">
                              Edit
                            </button>
                            <button onClick={() => navigate(`/hostels/${room.hostelId}`)} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition">
                              View hostel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Room</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Gender</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredRooms.map(room => {
                            const hostel = hostels.find(h => h.id === room.hostelId);
                            const occupancy = room.occupancy || 0;
                            return (
                              <tr key={room.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">Room {room.roomNumber}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{hostel?.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{room.gender}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{room.type}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{room.capacity}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-amber-600">GH₵{room.price.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {room.available ? 'Available' : 'Occupied'}{room.capacity > 1 ? ` • ${occupancy}/${room.capacity}` : ''}
                                  </span>
                                </td>
                                <td className="px-6 py-4 flex flex-wrap gap-2">
                                  <button onClick={() => handleUpdateOccupancy(room.id, 'increment')} disabled={occupancy >= room.capacity} className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50">
                                    Reserve bed
                                  </button>
                                  {(room.manualOccupancy || 0) > 0 && (
                                    <button onClick={() => handleUpdateOccupancy(room.id, 'decrement')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200">
                                      Free bed
                                    </button>
                                  )}
                                  <button onClick={() => handleUpdateRoom(room)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200">
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Bookings for your hostel(s)</h2>
            <div className="mb-6 max-w-xl">
              <label htmlFor="bookingSearch" className="text-sm font-medium text-gray-700 mb-2 block">Search by student name, room or confirmation code</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="bookingSearch"
                  type="text"
                  value={bookingSearch}
                  onChange={e => setBookingSearch(e.target.value)}
                  placeholder="Search code, student name, room or hostel..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No matching bookings found. Try a different code or student name.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map(booking => {
                  const hostel = hostels.find(h => h.id === booking.hostelId);
                  const room = rooms.find(r => r.id === booking.roomId);
                  return (
                    <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Booking #{booking.id}</p>
                          <p className="text-sm text-gray-500">{hostel?.name} • Room {room?.roomNumber || booking.roomNumber} ({room?.type || booking.roomType})</p>
                          <p className="text-sm text-gray-500 mt-1">Student: {booking.userName || 'Unknown'} • {booking.userGender ? booking.userGender.charAt(0).toUpperCase() + booking.userGender.slice(1) : 'N/A'}</p>
                          {booking.authCode && (
                            <p className="text-sm text-amber-700 mt-2">Confirmation code: <span className="font-semibold">{booking.authCode}</span></p>
                          )}
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(booking.status)}`}>{booking.status}</span>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                          </div>
                          <p className="text-sm text-gray-600">Reservation fee: GH₵{booking.reservationFee}</p>
                          {booking.status === 'approved' && booking.authCode && booking.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleConfirmCode(booking)}
                              disabled={isConfirmingBooking}
                              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60"
                            >
                              {isConfirmingBooking ? 'Confirming...' : 'Confirm arrival'}
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-sm font-semibold text-green-700">Arrival confirmed</span>
                          )}
                          {booking.status === 'pending' && (
                            <p className="text-sm text-amber-700">Pending approval from admin.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews for your hostel(s)</h2>
            {visibleReviews.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No reviews yet. Once students stay and rate your hostel, they will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {visibleReviews.map(review => {
                  const hostel = hostels.find(h => h.id === review.hostelId);
                  return (
                    <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">{review.userName?.[0]}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{review.userName}</p>
                              <p className="text-xs text-gray-500">{hostel?.name}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }, (_, index) => (
                                <Star key={index} className={`w-3.5 h-3.5 ${index < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
                          <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">{managerNotifications.filter(n => !n.read).length} unread</p>
              </div>
              {managerNotifications.some(n => !n.read) && (
                <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="divide-y">
              {managerNotifications.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No new notifications.</div>
              ) : (
                managerNotifications.map(notif => (
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

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {isLoadingPayouts ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Loading payout data...</p>
                </div>
              </div>
            ) : payoutStats ? (
              <>
                {/* T+1 Settlement Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Paystack T+1 Settlement Policy</p>
                    <p className="text-xs text-blue-600 mt-0.5">Funds collected today are held by Paystack for 24 hours before being transferred to your bank account. This protects against chargebacks and fraud.</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Earned (All Time)', value: `GH₵${Number(payoutStats.summary?.totalEarned || 0).toFixed(2)}`, icon: TrendingUp, color: 'bg-green-500', sub: `${payoutStats.summary?.totalBookings || 0} paid bookings` },
                    { label: 'This Month', value: `GH₵${Number(payoutStats.summary?.thisMonth || 0).toFixed(2)}`, icon: BarChart3, color: 'bg-amber-500', sub: 'Current month revenue' },
                    { label: 'Last Month', value: `GH₵${Number(payoutStats.summary?.lastMonth || 0).toFixed(2)}`, icon: ArrowUpRight, color: 'bg-blue-500', sub: 'Previous month revenue' },
                    { label: 'Pending Settlement', value: `GH₵${Number(payoutStats.summary?.pendingSettlement || 0).toFixed(2)}`, icon: Clock, color: 'bg-orange-500', sub: 'Within last 24 hrs (T+1 hold)' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</span>
                        <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center shrink-0`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Bank Account Info */}
                {payoutStats.hostels?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark className="w-4 h-4 text-amber-500" /> Linked Bank Accounts</h3>
                    <div className="space-y-3">
                      {payoutStats.hostels.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{h.name}</p>
                            <p className="text-xs text-gray-500">{h.bank_name || 'Bank on file'} {h.account_number ? `• ${h.account_number}` : ''}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                              {h.subaccount_code ? 'Subaccount Active' : 'No Subaccount'}
                            </span>
                            {h.commission_type === 'flat' && (
                              <p className="text-xs text-gray-400 mt-1">Flat fee: GH₵{h.platform_fee}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /> Transaction History</h3>
                    <span className="text-xs text-gray-400">{payoutStats.transactions?.length || 0} transactions</span>
                  </div>
                  {payoutStats.transactions?.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No paid transactions yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Student</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Room</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Gross</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Fee</th>
                            <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Net</th>
                            <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {payoutStats.transactions.map((t: any) => (
                            <tr key={t.booking_id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td className="px-5 py-3 text-xs font-medium text-gray-800">{t.student_name || 'Student'}</td>
                              <td className="px-5 py-3 text-xs text-gray-500">{t.room_number} <span className="text-gray-400">({t.room_type})</span></td>
                              <td className="px-5 py-3 text-xs font-semibold text-gray-900 text-right">GH₵{Number(t.gross).toFixed(2)}</td>
                              <td className="px-5 py-3 text-xs text-red-500 text-right">{t.platform_fee_deducted > 0 ? `-GH₵${Number(t.platform_fee_deducted).toFixed(2)}` : '—'}</td>
                              <td className="px-5 py-3 text-xs font-bold text-green-700 text-right">GH₵{Number(t.net_to_manager).toFixed(2)}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  t.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>{t.status.toUpperCase()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Could not load payout data. Please try again.</p>
                <button onClick={() => { setPayoutStats(null); setActiveTab('payouts'); }} className="mt-4 text-sm text-amber-600 font-semibold hover:underline">Retry</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Hostel Modal */}
      {editingHostel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Edit Hostel: {editingHostel.name}</h3>
              <button onClick={() => setEditingHostel(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Hostel Name *</label>
                <input value={editHostelData.name} onChange={e => setEditHostelData({ ...editHostelData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Address *</label>
                <input value={editHostelData.address} onChange={e => setEditHostelData({ ...editHostelData, address: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={editHostelData.description} onChange={e => setEditHostelData({ ...editHostelData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Distance from Campus</label>
                  <input value={editHostelData.distanceFromCampus} onChange={e => setEditHostelData({ ...editHostelData, distanceFromCampus: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. 0.5 km" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price Range</label>
                  <input value={editHostelData.priceRange} onChange={e => setEditHostelData({ ...editHostelData, priceRange: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. GH₵2,000 - 3,500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Platform / Booking Fee (GH₵)</label>
                <input type="number" value={editHostelData.platformFee} onChange={e => setEditHostelData({ ...editHostelData, platformFee: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. 300" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingHostel(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveHostelEdit} className="flex-1 py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900">Edit Room: {editingRoom.roomNumber}</h3>
              <button onClick={() => setEditingRoom(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Room Number *</label>
                  <input value={editRoomData.roomNumber} onChange={e => setEditRoomData({ ...editRoomData, roomNumber: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Room Type</label>
                  <input value={editRoomData.type} onChange={e => setEditRoomData({ ...editRoomData, type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. Standard, Executive" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price (GH₵) *</label>
                  <input type="number" value={editRoomData.price} onChange={e => setEditRoomData({ ...editRoomData, price: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity (Beds) *</label>
                  <input type="number" value={editRoomData.capacity} onChange={e => setEditRoomData({ ...editRoomData, capacity: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Gender *</label>
                <select value={editRoomData.gender} onChange={e => setEditRoomData({ ...editRoomData, gender: e.target.value as 'male' | 'female' | 'unisex' })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white">
                  <option value="male">Male only</option>
                  <option value="female">Female only</option>
                  <option value="unisex">Unisex / Mixed</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea value={editRoomData.description} onChange={e => setEditRoomData({ ...editRoomData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. Spacious with private balcony..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingRoom(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveRoomEdit} className="flex-1 py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
