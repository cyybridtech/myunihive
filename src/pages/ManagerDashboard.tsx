import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, Calendar, Star, BarChart3, Plus, DoorOpen, Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createRoom, updateRoomStatus, updateRoomOccupancy, approveBooking } from '../api/api.js';
import { Booking } from '../data/mockData';

type ManagerTab = 'overview' | 'hostels' | 'rooms' | 'bookings' | 'reviews' | 'notifications';

export default function ManagerDashboard() {
  const auth = useAuth();
  const { hostels, rooms, bookings, reviews, universities, notifications, refreshBookings, refreshData, addRoom, updateRoom, markNotificationRead, markAllNotificationsRead } = useApp();
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
  ];

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
                              <button onClick={() => navigate(`/hostels/${hostel.id}`)} className="text-amber-600 hover:text-amber-700 text-sm font-semibold">View details</button>
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
      </div>
    </div>
  );
}
