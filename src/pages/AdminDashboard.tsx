import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, Calendar, CreditCard, Star, BarChart3, Plus, Trash2, 
  CheckCircle, XCircle, Eye, Pencil, GraduationCap, DoorOpen, 
  Search, Bell, X, MapPin, UploadCloud, Check, ShieldCheck, 
  BedDouble, ArrowUpRight, Zap, Map as MapIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { 
  approveBooking, createUniversity, 
  deleteHostel as deleteHostelApi, deleteRoom as deleteRoomApi, 
  deleteUniversity as deleteUniversityApi, updateRoom as updateRoomApi, 
  updateHostel as updateHostelApi, updateUniversity as updateUniversityApi,
  updateRoomOccupancy, uploadImage 
} from '../api/api.js';
import type { Hostel, Room, University } from '../data/mockData';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAPBOX_STREETS_STYLE, OSM_FALLBACK_STYLE } from '../utils/mapConfig';
import { GHANA_PRESET_UNIVERSITIES } from '../data/ghanaUniversities';
import AdminUsersTab from '../components/AdminUsersTab';
type AdminTab = 'overview' | 'users' | 'hostels' | 'rooms' | 'bookings' | 'reviews' | 'universities' | 'notifications';

const COMMON_FACILITIES = [
  'Wi-Fi', '24/7 Water Supply', 'Backup Generator', '24/7 Security / CCTV', 
  'Air Conditioning', 'Study Room', 'Kitchen Facilities', 'Car Parking', 
  'Laundry Service', 'DSTV / Common Room', 'Balcony', 'Ensuite Washroom'
];

