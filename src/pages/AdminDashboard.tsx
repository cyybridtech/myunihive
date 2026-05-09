import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Calendar, CreditCard, Star, BarChart3, Plus, Trash2, CheckCircle, XCircle, Eye, Pencil, GraduationCap, DoorOpen, TrendingUp, AlertCircle, Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { approveBooking, createHostel, createRoom, createUniversity, deleteHostel as deleteHostelApi, deleteRoom as deleteRoomApi, deleteUniversity as deleteUniversityApi, updateRoom as updateRoomApi, updateHostel as updateHostelApi, updateRoomOccupancy, uploadImage } from '../api/api.js';
import type { Hostel, Room } from '../data/mockData';

type AdminTab = 'overview' | 'hostels' | 'rooms' | 'bookings' | 'users' | 'reviews' | 'universities' | 'notifications';

export default function AdminDashboard() {
  const auth = useAuth();
  const { hostels, rooms, bookings, reviews, universities, notifications, markNotificationRead, markAllNotificationsRead, refreshBookings, refreshData, deleteHostel, deleteRoom, deleteUniversity, addHostel, addRoom, addUniversity, updateRoom, updateHostel, updateBookingStatus } = useApp();
  const navigate = useNavigate();
  const isManager = auth.user?.role === 'manager' || auth.user?.role === 'hostel_manager';
  const managerHostels = isManager ? hostels.filter(h => String(h.managerId) === String(auth.user?.id)) : hostels;
  const managerHostelIds = managerHostels.map(h => String(h.id));
  const visibleHostels = isManager ? managerHostels : hostels;
  const visibleRooms = isManager ? rooms.filter(r => managerHostelIds.includes(String(r.hostelId))) : rooms;
  const visibleBookings = isManager ? bookings.filter(b => managerHostelIds.includes(String(b.hostelId))) : bookings;
  const visibleReviews = isManager ? reviews.filter(r => managerHostelIds.includes(String(r.hostelId))) : reviews;
  const unreadNotifications = notifications.filter(n => !n.read && String(n.userId) === String(auth.user?.id));
  const unreadCount = unreadNotifications.length;
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddUniversity, setShowAddUniversity] = useState(false);
  const [selectedHostelForRoom, setSelectedHostelForRoom] = useState('');
  const [newUniversity, setNewUniversity] = useState({ name: '', city: '', country: 'Ghana' });
  const [hostelSearch, setHostelSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const filteredHostels = visibleHostels.filter(h => {
    const query = hostelSearch.trim().toLowerCase();
    if (!query) return true;
    const uniName = universities.find(u => u.id === h.universityId)?.name.toLowerCase() || '';
    return h.name.toLowerCase().includes(query) || h.address.toLowerCase().includes(query) || uniName.includes(query);
  });
  const filteredRooms = visibleRooms.filter(r => {
    const query = roomSearch.trim().toLowerCase();
    if (!query) return true;
    const hostel = hostels.find(h => h.id === r.hostelId);
    return r.roomNumber.toLowerCase().includes(query) || r.type.toLowerCase().includes(query) || hostel?.name.toLowerCase().includes(query);
  });

  if (!auth.user || (auth.user.role !== 'admin' && auth.user.role !== 'manager' && auth.user.role !== 'hostel_manager')) {
    navigate('/login');
    return null;
  }

  const [newHostel, setNewHostel] = useState({ name: '', universityId: 'u1', address: '', description: '', facilities: '' as string, distanceFromCampus: '', priceRange: '', bankCode: '', accountNumber: '', managerFullName: '', managerEmail: '', managerPhone: '', managerPassword: '', managerGender: 'male' });
  const [hostelImageFile, setHostelImageFile] = useState<File | null>(null);
  const [newRoom, setNewRoom] = useState<{ roomNumber: string; capacity: string; price: string; description: string; type: string; gender: 'male' | 'female' }>({ roomNumber: '', capacity: '1', price: '', description: '', type: '', gender: 'male' });
  const [roomImageFile, setRoomImageFile] = useState<File | null>(null);

  const totalRevenue = visibleBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.reservationFee, 0);
  const pendingBookings = visibleBookings.filter(b => b.status === 'pending').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'paid': return 'bg-green-100 text-green-700';
      case 'rejected': case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const handleAddHostel = async () => {
    if (!newHostel.name || !newHostel.address) return;

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80';
      if (hostelImageFile) {
        const uploadRes = await uploadImage(hostelImageFile);
        if (uploadRes.status === 'success' && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }

      const response = await createHostel({
        name: newHostel.name,
        university_id: newHostel.universityId,
        address: newHostel.address,
        description: newHostel.description,
        distance_from_campus: newHostel.distanceFromCampus,
        price_range: newHostel.priceRange,
        main_image: imageUrl,
        bank_code: newHostel.bankCode,
        account_number: newHostel.accountNumber,
        manager_full_name: newHostel.managerFullName,
        manager_email: newHostel.managerEmail,
        manager_phone: newHostel.managerPhone,
        manager_password: newHostel.managerPassword,
        manager_gender: newHostel.managerGender
      });
      if (response.status === 'success') {
        addHostel({
          id: response.id,
          name: newHostel.name,
          universityId: newHostel.universityId,
          address: newHostel.address,
          description: newHostel.description || 'New verified hostel',
          facilities: newHostel.facilities.split(',').map(f => f.trim()).filter(Boolean),
          distanceFromCampus: newHostel.distanceFromCampus || '1.0 km',
          priceRange: newHostel.priceRange || 'GH₵1,000 – GH₵2,000',
          mainImage: imageUrl,
          gallery: [imageUrl],
          verified: true,
          managerId: response.manager_id || null,
          subaccountCode: response.subaccount_code || null,
          rating: 0.0,
          reviewCount: 0,
        });
        setNewHostel({ name: '', universityId: (universities[0]?.id || 'u1'), address: '', description: '', facilities: '', distanceFromCampus: '', priceRange: '', bankCode: '', accountNumber: '', managerFullName: '', managerEmail: '', managerPhone: '', managerPassword: '', managerGender: 'male' });
        setHostelImageFile(null);
        setShowAddHostel(false);
      } else {
        alert(response.message || 'Failed to create hostel');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.price || !selectedHostelForRoom) return;

    try {
      let imageUrl = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80';
      if (roomImageFile) {
        const uploadRes = await uploadImage(roomImageFile);
        if (uploadRes.status === 'success' && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }

      const response = await createRoom({
        hostel_id: selectedHostelForRoom,
        room_number: newRoom.roomNumber,
        capacity: parseInt(newRoom.capacity),
        price: parseInt(newRoom.price),
        type: newRoom.type || 'Standard',
        gender: newRoom.gender,
        description: newRoom.description,
        image: imageUrl
      });
      if (response.status === 'success') {
        addRoom({
          id: response.id,
          hostelId: selectedHostelForRoom,
          roomNumber: newRoom.roomNumber,
          capacity: parseInt(newRoom.capacity),
          price: parseInt(newRoom.price),
          available: true,
          gender: newRoom.gender,
          description: newRoom.description || 'New room',
          image: imageUrl,
          type: newRoom.type || 'Standard',
        });
        setNewRoom({ roomNumber: '', capacity: '1', price: '', description: '', type: '', gender: 'male' });
        setRoomImageFile(null);
        setShowAddRoom(false);
      } else {
        alert(response.message || 'Failed to create room');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleUpdateHostel = async (hostel: Hostel) => {
    const name = window.prompt('Enter hostel name', hostel.name) ?? hostel.name;
    const address = window.prompt('Enter address', hostel.address) ?? hostel.address;
    const description = window.prompt('Enter description', hostel.description) ?? hostel.description;
    const distanceFromCampus = window.prompt('Enter distance from campus', hostel.distanceFromCampus) ?? hostel.distanceFromCampus;
    const priceRange = window.prompt('Enter price range', hostel.priceRange) ?? hostel.priceRange;

    try {
      const response = await updateHostelApi(hostel.id, {
        name,
        address,
        description,
        distance_from_campus: distanceFromCampus,
        price_range: priceRange,
      });

      if (response.status === 'success') {
        updateHostel({ ...hostel, name, address, description, distanceFromCampus, priceRange });
      } else {
        alert(response.message || 'Failed to update hostel');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleUpdateRoom = async (room: Room) => {
    const roomNumber = window.prompt('Room number', room.roomNumber) ?? room.roomNumber;
    const type = window.prompt('Room type', room.type) ?? room.type;
    const price = Number(window.prompt('Room price', String(room.price)) ?? room.price);
    const capacity = Number(window.prompt('Room capacity', String(room.capacity)) ?? room.capacity);
    const gender = window.prompt('Room gender (male/female)', room.gender) as 'male' | 'female' || room.gender;
    const description = window.prompt('Room description', room.description) ?? room.description;

    try {
      const response = await updateRoomApi(room.id, {
        room_number: roomNumber,
        type,
        price,
        capacity,
        gender,
        description,
      });

      if (response.status === 'success') {
        updateRoom({ ...room, roomNumber, type, price, capacity, gender, description });
      } else {
        alert(response.message || 'Failed to update room');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Delete this room permanently?')) return;

    try {
      const response = await deleteRoomApi(roomId);
      if (response.status === 'success') {
        deleteRoom(roomId);
      } else {
        alert(response.message || 'Failed to delete room');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleDeleteUniversity = async (universityId: string) => {
    if (!window.confirm('Delete this university and all associated hostels, rooms, and bookings?')) return;

    try {
      const response = await deleteUniversityApi(universityId);
      if (response.status === 'success') {
        deleteUniversity(universityId);
      } else {
        alert(response.message || 'Failed to delete university');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleUpdateOccupancy = async (roomId: string, action: 'increment' | 'decrement') => {
    try {
      const response = await updateRoomOccupancy(roomId, action);
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
      } else {
        alert(response.message || 'Could not update room occupancy');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleAddUniversity = async () => {
    if (!newUniversity.name || !newUniversity.city) return;
    try {
      const response = await createUniversity(newUniversity);
      if (response.status === 'success') {
        addUniversity({
          id: response.id,
          name: newUniversity.name,
          city: newUniversity.city,
          country: newUniversity.country
        });
        setNewUniversity({ name: '', city: '', country: 'Ghana' });
        setShowAddUniversity(false);
      } else {
        alert(response.message || 'Failed to create university');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleDeleteHostel = async (hostelId: string) => {
    if (!confirm('Delete this hostel permanently?')) return;

    try {
      const response = await deleteHostelApi(hostelId);
      if (response.status === 'success') {
        deleteHostel(hostelId);
      } else {
        alert(response.message || 'Failed to delete hostel');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'hostels', label: 'Hostels', icon: Building2 },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'universities', label: 'Universities', icon: GraduationCap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">{isManager ? 'Manager Dashboard' : 'Admin Dashboard'}</h1>
          <p className="text-gray-400 text-sm">{isManager ? 'Manage your assigned hostel, rooms, and booking requests' : 'Manage hostels, bookings, and platform operations'}</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
                {tab.id === 'bookings' && pendingBookings > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center">{pendingBookings}</span>
                )}
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 min-w-[18px] text-center">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Hostels', value: visibleHostels.length.toString(), icon: Building2, color: 'bg-blue-500', trend: '+2 this month' },
                { label: 'Total Bookings', value: visibleBookings.length.toString(), icon: Calendar, color: 'bg-green-500', trend: `${pendingBookings} pending` },
                { label: 'Revenue (Fees)', value: `GH₵${totalRevenue}`, icon: CreditCard, color: 'bg-amber-500', trend: '+15% this month' },
                { label: 'Total Reviews', value: visibleReviews.length.toString(), icon: Star, color: 'bg-purple-500', trend: 'Avg 4.5 stars' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {stat.trend}</p>
                </div>
              ))}
            </div>

            {/* Analytics Charts - Simplified visual */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Bookings by University</h3>
                <div className="space-y-3">
                  {universities.map(uni => {
                    const uniBookings = bookings.filter(b => {
                      const hostel = hostels.find(h => h.id === b.hostelId);
                      return hostel?.universityId === uni.id;
                    }).length;
                    const maxBookings = Math.max(...universities.map(u => bookings.filter(b => { const h = hostels.find(h2 => h2.id === b.hostelId); return h?.universityId === u.id; }).length), 1);
                    const progressClass = uniBookings >= maxBookings ? 'w-full' : uniBookings / maxBookings >= 0.9 ? 'w-[90%]' : uniBookings / maxBookings >= 0.75 ? 'w-[75%]' : uniBookings / maxBookings >= 0.6 ? 'w-[60%]' : uniBookings / maxBookings >= 0.45 ? 'w-[45%]' : uniBookings / maxBookings >= 0.3 ? 'w-[30%]' : uniBookings / maxBookings >= 0.15 ? 'w-[15%]' : 'w-[8%]';
                    return (
                      <div key={uni.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 truncate mr-2">{uni.name.split(' ').slice(0, 3).join(' ')}</span>
                          <span className="font-semibold text-gray-800">{uniBookings}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-amber-500 rounded-full transition-all ${progressClass}`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Popular Hostels</h3>
                <div className="space-y-3">
                  {hostels.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5).map((hostel, i) => (
                    <div key={hostel.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <img src={hostel.mainImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{hostel.name}</p>
                        <p className="text-xs text-gray-400">{hostel.reviewCount} reviews</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-gray-800">{hostel.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            {pendingBookings > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">You have {pendingBookings} pending booking(s)</p>
                  <p className="text-sm text-gray-500">Review and approve or reject pending bookings</p>
                </div>
                <button onClick={() => setActiveTab('bookings')} className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 flex-shrink-0">Review</button>
              </div>
            )}
          </div>
        )}

        {/* Hostels Management */}
        {activeTab === 'hostels' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Hostels ({filteredHostels.length})</h2>
                <p className="text-sm text-gray-500">Search, review and manage your property listings with confidence.</p>
              </div>
              {!isManager && (
                <button onClick={() => navigate('/admin/add-hostel')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Add Hostel
                </button>
              )}
            </div>
            <div className="mb-6 max-w-md">
              <label htmlFor="hostelSearch" className="sr-only">Search hostels</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="hostelSearch" type="text" value={hostelSearch} onChange={e => setHostelSearch(e.target.value)} placeholder="Search hostels, addresses or universities..." className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
              </div>
            </div>

            {isManager && managerHostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-gray-700 text-sm">You currently do not have an assigned hostel. Please contact an admin to assign a hostel to your manager account.</p>
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No hostels match your search. Try a different name, address, or university.
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
                      {filteredHostels.map(hostel => {
                        const uni = universities.find(u => u.id === hostel.universityId);
                        const hostelRooms = rooms.filter(r => r.hostelId === hostel.id);
                        return (
                          <tr key={hostel.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={hostel.mainImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">{hostel.name}</p>
                                  <p className="text-xs text-gray-500">{hostel.address}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{uni?.name.split(' ').slice(0, 3).join(' ')}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{hostelRooms.length} ({hostelRooms.filter(r => r.available).length} avail)</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="text-sm font-medium">{hostel.rating}</span></div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button aria-label="View hostel" onClick={() => navigate(`/hostels/${hostel.id}`)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                {!isManager && (
                                  <>
                                    <button aria-label="Edit hostel" onClick={() => handleUpdateHostel(hostel)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button aria-label="Delete hostel" onClick={() => handleDeleteHostel(hostel.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </>
                                )}
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

            {/* Add Hostel Modal Removed */}
          </div>
        )}

        {/* Rooms Management */}
        {activeTab === 'rooms' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Rooms ({filteredRooms.length})</h2>
                <p className="text-sm text-gray-500">Quickly find rooms by number, type, or hostel name.</p>
              </div>
              <button onClick={() => navigate('/add-room')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
            <div className="mb-6 max-w-md">
              <label htmlFor="roomSearch" className="sr-only">Search rooms</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="roomSearch" type="text" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="Search rooms by number, type, or hostel..." className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No rooms match your search. Try another room number or type.
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
                      return (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">Room {room.roomNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{hostel?.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">{room.gender ?? 'Not set'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{room.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{room.capacity}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-amber-600">GH₵{room.price.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {room.available ? 'Available' : 'Occupied'}
                              {(() => {
                                const occupancy = room.occupancy || 0;
                                return room.capacity > 1 ? ` • ${occupancy}/${room.capacity}` : '';
                              })()}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex flex-wrap gap-2">
                            <button aria-label="Reserve bed" onClick={() => handleUpdateOccupancy(room.id, 'increment')} disabled={room.capacity <= (room.occupancy || 0)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50">
                              Reserve bed
                            </button>
                            {(room.manualOccupancy || 0) > 0 && (
                              <button aria-label="Free bed" onClick={() => handleUpdateOccupancy(room.id, 'decrement')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200">
                                Free bed
                              </button>
                            )}
                            <button aria-label="Edit room" onClick={() => handleUpdateRoom(room)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200">
                              Edit
                            </button>
                            <button aria-label="Delete room" onClick={() => handleDeleteRoom(room.id)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200">
                              Delete
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

            {/* Add Room Modal Removed */}
          </div>
        )}

        {/* Bookings Management */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Bookings ({visibleBookings.length})</h2>
            <div className="space-y-4">
              {visibleBookings.map(booking => {
                const hostel = hostels.find(h => h.id === booking.hostelId);
                const room = rooms.find(r => r.id === booking.roomId);
                return (
                  <div key={booking.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-800">Booking #{booking.id}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(booking.status)}`}>{booking.status}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div><span className="text-gray-400 text-xs">Hostel</span><p className="font-medium">{hostel?.name}</p></div>
                          <div><span className="text-gray-400 text-xs">Room</span><p className="font-medium">{room?.type} ({room?.roomNumber})</p></div>
                          <div><span className="text-gray-400 text-xs">Fee</span><p className="font-medium text-amber-600">GH₵{booking.reservationFee}</p></div>
                          <div><span className="text-gray-400 text-xs">Date</span><p className="font-medium">{booking.bookingDate}</p></div>
                        </div>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button type="button" onClick={async () => {
                            try {
                              await approveBooking(booking.id, 'approved');
                              updateBookingStatus(booking.id, 'approved');
                              await refreshBookings();
                            } catch (error) {
                              const err = error instanceof Error ? error : new Error(String(error));
                              alert('Failed to approve booking: ' + err.message);
                            }
                          }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button type="button" onClick={async () => {
                            try {
                              await approveBooking(booking.id, 'rejected');
                              updateBookingStatus(booking.id, 'rejected');
                              await refreshBookings();
                            } catch (error) {
                              const err = error instanceof Error ? error : new Error(String(error));
                              alert('Failed to reject booking: ' + err.message);
                            }
                          }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Reviews ({visibleReviews.length})</h2>
            <div className="space-y-4">
              {visibleReviews.map(review => {
                const hostel = hostels.find(h => h.id === review.hostelId);
                return (
                  <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{review.userAvatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-sm">{review.userName}</span>
                            <span className="text-xs text-gray-400">on {hostel?.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
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
          </div>
        )}

        {/* Universities */}
        {activeTab === 'universities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Universities ({universities.length})</h2>
              {!isManager && (
                <button onClick={() => setShowAddUniversity(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Add University
                </button>
              )}
            </div>

            {isManager && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Managers cannot add or edit universities from this dashboard. Contact an admin for university setup.
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {universities.map(uni => {
                const uniHostels = hostels.filter(h => String(h.universityId) === String(uni.id));
                return (
                  <div key={uni.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{uni.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{uni.city || 'No City'}, {uni.country || 'No Country'}</p>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-amber-600 font-semibold">{uniHostels.length} hostels</span>
                        <span className="text-gray-400">{rooms.filter(r => uniHostels.some(h => h.id === r.hostelId)).length} rooms</span>
                      </div>
                      {!isManager && (
                        <button aria-label="Delete university" onClick={() => handleDeleteUniversity(uni.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add University Modal */}
            {showAddUniversity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Add New University</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">University Name *</label>
                      <input value={newUniversity.name} onChange={e => setNewUniversity({ ...newUniversity, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g., University of Ghana" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">City *</label>
                        <input value={newUniversity.city} onChange={e => setNewUniversity({ ...newUniversity, city: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g., Accra" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Country</label>
                        <input value={newUniversity.country} onChange={e => setNewUniversity({ ...newUniversity, country: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g., Ghana" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowAddUniversity(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleAddUniversity} className="flex-1 py-3 bg-amber-500 rounded-xl text-sm font-bold text-white hover:bg-amber-600">Add University</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <button onClick={markAllNotificationsRead} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Mark all as read</button>
              )}
            </div>
            
            <div className="space-y-4">
              {notifications.filter(n => String(n.userId) === String(auth.user?.id)).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                  No notifications to display.
                </div>
              ) : (
                notifications
                  .filter(n => String(n.userId) === String(auth.user?.id))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(notification => (
                    <div key={notification.id} className={`bg-white rounded-xl border ${notification.read ? 'border-gray-100' : 'border-amber-200 bg-amber-50/30'} p-5 flex items-start gap-4 transition-colors`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-600'}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold text-sm ${notification.read ? 'text-gray-800' : 'text-gray-900'}`}>{notification.title}</h3>
                          <span className="text-xs text-gray-400">{notification.date}</span>
                        </div>
                        <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>{notification.message}</p>
                        {!notification.read && (
                          <button onClick={() => markNotificationRead(notification)} className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700">
                            Mark as read
                          </button>
                        )}
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
