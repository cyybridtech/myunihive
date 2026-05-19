import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, CheckCircle, SlidersHorizontal, X, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Map, { Marker, Popup, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRef } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY3l5YnJpZCIsImEiOiJjbXA4ZDZyZDIwb2ZmMnFzZnNpZjJ0aHF2In0.wPt2DmSb2voR6LjTI7vfyg';

export default function HostelListingPage() {
  const { filteredHostels, universities, filteredRooms, selectedUniversity, setSelectedUniversity, savedHostels, toggleSaveHostel, isAuthenticated, user } = useApp();
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [roomGenderFilter, setRoomGenderFilter] = useState<'any' | 'male' | 'female'>(user?.gender ?? 'any');
  const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'price-high' | 'distance'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const mapRef = useRef<any>(null);

  const allFacilities = ['WiFi', 'Security', 'Water Tank', 'Study Room', 'Kitchen', 'Laundry', 'Parking', 'Generator', 'AC', 'CCTV', 'Gym', 'Swimming Pool'];

  const filtered = useMemo(() => {
    let result = filteredHostels.filter(h => h.universityId === selectedUniversity);

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(h => h.name.toLowerCase().includes(s) || h.address.toLowerCase().includes(s));
    }

    const hostelPrices = (hostelId: string) => {
      const hostelRooms = filteredRooms.filter(r => r.hostelId === hostelId && r.available);
      return hostelRooms.length > 0 ? Math.min(...hostelRooms.map(r => r.price)) : 0;
    };

    if (roomGenderFilter !== 'any') {
      result = result.filter(h => {
        const hostelRooms = filteredRooms.filter(r => r.hostelId === h.id && r.available);
        return hostelRooms.some(r => r.gender === roomGenderFilter);
      });
    }

    result = result.filter(h => {
      const minPrice = hostelPrices(h.id);
      return minPrice >= priceRange[0] && (minPrice <= priceRange[1] || minPrice === 0);
    });

    if (selectedFacilities.length > 0) {
      result = result.filter(h => selectedFacilities.every(f => h.facilities.includes(f)));
    }

    if (minRating > 0) {
      result = result.filter(h => h.rating >= minRating);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'price-low': return hostelPrices(a.id) - hostelPrices(b.id);
        case 'price-high': return hostelPrices(b.id) - hostelPrices(a.id);
        case 'distance': return parseFloat(a.distanceFromCampus) - parseFloat(b.distanceFromCampus);
        default: return 0;
      }
    });

    return result;
  }, [filteredHostels, filteredRooms, selectedUniversity, search, priceRange, selectedFacilities, minRating, sortBy]);

  const currentUni = universities.find(u => u.id === selectedUniversity);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Hostels near {currentUni?.name}</h1>
          <p className="text-gray-500 text-sm mb-5">{filtered.length} verified hostels available</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search hostels by name or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>
            <select
              aria-label="Select university"
              value={selectedUniversity}
              onChange={e => setSelectedUniversity(e.target.value)}
              className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium appearance-none cursor-pointer min-w-[200px]"
            >
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name.split(' ').slice(0, 4).join(' ')}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Grid</button>
                <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Map</button>
              </div>
              <select aria-label="Sort hostels" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium appearance-none cursor-pointer">
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="distance">Nearest First</option>
              </select>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-amber-300'}`}>
                <SlidersHorizontal className="w-4 h-4" /> Filters
                {selectedFacilities.length > 0 && <span className="bg-amber-200 text-amber-800 text-xs rounded-full px-1.5">{selectedFacilities.length}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Range (GH₵ per semester)</h3>
                <div className="flex items-center gap-3">
                  <input type="number" value={priceRange[0]} onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])} placeholder="Min" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                  <span className="text-gray-400">—</span>
                  <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} placeholder="Max" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Room Gender</h3>
                <select aria-label="Filter by room gender" value={roomGenderFilter} onChange={e => setRoomGenderFilter(e.target.value as 'any' | 'male' | 'female')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none">
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {user?.gender && user.role === 'student' && roomGenderFilter === user.gender && (
                  <p className="text-xs text-gray-500 mt-2">Filtering rooms for your gender: {user.gender}.</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Minimum Rating</h3>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5].map(r => (
                    <button key={r} onClick={() => setMinRating(r)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${minRating === r ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {r === 0 ? 'Any' : <><Star className="w-3 h-3 fill-current" /> {r}+</>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {allFacilities.map(f => (
                    <button key={f} onClick={() => setSelectedFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedFacilities.includes(f) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {(selectedFacilities.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 5000) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Active filters:</span>
                  {selectedFacilities.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
                      {f} <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedFacilities(prev => prev.filter(x => x !== f))} />
                    </span>
                  ))}
                  <button onClick={() => { setSelectedFacilities([]); setMinRating(0); setPriceRange([0, 5000]); setRoomGenderFilter('any'); }} className="text-xs text-red-500 hover:text-red-600 ml-2 font-medium">Clear all</button>
                </div>
              </div>
            )}
            
            {/* Show Results Button */}
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowFilters(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                Show {filtered.length} Hostels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No hostels found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or searching for a different university.</p>
            <button onClick={() => { setSearch(''); setSelectedFacilities([]); setMinRating(0); setPriceRange([0, 5000]); }} className="text-amber-600 font-semibold hover:text-amber-700">Clear all filters</button>
          </div>
        ) : viewMode === 'map' ? (
          <div className="h-[calc(100vh-250px)] min-h-[500px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative">
            <Map
              ref={mapRef}
              initialViewState={{
                longitude: filtered.length > 0 && filtered[0].lng ? filtered[0].lng : -0.1870,
                latitude: filtered.length > 0 && filtered[0].lat ? filtered[0].lat : 5.6037,
                zoom: 14,
                pitch: 60,
                bearing: -17.6
              }}
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
              
              {filtered.filter(h => h.lat && h.lng).map(hostel => (
                <Marker
                  key={hostel.id}
                  longitude={hostel.lng as number}
                  latitude={hostel.lat as number}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(hostel);
                    mapRef.current?.flyTo({ center: [hostel.lng, hostel.lat], zoom: 17, pitch: 65, duration: 2000 });
                  }}
                >
                  <div className="group cursor-pointer">
                    <div className="bg-white border-2 border-amber-500 text-amber-600 font-bold px-2 py-1 rounded-full shadow-lg text-xs whitespace-nowrap group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      GH₵ {parseInt(hostel.priceRange.split('-')[0].replace(/\D/g,''))}
                    </div>
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-amber-500 mx-auto group-hover:border-t-amber-600"></div>
                  </div>
                </Marker>
              ))}

              {popupInfo && (
                <Popup
                  anchor="top"
                  longitude={popupInfo.lng as number}
                  latitude={popupInfo.lat as number}
                  onClose={() => setPopupInfo(null)}
                  className="z-50"
                  closeButton={false}
                  maxWidth="260px"
                >
                  <div className="p-0 rounded-2xl overflow-hidden shadow-2xl min-w-[240px]">
                    <div className="relative h-32">
                      <img src={popupInfo.mainImage} alt={popupInfo.name} className="w-full h-full object-cover" />
                      <button onClick={() => setPopupInfo(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-3 bg-white">
                      <h3 className="font-bold text-gray-900 text-base">{popupInfo.name}</h3>
                      <p className="text-amber-600 font-bold text-sm mb-2">{popupInfo.priceRange} / sem</p>
                      <Link to={`/hostels/${popupInfo.id}`} className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(hostel => {
              const hostelRooms = filteredRooms.filter(r => r.hostelId === hostel.id);
              const availableRooms = hostelRooms.filter(r => r.available).length;
              const isSaved = savedHostels.includes(hostel.id);
              return (
                <div key={hostel.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-52 overflow-hidden">
                    <Link to={`/hostels/${hostel.id}`}>
                      <img src={hostel.mainImage} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </Link>
                    {hostel.verified && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {isAuthenticated && (
                        <button aria-label={isSaved ? 'Remove from saved hostels' : 'Save hostel'} onClick={() => toggleSaveHostel(hostel.id)} className={`p-2 rounded-full shadow-lg transition-colors ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'}`}>
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-gray-800">{hostel.rating}</span>
                      <span className="text-xs text-gray-500">({hostel.reviewCount})</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <Link to={`/hostels/${hostel.id}`}>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 hover:text-amber-600 transition-colors">{hostel.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {hostel.address}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {hostel.facilities.slice(0, 4).map(f => (
                        <span key={f} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">{f}</span>
                      ))}
                      {hostel.facilities.length > 4 && (
                        <span className="bg-amber-50 text-amber-600 text-xs px-2 py-1 rounded-md font-medium">+{hostel.facilities.length - 4}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-amber-600 font-bold">{hostel.priceRange}</span>
                        <span className="text-xs text-gray-400 block">per semester</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold ${availableRooms > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {availableRooms > 0 ? `${availableRooms} rooms available` : 'Fully booked'}
                        </span>
                      </div>
                    </div>
                    <Link to={`/hostels/${hostel.id}`} className="mt-4 block w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