const COMMON_AMENITIES = [
  'Air Conditioning', 'Ensuite Bathroom', 'Balcony', 'Study Desk & Chair', 
  'Wardrobe', 'Refrigerator', 'Ceiling Fan', 'Water Heater', 'Bookshelf'
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function AdminDashboard() {
  const auth = useAuth();
  const { 
    hostels, rooms, bookings, reviews, universities, notifications, 
    markNotificationRead, markAllNotificationsRead, refreshBookings, 
    refreshData, refreshNotifications, deleteHostel, deleteRoom, 
    deleteUniversity, updateRoom, updateHostel, updateUniversity,
    updateBookingStatus, deleteNotification 
  } = useApp();
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

  useEffect(() => {
    refreshData();
    refreshBookings();
    refreshNotifications();
  }, []);

  // Filter searches
  const [hostelSearch, setHostelSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  // University Modals state
  const [showAddUniversity, setShowAddUniversity] = useState(false);
  const [newUniversity, setNewUniversity] = useState<{ name: string; city: string; country: string; lat: number | null; lng: number | null }>({ 
    name: '', 
    city: '', 
    country: 'Ghana', 
    lat: 5.6505, 
    lng: -0.1962 
  });
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [editUniversityData, setEditUniversityData] = useState<{ name: string; city: string; country: string; lat: number | null; lng: number | null }>({
    name: '',
    city: '',
    country: 'Ghana',
    lat: null,
    lng: null
  });
  const [adminMapStyle, setAdminMapStyle] = useState<string | object>(MAPBOX_STREETS_STYLE);

  // Edit Hostel state
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [editHostelData, setEditHostelData] = useState({
    name: '',
    universityId: '',
    address: '',
    description: '',
    distanceFromCampus: '',
    priceRange: '',
    paymentPeriod: 'semester' as 'semester' | 'academic_year',
    verified: true,
    platformFee: '0',
    commissionType: 'split' as 'split' | 'flat',
    bankCode: '',
    accountNumber: '',
    mainImage: '',
    facilities: [] as string[],
    lat: '' as string | number,
    lng: '' as string | number,
  });
  const [hostelImageFile, setHostelImageFile] = useState<File | null>(null);
  const [isSavingHostel, setIsSavingHostel] = useState(false);

  // Edit Room state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomData, setEditRoomData] = useState({
    roomNumber: '',
    type: 'Standard',
    price: '',
    capacity: '1',
    gender: 'unisex' as 'male' | 'female' | 'unisex',
    available: true,
    description: '',
    amenities: [] as string[],
    image: '',
  });
  const [roomImageFile, setRoomImageFile] = useState<File | null>(null);
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Map reference for pin placement
  const addUniMapRef = useRef<any>(null);
  const editUniMapRef = useRef<any>(null);

  // Filtered lists
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

  // Aggregate metrics
  const totalRevenue = visibleBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.reservationFee, 0);
  const pendingBookings = visibleBookings.filter(b => b.status === 'pending').length;
  const approvedBookings = visibleBookings.filter(b => b.status === 'approved').length;
  const totalBeds = visibleRooms.reduce((acc, r) => acc + (r.capacity || 1), 0);
  const occupiedBeds = visibleRooms.reduce((acc, r) => acc + (r.occupancy || (r.available ? 0 : r.capacity || 1)), 0);
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const verifiedHostelsCount = visibleHostels.filter(h => h.verified).length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': case 'completed': case 'paid': return 'bg-green-100 text-green-700';
      case 'rejected': case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  // --- HOSTEL EDIT HANDLERS ---
  const handleOpenEditHostel = (hostel: Hostel) => {
    if (!hostel) return;
    setEditingHostel(hostel);
    setHostelImageFile(null);
    setEditHostelData({
      name: hostel.name || '',
      universityId: hostel.universityId || (universities[0]?.id || ''),
      address: hostel.address || '',
      description: hostel.description || '',
      distanceFromCampus: hostel.distanceFromCampus || '1.0 km',
      priceRange: hostel.priceRange || '',
      paymentPeriod: hostel.paymentPeriod || 'semester',
      verified: hostel.verified ?? true,
      platformFee: hostel.platformFee !== undefined && hostel.platformFee !== null ? String(hostel.platformFee) : '0',
      commissionType: hostel.commissionType || 'split',
      bankCode: '',
      accountNumber: '',
      mainImage: hostel.mainImage || '',
      facilities: Array.isArray(hostel.facilities) ? [...hostel.facilities] : [],
      lat: hostel.lat !== undefined ? hostel.lat : '',
      lng: hostel.lng !== undefined ? hostel.lng : '',
    });
  };

  const toggleHostelFacility = (facility: string) => {
    setEditHostelData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSaveHostelEdit = async () => {
    if (!editingHostel) return;
    setIsSavingHostel(true);
    try {
      let finalImageUrl = editHostelData.mainImage;
      if (hostelImageFile) {
        const uploadRes = await uploadImage(hostelImageFile);
        if (uploadRes.status === 'success' && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      // Auto-calculate distance if lat/lng are set and university has coordinates
      let computedDistance = editHostelData.distanceFromCampus;
      const targetUni = universities.find(u => u.id === editHostelData.universityId);
      if (targetUni && typeof targetUni.lat === 'number' && typeof targetUni.lng === 'number') {
        const hLat = typeof editHostelData.lat === 'number' ? editHostelData.lat : parseFloat(String(editHostelData.lat));
        const hLng = typeof editHostelData.lng === 'number' ? editHostelData.lng : parseFloat(String(editHostelData.lng));
        if (!isNaN(hLat) && !isNaN(hLng)) {
          computedDistance = `${calculateDistanceKm(targetUni.lat, targetUni.lng, hLat, hLng)} km`;
        }
      }

      const response = await updateHostelApi(editingHostel.id, {
        name: editHostelData.name,
        university_id: editHostelData.universityId,
        address: editHostelData.address,
        description: editHostelData.description,
        distance_from_campus: computedDistance,
        price_range: editHostelData.priceRange,
        main_image: finalImageUrl,
        facilities: editHostelData.facilities,
        verified: editHostelData.verified,
        payment_period: editHostelData.paymentPeriod,
        commission_type: editHostelData.commissionType,
        bank_code: editHostelData.bankCode,
        account_number: editHostelData.accountNumber,
        platform_fee: parseFloat(editHostelData.platformFee) || 0,
        lat: editHostelData.lat !== '' ? Number(editHostelData.lat) : undefined,
        lng: editHostelData.lng !== '' ? Number(editHostelData.lng) : undefined,
      });

      if (response.status === 'success') {
        updateHostel({
          ...editingHostel,
          name: editHostelData.name,
          universityId: editHostelData.universityId,
          address: editHostelData.address,
          description: editHostelData.description,
          distanceFromCampus: computedDistance,
          priceRange: editHostelData.priceRange,
          mainImage: finalImageUrl,
          facilities: editHostelData.facilities,
          verified: editHostelData.verified,
          paymentPeriod: editHostelData.paymentPeriod,
          commissionType: editHostelData.commissionType,
          platformFee: parseFloat(editHostelData.platformFee) || 0,
          lat: editHostelData.lat !== '' ? Number(editHostelData.lat) : undefined,
          lng: editHostelData.lng !== '' ? Number(editHostelData.lng) : undefined,
        });
        setEditingHostel(null);
        refreshData();
      } else {
        alert(response.message || 'Failed to update hostel');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    } finally {
      setIsSavingHostel(false);
    }
  };

  // --- ROOM EDIT HANDLERS ---
  const handleOpenEditRoom = (room: Room) => {
    if (!room) return;
    setEditingRoom(room);
    setRoomImageFile(null);
    setEditRoomData({
      roomNumber: room.roomNumber || '',
      type: room.type || 'Standard',
      price: room.price !== undefined && room.price !== null ? String(room.price) : '',
      capacity: room.capacity !== undefined && room.capacity !== null ? String(room.capacity) : '1',
      gender: ((room.gender as any) === 'mixed' ? 'unisex' : room.gender || 'unisex') as 'male' | 'female' | 'unisex',
      available: room.available ?? true,
      description: room.description || '',
      amenities: Array.isArray(room.amenities) ? [...room.amenities] : [],
      image: room.image || '',
    });
  };

  const toggleRoomAmenity = (amenity: string) => {
    setEditRoomData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoom) return;
    setIsSavingRoom(true);
    try {
      let finalImageUrl = editRoomData.image;
      if (roomImageFile) {
        const uploadRes = await uploadImage(roomImageFile);
        if (uploadRes.status === 'success' && uploadRes.url) {
          finalImageUrl = uploadRes.url;
        }
      }

      const response = await updateRoomApi(editingRoom.id, {
        room_number: editRoomData.roomNumber,
        type: editRoomData.type,
        price: Number(editRoomData.price),
        capacity: Number(editRoomData.capacity),
        gender: editRoomData.gender,
        available: editRoomData.available,
        description: editRoomData.description,
        amenities: editRoomData.amenities,
        image: finalImageUrl,
      });

      if (response.status === 'success') {
        updateRoom({
          ...editingRoom,
          roomNumber: editRoomData.roomNumber,
          type: editRoomData.type,
          price: Number(editRoomData.price),
          capacity: Number(editRoomData.capacity),
          gender: editRoomData.gender,
          available: editRoomData.available,
          description: editRoomData.description,
          amenities: editRoomData.amenities,
          image: finalImageUrl,
        });
        setEditingRoom(null);
        refreshData();
      } else {
        alert(response.message || 'Failed to update room');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    } finally {
      setIsSavingRoom(false);
    }
  };

  // --- UNIVERSITY HANDLERS WITH MAP PICKER ---
  const handleAddUniversity = async () => {
    if (!newUniversity.name.trim() || !newUniversity.city.trim()) {
      alert('Please provide university name and city');
      return;
    }
    try {
      const response = await createUniversity({
        name: newUniversity.name.trim(),
        city: newUniversity.city.trim(),
        country: newUniversity.country.trim() || 'Ghana',
        lat: newUniversity.lat,
        lng: newUniversity.lng,
      });
      if (response.status === 'success') {
        updateUniversity({
          id: response.id,
          name: newUniversity.name.trim(),
          city: newUniversity.city.trim(),
          country: newUniversity.country.trim() || 'Ghana',
          lat: newUniversity.lat || undefined,
          lng: newUniversity.lng || undefined,
        });
        setNewUniversity({ name: '', city: '', country: 'Ghana', lat: 5.6505, lng: -0.1962 });
        setShowAddUniversity(false);
        refreshData();
      } else {
        alert(response.message || 'Failed to create university');
      }
    } catch (error: any) {
      alert('Network error: ' + error.message);
    }
  };

  const handleOpenEditUniversity = (uni: University) => {
    setEditingUniversity(uni);
    setEditUniversityData({
      name: uni.name,
      city: uni.city,
      country: uni.country || 'Ghana',
      lat: typeof uni.lat === 'number' ? uni.lat : 5.6505,
      lng: typeof uni.lng === 'number' ? uni.lng : -0.1962,
    });
  };

  const handleSaveUniversityEdit = async () => {
    if (!editingUniversity) return;
    try {
      const response = await updateUniversityApi(editingUniversity.id, {
        name: editUniversityData.name.trim(),
        city: editUniversityData.city.trim(),
        country: editUniversityData.country.trim() || 'Ghana',
        lat: editUniversityData.lat,
        lng: editUniversityData.lng,
      });
      if (response.status === 'success') {
        updateUniversity({
          ...editingUniversity,
          name: editUniversityData.name.trim(),
          city: editUniversityData.city.trim(),
          country: editUniversityData.country.trim() || 'Ghana',
          lat: editUniversityData.lat || undefined,
          lng: editUniversityData.lng || undefined,
        });
        setEditingUniversity(null);
        refreshData();
      } else {
        alert(response.message || 'Failed to update university');
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

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'hostels', label: 'Hostels', icon: Building2 },
    { id: 'rooms', label: 'Rooms', icon: DoorOpen },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'universities', label: 'Universities', icon: GraduationCap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-50/70 pb-16">
      {/* Top Header Banner */}
      <div className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Zap className="w-3 h-3 text-amber-400" /> Platform Operations
                </span>
                <span className="text-xs text-gray-400">Ghana Campus Network</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isManager ? 'Hostel Manager Control Panel' : 'UniHive Central Administration'}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {isManager ? 'Manage your assigned properties, bed allotments, and resident bookings' : 'Oversee properties, room inventory, university mapping, and revenue'}
              </p>
            </div>

            {/* Quick Action Buttons on Header */}
            <div className="flex items-center gap-3">
              {!isManager && (
                <button 
                  onClick={() => navigate('/admin/add-hostel')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Hostel
                </button>
              )}
              <button 
                onClick={() => navigate('/add-room')}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-px scrollbar-none">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-amber-500 text-amber-400 font-semibold' 
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
                {tab.id === 'bookings' && pendingBookings > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold rounded-full px-1.5 py-0.2 min-w-[18px] text-center">
                    {pendingBookings}
                  </span>
                )}
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="bg-amber-500 text-gray-900 text-[11px] font-bold rounded-full px-1.5 py-0.2 min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================================================= */}
        {/* 1. OVERVIEW TAB (UPGRADED) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* KPI Metric Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Hostels */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Hostels</span>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{visibleHostels.length}</p>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100 text-gray-500">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> {verifiedHostelsCount} Verified
                  </span>
                  <span>{visibleHostels.length - verifiedHostelsCount} Unverified</span>
                </div>
              </div>

              {/* Card 2: Bed Capacity & Occupancy */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Bed Spaces</span>
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <BedDouble className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-gray-900">{totalBeds}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {occupancyPercentage}% full
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100 text-gray-500">
                  <span className="text-amber-600 font-medium">{occupiedBeds} Occupied</span>
                  <span className="text-green-600 font-medium">{Math.max(0, totalBeds - occupiedBeds)} Available</span>
                </div>
              </div>

              {/* Card 3: Bookings */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Bookings</span>
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">{visibleBookings.length}</p>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100 text-gray-500">
                  <span className="text-green-600 font-medium">{approvedBookings} Approved</span>
                  {pendingBookings > 0 ? (
                    <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                      {pendingBookings} Pending Action
                    </span>
                  ) : (
                    <span className="text-gray-400">0 Pending</span>
                  )}
                </div>
              </div>

              {/* Card 4: Platform Revenue */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Platform Fees</span>
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-gray-900">GH₵{totalRevenue.toLocaleString()}</p>
                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100 text-gray-500">
                  <span className="text-gray-600">From verified bookings</span>
                  <span className="text-amber-600 font-medium">Secured</span>
                </div>
              </div>

            </div>

            {/* Quick Actions Hub & Occupancy Progress */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Capacity Progress Bar */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" /> Bed Space Inventory & Occupancy
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Real-time allotment across all managed rooms</p>
                  </div>
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full self-start sm:self-auto">
                    {occupiedBeds} of {totalBeds} beds reserved
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-4 p-0.5 border border-gray-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyPercentage > 90 ? 'bg-red-500' : occupancyPercentage > 75 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, occupancyPercentage))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center pt-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-medium">Total Capacity</p>
                    <p className="text-lg font-bold text-gray-800">{totalBeds} Beds</p>
                  </div>
                  <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60">
                    <p className="text-xs text-amber-700 font-medium">Occupied</p>
                    <p className="text-lg font-bold text-amber-900">{occupiedBeds} Beds</p>
                  </div>
                  <div className="bg-green-50/50 rounded-xl p-3 border border-green-100/60">
                    <p className="text-xs text-green-700 font-medium">Available</p>
                    <p className="text-lg font-bold text-green-900">{Math.max(0, totalBeds - occupiedBeds)} Beds</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Quick Operational Actions</h3>
                  <p className="text-xs text-gray-400 mb-5">Jump directly to common administration tasks</p>
                  
                  <div className="space-y-2.5">
                    {!isManager && (
                      <button 
                        onClick={() => navigate('/admin/add-hostel')}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                      >
                        <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-amber-400" /> Add New Hostel</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}

                    <button 
                      onClick={() => navigate('/add-room')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                    >
                      <span className="flex items-center gap-2"><DoorOpen className="w-4 h-4 text-amber-400" /> Add New Room</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>

                    {!isManager && (
                      <button 
                        onClick={() => { setActiveTab('universities'); setShowAddUniversity(true); }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                      >
                        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-amber-400" /> Add & Map University</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}

                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors"
                    >
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Review Bookings ({pendingBookings} pending)</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* University Distribution & Popular Hostels */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Bookings by University */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-base">Bookings by University</h3>
                  <span className="text-xs text-gray-400 font-medium">{universities.length} Campuses</span>
                </div>
                
                {universities.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-6 text-center">No universities registered yet.</p>
                ) : (
                  <div className="space-y-3.5">
                    {universities.map(uni => {
                      const uniBookings = visibleBookings.filter(b => {
                        const hostel = hostels.find(h => h.id === b.hostelId);
                        return hostel?.universityId === uni.id;
                      }).length;
                      const maxBookings = Math.max(...universities.map(u => visibleBookings.filter(b => {
                        const h = hostels.find(h2 => h2.id === b.hostelId);
                        return h?.universityId === u.id;
                      }).length), 1);
                      const pct = Math.round((uniBookings / maxBookings) * 100);

                      return (
                        <div key={uni.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700 truncate mr-2">{uni.name} ({uni.city})</span>
                            <span className="font-bold text-gray-900">{uniBookings} bookings</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(4, pct)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Popular Hostels Leaderboard */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-base">Popular & Top-Rated Hostels</h3>
                  <button onClick={() => setActiveTab('hostels')} className="text-xs text-amber-600 hover:text-amber-700 font-semibold">
                    View all
                  </button>
                </div>

                {visibleHostels.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-6 text-center">No hostels found.</p>
                ) : (
                  <div className="space-y-3">
                    {[...visibleHostels]
                      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
                      .slice(0, 5)
                      .map((hostel, i) => (
                        <div key={hostel.id} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <img src={hostel.mainImage} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{hostel.name}</p>
                            <p className="text-xs text-gray-400 truncate">{hostel.address}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{hostel.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>

            {/* Recent Bookings Table in Overview */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recent Booking Requests</h3>
                  <p className="text-xs text-gray-500">Quickly review and approve latest reservation inquiries</p>
                </div>
                <button onClick={() => setActiveTab('bookings')} className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                  See all bookings ({visibleBookings.length})
                </button>
              </div>

              {visibleBookings.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">No booking requests received yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-semibold border-y border-gray-100">
                      <tr>
                        <th className="px-4 py-3">Booking ID</th>
                        <th className="px-4 py-3">Hostel & Room</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleBookings.slice(0, 5).map(b => {
                        const hostel = hostels.find(h => h.id === b.hostelId);
                        const room = rooms.find(r => r.id === b.roomId);
                        return (
                          <tr key={b.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">#{b.id}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800 text-xs">{hostel?.name || 'Hostel'}</p>
                              <p className="text-[11px] text-gray-400">{room?.type} • Room {room?.roomNumber}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700">{b.userName || 'Student'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{b.bookingDate}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusColor(b.status)}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {b.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await approveBooking(b.id, 'approved');
                                        updateBookingStatus(b.id, 'approved');
                                        await refreshBookings();
                                      } catch (err: any) {
                                        alert('Approval failed: ' + err.message);
                                      }
                                    }}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded-lg" 
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await approveBooking(b.id, 'rejected');
                                        updateBookingStatus(b.id, 'rejected');
                                        await refreshBookings();
                                      } catch (err: any) {
                                        alert('Rejection failed: ' + err.message);
                                      }
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg" 
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* USERS & IDENTITY (KYC) TAB */}
        {/* ========================================================================= */}
        {activeTab === 'users' && <AdminUsersTab />}

        {/* ========================================================================= */}
        {/* 2. HOSTELS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'hostels' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Hostels ({filteredHostels.length})</h2>
                <p className="text-sm text-gray-500">Search, update amenities, pricing, campus distance, and verified badges.</p>
              </div>
              {!isManager && (
                <button 
                  onClick={() => navigate('/admin/add-hostel')} 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Hostel
                </button>
              )}
            </div>

            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={hostelSearch} 
                  onChange={e => setHostelSearch(e.target.value)} 
                  placeholder="Search hostels, addresses or universities..." 
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm shadow-sm" 
                />
              </div>
            </div>

            {isManager && managerHostels.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-700 text-sm">
                You currently do not have an assigned hostel. Please contact an admin to assign a hostel to your manager account.
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No hostels match your search.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">University</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Distance</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Rooms</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredHostels.map(hostel => {
                        const uni = universities.find(u => u.id === hostel.universityId);
                        const hostelRooms = rooms.filter(r => r.hostelId === hostel.id);
                        return (
                          <tr key={hostel.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={hostel.mainImage} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{hostel.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-xs">{hostel.address}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{uni?.name || 'Not assigned'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1 font-medium text-xs bg-gray-100 px-2 py-1 rounded-md">
                                <MapPin className="w-3 h-3 text-amber-500" /> {hostel.distanceFromCampus || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {hostelRooms.length} ({hostelRooms.filter(r => r.available).length} avail)
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${hostel.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {hostel.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <button 
                                  aria-label="View hostel" 
                                  onClick={() => navigate(`/hostels/${hostel.id}`)} 
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Public Page"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  aria-label="Edit hostel" 
                                  onClick={() => handleOpenEditHostel(hostel)} 
                                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Edit All Details"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                {!isManager && (
                                  <button 
                                    aria-label="Delete hostel" 
                                    onClick={() => handleDeleteHostel(hostel.id)} 
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Hostel"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ROOMS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'rooms' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Rooms ({filteredRooms.length})</h2>
                <p className="text-sm text-gray-500">Edit room types, pricing, capacity, amenities, and toggle availability.</p>
              </div>
              <button 
                onClick={() => navigate('/add-room')} 
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>

            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={roomSearch} 
                  onChange={e => setRoomSearch(e.target.value)} 
                  placeholder="Search rooms by number, type, or hostel..." 
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm shadow-sm" 
                />
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                No rooms match your search.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Room</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Hostel</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Type / Gender</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Price</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRooms.map(room => {
                        const hostel = hostels.find(h => h.id === room.hostelId);
                        return (
                          <tr key={room.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {room.image ? (
                                  <img src={room.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold text-xs">
                                    R{room.roomNumber}
                                  </div>
                                )}
                                <span className="text-sm font-bold text-gray-900">Room {room.roomNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{hostel?.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <p className="font-medium text-xs text-gray-800">{room.type}</p>
                              <span className="text-[11px] text-gray-400 capitalize">{room.gender || 'Unisex'}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{room.capacity} Bed{room.capacity > 1 ? 's' : ''}</td>
                            <td className="px-6 py-4 text-sm font-bold text-amber-600">GH₵{room.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {room.available ? 'Available' : 'Occupied'}
                                {room.capacity > 1 ? ` • ${room.occupancy || 0}/${room.capacity}` : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button 
                                  onClick={() => handleUpdateOccupancy(room.id, 'increment')} 
                                  disabled={room.capacity <= (room.occupancy || 0)} 
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40"
                                >
                                  + Bed
                                </button>
                                {(room.manualOccupancy || 0) > 0 && (
                                  <button 
                                    onClick={() => handleUpdateOccupancy(room.id, 'decrement')} 
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  >
                                    - Bed
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleOpenEditRoom(room)} 
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title="Edit Room"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRoom(room.id)} 
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete Room"
                                >
                                  <Trash2 className="w-4 h-4" />
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

        {/* ========================================================================= */}
        {/* 4. BOOKINGS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Bookings ({visibleBookings.length})</h2>
            <div className="space-y-4">
              {visibleBookings.map(booking => {
                const hostel = hostels.find(h => h.id === booking.hostelId);
                const room = rooms.find(r => r.id === booking.roomId);
                return (
                  <div key={booking.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-900">Booking #{booking.id}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor(booking.status)}`}>{booking.status}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-2">
                          <div><span className="text-gray-400 block mb-0.5">Hostel</span><p className="font-semibold text-gray-800">{hostel?.name}</p></div>
                          <div><span className="text-gray-400 block mb-0.5">Room</span><p className="font-semibold text-gray-800">{room?.type} (Rm {room?.roomNumber})</p></div>
                          <div><span className="text-gray-400 block mb-0.5">Fee</span><p className="font-bold text-amber-600">GH₵{booking.reservationFee}</p></div>
                          <div><span className="text-gray-400 block mb-0.5">Date</span><p className="font-semibold text-gray-800">{booking.bookingDate}</p></div>
                        </div>
                      </div>
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button 
                            type="button" 
                            onClick={async () => {
                              try {
                                await approveBooking(booking.id, 'approved');
                                updateBookingStatus(booking.id, 'approved');
                                await refreshBookings();
                              } catch (err: any) {
                                alert('Failed: ' + err.message);
                              }
                            }} 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            type="button" 
                            onClick={async () => {
                              try {
                                await approveBooking(booking.id, 'rejected');
                                updateBookingStatus(booking.id, 'rejected');
                                await refreshBookings();
                              } catch (err: any) {
                                alert('Failed: ' + err.message);
                              }
                            }} 
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                          >
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

        {/* ========================================================================= */}
        {/* 5. REVIEWS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Manage Reviews ({visibleReviews.length})</h2>
            <div className="space-y-4">
              {visibleReviews.map(review => {
                const hostel = hostels.find(h => h.id === review.hostelId);
                return (
                  <div key={review.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {review.userAvatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{review.userName}</span>
                            <span className="text-xs text-gray-400">on {hostel?.name}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. UNIVERSITIES TAB (WITH MAP LOCATION PICKER) */}
        {/* ========================================================================= */}
        {activeTab === 'universities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Universities & Campus Coordinates ({universities.length})</h2>
                <p className="text-sm text-gray-500">Pin campus GPS locations on the map to automate distance calculation to all nearby hostels.</p>
              </div>
              {!isManager && (
                <button 
                  onClick={() => setShowAddUniversity(true)} 
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add University
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {universities.map(uni => {
                const uniHostels = hostels.filter(h => String(h.universityId) === String(uni.id));
                const hasCoordinates = typeof uni.lat === 'number' && typeof uni.lng === 'number';

                return (
                  <div key={uni.id} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${hasCoordinates ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {hasCoordinates ? 'GPS Mapped' : 'No Pin'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base mb-0.5">{uni.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{uni.city || 'Ghana'}, {uni.country || 'Ghana'}</p>

                      {hasCoordinates ? (
                        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-gray-600 mb-4 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{uni.lat?.toFixed(4)}, {uni.lng?.toFixed(4)}</span>
                        </div>
                      ) : (
                        <div className="bg-amber-50/60 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-800 mb-4">
                          ⚠️ Click Edit to pin campus on map
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <span className="font-semibold text-amber-600">{uniHostels.length} hostels</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditUniversity(uni)} 
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                          title="Edit University & Map Location"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        {!isManager && (
                          <button 
                            onClick={() => handleDeleteUniversity(uni.id)} 
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ADD UNIVERSITY MODAL WITH INTERACTIVE MAP */}
            {showAddUniversity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Add New University</h3>
                    <button onClick={() => setShowAddUniversity(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                        Quick Select Ghanaian University (Auto-fill GPS)
                      </label>
                      <select
                        onChange={(e) => {
                          const selected = GHANA_PRESET_UNIVERSITIES.find(u => u.name === e.target.value);
                          if (selected) {
                            setNewUniversity({
                              name: selected.name,
                              city: selected.city,
                              country: selected.country,
                              lat: selected.lat,
                              lng: selected.lng
                            });
                            addUniMapRef.current?.flyTo({
                              center: [selected.lng, selected.lat],
                              zoom: 14,
                              duration: 1500
                            });
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Choose a popular university or enter manually below --</option>
                        {GHANA_PRESET_UNIVERSITIES.map((u) => (
                          <option key={u.name} value={u.name}>
                            {u.name} ({u.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                        University Name *
                      </label>
                      <input 
                        value={newUniversity.name} 
                        onChange={e => setNewUniversity({ ...newUniversity, name: e.target.value })} 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                        placeholder="e.g. University of Ghana, Legon" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                          City / Town *
                        </label>
                        <input 
                          value={newUniversity.city} 
                          onChange={e => setNewUniversity({ ...newUniversity, city: e.target.value })} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                          placeholder="e.g. Accra" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                          Country
                        </label>
                        <input 
                          value={newUniversity.country} 
                          onChange={e => setNewUniversity({ ...newUniversity, country: e.target.value })} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                          placeholder="Ghana" 
                        />
                      </div>
                    </div>

                    {/* MAPBOX INTERACTIVE CAMPUS PIN PICKER */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapIcon className="w-3.5 h-3.5 text-amber-500" /> Click on Map to Pin Campus Center
                        </label>
                        {newUniversity.lat !== null && newUniversity.lng !== null && (
                          <span className="text-[11px] font-mono text-gray-500">
                            {newUniversity.lat.toFixed(4)}, {newUniversity.lng.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <div className="relative rounded-xl overflow-hidden border border-gray-200 h-[260px] w-full">
                        <Map
                          ref={addUniMapRef}
                          mapboxAccessToken={MAPBOX_TOKEN}
                          initialViewState={{
                            latitude: newUniversity.lat || 5.6505,
                            longitude: newUniversity.lng || -0.1962,
                            zoom: 12
                          }}
                          mapStyle={adminMapStyle}
                          onError={(e) => {
                            console.warn('Mapbox streets tiles unavailable, switching to OpenStreetMap fallback:', e);
                            setAdminMapStyle(OSM_FALLBACK_STYLE);
                          }}
                          onClick={(e: any) => {
                            if (e.lngLat) {
                              setNewUniversity(prev => ({
                                ...prev,
                                lat: e.lngLat.lat,
                                lng: e.lngLat.lng
                              }));
                            }
                          }}
                        >
                          {newUniversity.lat !== null && newUniversity.lng !== null && (
                            <Marker
                              latitude={newUniversity.lat}
                              longitude={newUniversity.lng}
                              anchor="bottom"
                              draggable
                              onDragEnd={(e: any) => {
                                setNewUniversity(prev => ({
                                  ...prev,
                                  lat: e.lngLat.lat,
                                  lng: e.lngLat.lng
                                }));
                              }}
                            >
                              <div className="flex flex-col items-center">
                                <span className="bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">Campus</span>
                                <MapPin className="w-7 h-7 text-amber-500 fill-amber-500 -mt-1 drop-shadow" />
                              </div>
                            </Marker>
                          )}
                        </Map>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        📍 Tip: Click anywhere or drag the marker to pin the exact center of campus.
                      </p>
                    </div>

                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setShowAddUniversity(false)} 
                      className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddUniversity} 
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-sm font-bold text-white shadow-md shadow-amber-500/20"
                    >
                      Save University
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT UNIVERSITY MODAL WITH INTERACTIVE MAP */}
            {editingUniversity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Edit University: {editingUniversity.name}</h3>
                    <button onClick={() => setEditingUniversity(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                        Preset Coordinates Lookup
                      </label>
                      <select
                        onChange={(e) => {
                          const selected = GHANA_PRESET_UNIVERSITIES.find(u => u.name === e.target.value);
                          if (selected) {
                            setEditUniversityData({
                              name: selected.name,
                              city: selected.city,
                              country: selected.country,
                              lat: selected.lat,
                              lng: selected.lng
                            });
                            editUniMapRef.current?.flyTo({
                              center: [selected.lng, selected.lat],
                              zoom: 14,
                              duration: 1500
                            });
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Auto-fill coordinates from popular university --</option>
                        {GHANA_PRESET_UNIVERSITIES.map((u) => (
                          <option key={u.name} value={u.name}>
                            {u.name} ({u.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                        University Name *
                      </label>
                      <input 
                        value={editUniversityData.name} 
                        onChange={e => setEditUniversityData({ ...editUniversityData, name: e.target.value })} 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                          City / Town *
                        </label>
                        <input 
                          value={editUniversityData.city} 
                          onChange={e => setEditUniversityData({ ...editUniversityData, city: e.target.value })} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                          Country
                        </label>
                        <input 
                          value={editUniversityData.country} 
                          onChange={e => setEditUniversityData({ ...editUniversityData, country: e.target.value })} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                        />
                      </div>
                    </div>

                    {/* MAPBOX INTERACTIVE CAMPUS PIN PICKER */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapIcon className="w-3.5 h-3.5 text-amber-500" /> Click to Set Campus GPS Coordinates
                        </label>
                        {editUniversityData.lat !== null && editUniversityData.lng !== null && (
                          <span className="text-[11px] font-mono text-gray-500">
                            {editUniversityData.lat.toFixed(4)}, {editUniversityData.lng.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <div className="relative rounded-xl overflow-hidden border border-gray-200 h-[260px] w-full">
                        <Map
                          ref={editUniMapRef}
                          mapboxAccessToken={MAPBOX_TOKEN}
                          initialViewState={{
                            latitude: editUniversityData.lat || 5.6505,
                            longitude: editUniversityData.lng || -0.1962,
                            zoom: 13
                          }}
                          mapStyle={adminMapStyle}
                          onError={(e) => {
                            console.warn('Mapbox streets tiles unavailable, switching to OpenStreetMap fallback:', e);
                            setAdminMapStyle(OSM_FALLBACK_STYLE);
                          }}
                          onClick={(e: any) => {
                            if (e.lngLat) {
                              setEditUniversityData(prev => ({
                                ...prev,
                                lat: e.lngLat.lat,
                                lng: e.lngLat.lng
                              }));
                            }
                          }}
                        >
                          {editUniversityData.lat !== null && editUniversityData.lng !== null && (
                            <Marker
                              latitude={editUniversityData.lat}
                              longitude={editUniversityData.lng}
                              anchor="bottom"
                              draggable
                              onDragEnd={(e: any) => {
                                setEditUniversityData(prev => ({
                                  ...prev,
                                  lat: e.lngLat.lat,
                                  lng: e.lngLat.lng
                                }));
                              }}
                            >
                              <div className="flex flex-col items-center">
                                <span className="bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">Campus</span>
                                <MapPin className="w-7 h-7 text-amber-500 fill-amber-500 -mt-1 drop-shadow" />
                              </div>
                            </Marker>
                          )}
                        </Map>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        📍 Hostels linked to this university will calculate their distance from this pinned point.
                      </p>
                    </div>

                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => setEditingUniversity(null)} 
                      className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveUniversityEdit} 
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-sm font-bold text-white shadow-md shadow-amber-500/20"
                    >
                      Update Coordinates
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. NOTIFICATIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <button onClick={markAllNotificationsRead} className="text-sm text-amber-600 hover:text-amber-700 font-semibold">
                  Mark all as read
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.filter(n => String(n.userId) === String(auth.user?.id)).length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  No notifications to display.
                </div>
              ) : (
                notifications
                  .filter(n => String(n.userId) === String(auth.user?.id))
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(notification => (
                    <div 
                      key={notification.id} 
                      className={`bg-white rounded-2xl border p-5 flex items-start gap-4 transition-colors ${
                        notification.read ? 'border-gray-200/80' : 'border-amber-300 bg-amber-50/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        notification.read ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-sm text-gray-900">{notification.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{notification.date}</span>
                            <button
                              onClick={() => deleteNotification(notification)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        {!notification.read && (
                          <button 
                            onClick={() => markNotificationRead(notification)} 
                            className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700"
                          >
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

      {/* ========================================================================= */}
      {/* COMPREHENSIVE EDIT HOSTEL MODAL (EXPANDED TO ALL ATTRIBUTES) */}
      {/* ========================================================================= */}
      {editingHostel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Hostel: {editingHostel.name}</h3>
                <p className="text-xs text-gray-500">Update all details, assigned university, facilities, and media</p>
              </div>
              <button onClick={() => setEditingHostel(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              
              {/* Name & University */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Hostel Name *</label>
                  <input 
                    value={editHostelData.name} 
                    onChange={e => setEditHostelData({ ...editHostelData, name: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Assigned University *</label>
                  <select 
                    value={editHostelData.universityId} 
                    onChange={e => setEditHostelData({ ...editHostelData, universityId: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Hostel Address / Location *</label>
                <input 
                  value={editHostelData.address} 
                  onChange={e => setEditHostelData({ ...editHostelData, address: e.target.value })} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  placeholder="e.g. Near Pentagon Hall, Legon, Accra"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  value={editHostelData.description} 
                  onChange={e => setEditHostelData({ ...editHostelData, description: e.target.value })} 
                  rows={3} 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                />
              </div>

              {/* Pricing & Terms */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Price Range</label>
                  <input 
                    value={editHostelData.priceRange} 
                    onChange={e => setEditHostelData({ ...editHostelData, priceRange: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                    placeholder="e.g. GH₵2,000 - 3,500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Payment Period</label>
                  <select
                    value={editHostelData.paymentPeriod}
                    onChange={e => setEditHostelData({ ...editHostelData, paymentPeriod: e.target.value as 'semester' | 'academic_year' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="semester">Per Semester</option>
                    <option value="academic_year">Per Academic Year</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Booking Fee (GH₵)</label>
                  <input 
                    type="number" 
                    value={editHostelData.platformFee} 
                    onChange={e => setEditHostelData({ ...editHostelData, platformFee: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  />
                </div>
              </div>

              {/* Distance from campus & Verification toggle */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                    Distance from Campus
                  </label>
                  <input 
                    value={editHostelData.distanceFromCampus} 
                    onChange={e => setEditHostelData({ ...editHostelData, distanceFromCampus: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                    placeholder="e.g. 0.8 km" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">
                    Verification Status
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={editHostelData.verified} 
                      onChange={e => setEditHostelData({ ...editHostelData, verified: e.target.checked })} 
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                    <span className="text-sm font-semibold text-gray-800">Verified UniHive Property</span>
                  </label>
                </div>
              </div>

              {/* Facilities Checklist */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
                  Hostel Facilities & Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_FACILITIES.map(fac => {
                    const isChecked = editHostelData.facilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => toggleHostelFacility(fac)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                          isChecked 
                            ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{fac}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Image Upload / URL */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">
                  Main Hostel Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {editHostelData.mainImage && (
                    <img 
                      src={editHostelData.mainImage} 
                      alt="Hostel Preview" 
                      className="w-24 h-20 rounded-xl object-cover border border-gray-200 flex-shrink-0" 
                    />
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input 
                      type="text" 
                      value={editHostelData.mainImage} 
                      onChange={e => setEditHostelData({ ...editHostelData, mainImage: e.target.value })} 
                      placeholder="https://..." 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer transition-colors">
                      <UploadCloud className="w-4 h-4 text-gray-500" />
                      <span>Upload New Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setHostelImageFile(file);
                            setEditHostelData(prev => ({ ...prev, mainImage: URL.createObjectURL(file) }));
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEditingHostel(null)} 
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveHostelEdit} 
                disabled={isSavingHostel}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white shadow-md shadow-amber-500/20"
              >
                {isSavingHostel ? 'Saving Changes...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE EDIT ROOM MODAL (EXPANDED TO ALL ATTRIBUTES) */}
      {/* ========================================================================= */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Room {editingRoom.roomNumber}</h3>
                <p className="text-xs text-gray-500">Update capacity, pricing, amenities, and room status</p>
              </div>
              <button onClick={() => setEditingRoom(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Room Number & Room Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Room Number *</label>
                  <input 
                    value={editRoomData.roomNumber} 
                    onChange={e => setEditRoomData({ ...editRoomData, roomNumber: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Room Type</label>
                  <input 
                    value={editRoomData.type} 
                    onChange={e => setEditRoomData({ ...editRoomData, type: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                    placeholder="e.g. Single, 2-in-a-room, Executive"
                  />
                </div>
              </div>

              {/* Price & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Price (GH₵) *</label>
                  <input 
                    type="number" 
                    value={editRoomData.price} 
                    onChange={e => setEditRoomData({ ...editRoomData, price: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-amber-600" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Capacity (Beds) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="8" 
                    value={editRoomData.capacity} 
                    onChange={e => setEditRoomData({ ...editRoomData, capacity: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  />
                </div>
              </div>

              {/* Gender & Availability Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Gender Allowance</label>
                  <select 
                    value={editRoomData.gender} 
                    onChange={e => setEditRoomData({ ...editRoomData, gender: e.target.value as 'male' | 'female' | 'unisex' })} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  >
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                    <option value="unisex">Unisex / Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Availability</label>
                  <label className="flex items-center gap-2.5 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={editRoomData.available} 
                      onChange={e => setEditRoomData({ ...editRoomData, available: e.target.checked })} 
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500" 
                    />
                    <span className="text-xs font-bold text-gray-800">
                      {editRoomData.available ? 'Ready for Booking' : 'Occupied / Under Maintenance'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-1">Room Description</label>
                <textarea 
                  value={editRoomData.description} 
                  onChange={e => setEditRoomData({ ...editRoomData, description: e.target.value })} 
                  rows={2} 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                  placeholder="e.g. Spacious with natural lighting, private balcony..."
                />
              </div>

              {/* Room Amenities Checklist */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">Room Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_AMENITIES.map(amenity => {
                    const isChecked = editRoomData.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleRoomAmenity(amenity)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-left border transition-all ${
                          isChecked 
                            ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${isChecked ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Photo Upload */}
              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block mb-2">Room Photo</label>
                <div className="flex items-center gap-4">
                  {editRoomData.image && (
                    <img 
                      src={editRoomData.image} 
                      alt="Room Preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" 
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text" 
                      value={editRoomData.image} 
                      onChange={e => setEditRoomData({ ...editRoomData, image: e.target.value })} 
                      placeholder="https://..." 
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none" 
                    />
                    <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer transition-colors">
                      <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
                      <span>Upload Room Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setRoomImageFile(file);
                            setEditRoomData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEditingRoom(null)} 
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveRoomEdit} 
                disabled={isSavingRoom}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl text-sm font-bold text-white shadow-md shadow-amber-500/20"
              >
                {isSavingRoom ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
