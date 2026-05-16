import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createHostel, uploadImage } from '../api/api.js';
import { Building2, Plus, X, UploadCloud, MapPin, DollarSign, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;


export default function AddHostelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { universities, addHostel, refreshData } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    universityId: universities.length > 0 ? universities[0].id : '',
    address: '',
    distance: '1.0km',
    priceRange: 'GH₵1000-2000',
    description: '',
    bankCode: '',
    accountNumber: '',
    managerFullName: '',
    managerEmail: '',
    managerPhone: '',
    managerPassword: '',
    managerGender: 'male',
    facilities: '',
    commissionType: 'split',
    platformFee: '',
    lat: '' as string | number,
    lng: '' as string | number
  });

  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handlePickLocation = useCallback((lat: number, lng: number) => {
    setMapLocation({ lat, lng });
    setFormData(prev => ({ ...prev, lat, lng }));
  }, []);

  const handleMapClick = useCallback((e: any) => {
    if (e.lngLat) {
      const { lng, lat } = e.lngLat;
      handlePickLocation(lat, lng);
    }
  }, [handlePickLocation]);


  const mapContainerStyle = useMemo(
    () => ({
      width: '100%',
      height: '320px',
      borderRadius: '14px'
    }),
    []
  );

  const defaultCenter = useMemo(() => ({ lat: 5.6037, lng: -0.1870 }), []);

  const coordinatesMissing = mapLocation == null || formData.lat === '' || formData.lng === '';


  const [gallery, setGallery] = useState<{ file?: File, previewUrl: string, desc: string, isUploading: boolean, uploadedUrl?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        desc: '',
        isUploading: true
      }));

      setGallery(prev => [...prev, ...newImages]);

      // Upload files sequentially or in parallel
      for (let i = 0; i < newImages.length; i++) {
        const item = newImages[i];
        try {
          const res = await uploadImage(item.file);
          if (res.status === 'success') {
            setGallery(prev => prev.map(g => g.previewUrl === item.previewUrl ? { ...g, uploadedUrl: res.url, isUploading: false } : g));
          } else {
            alert('Failed to upload image: ' + res.message);
            setGallery(prev => prev.filter(g => g.previewUrl !== item.previewUrl));
          }
        } catch (err) {
          alert('Network error while uploading');
          setGallery(prev => prev.filter(g => g.previewUrl !== item.previewUrl));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.universityId) {
      return alert('Name and University are required.');
    }

    if (coordinatesMissing) {
      return alert('Please select a location on the map to set Hostel coordinates (lat/lng).');
    }

    if (gallery.some(g => g.isUploading)) {
      return alert('Please wait for all images to finish uploading.');
    }

    setIsSubmitting(true);
    try {
      const galleryData = gallery.map(g => ({
        url: g.uploadedUrl || g.previewUrl,
        desc: g.desc
      }));

      const main_image = galleryData.length > 0 ? galleryData[0].url : undefined;

      const response: any = await createHostel({
        name: formData.name,
        university_id: formData.universityId,
        lat: formData.lat === '' ? undefined : Number(formData.lat),
        lng: formData.lng === '' ? undefined : Number(formData.lng),
        address: formData.address,
        description: formData.description,
        facilities: formData.facilities,
        distance_from_campus: formData.distance,
        price_range: formData.priceRange,
        main_image,
        gallery: galleryData,
        bank_code: formData.bankCode,
        account_number: formData.accountNumber,
        manager_full_name: formData.managerFullName,
        manager_email: formData.managerEmail,
        manager_phone: formData.managerPhone,
        manager_password: formData.managerPassword,
        manager_gender: formData.managerGender,
        commission_type: formData.commissionType,
        platform_fee: formData.commissionType === 'flat' ? parseFloat(formData.platformFee) || 0 : 0
      });

      if (response.status === 'success') {
        alert('Hostel created successfully!');
        refreshData();
        navigate(-1);
      } else {
        alert(response.message || 'Could not create hostel.');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-amber-500 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="w-8 h-8" /> Add New Hostel</h1>
            <p className="mt-2 text-amber-100">Provide details and upload a beautiful gallery for the students.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

              {/* Location Picker */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hostel Location (lat/lng)</h3>
                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                  {MAPBOX_TOKEN ? (
                    <Map
                      initialViewState={{
                        longitude: mapLocation?.lng || defaultCenter.lng,
                        latitude: mapLocation?.lat || defaultCenter.lat,
                        zoom: 13
                      }}
                      style={mapContainerStyle}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      onClick={handleMapClick}
                      cursor="pointer"
                    >
                      {mapLocation && (
                        <Marker longitude={mapLocation.lng} latitude={mapLocation.lat} anchor="bottom">
                          <MapPin className="w-8 h-8 text-amber-500 fill-amber-500 shadow-md rounded-full" />
                        </Marker>
                      )}
                    </Map>
                  ) : (
                    <div style={mapContainerStyle} className="bg-gray-100 flex items-center justify-center p-6 text-center">
                      <p className="text-gray-500 font-medium">Map cannot load: VITE_MAPBOX_TOKEN is missing in the environment variables.</p>
                    </div>
                  )}
                </div>


                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                    <input
                      value={formData.lat}
                      readOnly
                      placeholder="Click on map"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                    <input
                      value={formData.lng}
                      readOnly
                      placeholder="Click on map"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {!coordinatesMissing && (
                  <p className="text-xs text-green-700 mt-2">Coordinates selected successfully.</p>
                )}
                {coordinatesMissing && (
                  <p className="text-xs text-gray-500 mt-2">Click on the map to set Hostel coordinates.</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hostel Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. Prestige Elite" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">University *</label>
                  <select required value={formData.universityId} onChange={e => setFormData({ ...formData, universityId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400"/> Address</label>
                  <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="123 Campus Road" />
                </div>


                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400"/> Price Range</label>
                  <input value={formData.priceRange} onChange={e => setFormData({ ...formData, priceRange: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="GH₵1000 - GH₵2000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">Distance from Campus</label>
                  <input value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. 1.5km" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Facilities (comma-separated)</label>
                  <input value={formData.facilities} onChange={e => setFormData({ ...formData, facilities: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="WiFi, Security, Generator" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none" placeholder="Describe the hostel facilities and vibe..." />
                </div>
              </div>
            </div>

            {/* Hostel Manager Credentials */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hostel Manager Credentials</h2>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Name</label>
                  <input type="text" value={formData.managerFullName} onChange={e => setFormData({ ...formData, managerFullName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Hostel Manager Full Name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Email</label>
                  <input type="email" value={formData.managerEmail} onChange={e => setFormData({ ...formData, managerEmail: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="manager@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Phone</label>
                  <input type="tel" value={formData.managerPhone} onChange={e => setFormData({ ...formData, managerPhone: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="+233 24 123 4567" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Password</label>
                  <input type="password" value={formData.managerPassword} onChange={e => setFormData({ ...formData, managerPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Create a password" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager Gender</label>
                  <select value={formData.managerGender} onChange={e => setFormData({ ...formData, managerGender: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payout Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payout Details & Paystack Subaccount</h2>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Bank Name / MoMo</label>
                  <select value={formData.bankCode} onChange={e => setFormData({ ...formData, bankCode: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    <option value="">Select Option</option>
                    <optgroup label="Mobile Money">
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="VOD">Vodafone Cash</option>
                      <option value="TGO">AirtelTigo</option>
                    </optgroup>
                    <optgroup label="Traditional Banks">
                      <option value="014">Ecobank Ghana</option>
                      <option value="044">Access Bank</option>
                      <option value="053">Zenith Bank</option>
                      <option value="090115">Fidelity Bank</option>
                      <option value="114">GCB Bank</option>
                      <option value="039">Stanbic Bank</option>
                      <option value="068">Standard Chartered Bank</option>
                      <option value="010">Absa Bank Ghana</option>
                      <option value="CBG">Consolidated Bank Ghana</option>
                      <option value="058">GTBank Ghana</option>
                      <option value="033">United Bank for Africa (UBA)</option>
                      <option value="028">Republic Bank</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                  <input type="text" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="0540000000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Structure</label>
                  <select value={formData.commissionType} onChange={e => setFormData({ ...formData, commissionType: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    <option value="split">Percentage Split (Platform takes 5%)</option>
                    <option value="flat">Flat Platform Fee (Added to Room Price)</option>
                  </select>
                </div>
                {formData.commissionType === 'flat' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Platform Fee Amount (GH₵)</label>
                    <input type="number" value={formData.platformFee} onChange={e => setFormData({ ...formData, platformFee: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="e.g. 300" />
                  </div>
                )}
              </div>
            </div>

            {/* Gallery Upload */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-amber-500"/> Image Gallery</h2>
                <span className="text-sm text-gray-500">{gallery.length} / 9 images</span>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {gallery.map((img, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-200 relative group">
                    <button type="button" onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="w-4 h-4" /></button>
                    <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-gray-200 relative">
                      <img src={img.previewUrl} alt="Preview" className={`w-full h-full object-cover transition-opacity ${img.isUploading ? 'opacity-50' : 'opacity-100'}`} />
                      {img.isUploading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    <input type="text" value={img.desc} onChange={e => {
                      const newG = [...gallery];
                      newG[idx].desc = e.target.value;
                      setGallery(newG);
                    }} placeholder="Description (e.g. Gym, Parking)" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                  </div>
                ))}

                {gallery.length < 9 && (
                  <div onClick={() => fileInputRef.current?.click()} className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-300 hover:border-amber-400 bg-gray-50 hover:bg-amber-50 cursor-pointer flex flex-col items-center justify-center text-gray-500 transition-colors">
                    <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                    <span className="text-sm font-semibold">Upload Image</span>
                    <span className="text-xs text-gray-400 mt-1">Up to 15MB</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting || gallery.some(g => g.isUploading)} className="px-8 py-3 rounded-xl bg-amber-500 font-bold text-white hover:bg-amber-600 disabled:opacity-60 shadow-lg shadow-amber-500/30">
                {isSubmitting ? 'Saving...' : 'Publish Hostel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
