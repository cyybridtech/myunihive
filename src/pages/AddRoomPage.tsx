import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { createRoom, uploadImage } from '../api/api.js';
import { DoorOpen, Plus, X, UploadCloud, Users, DollarSign, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function AddRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hostels, refreshData } = useApp();

  const isManager = user?.role === 'manager' || user?.role === 'hostel_manager';
  const managerHostels = isManager ? hostels.filter(h => String(h.managerId) === String(user?.id)) : hostels;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    hostelId: managerHostels.length > 0 ? managerHostels[0].id : '',
    roomNumber: '',
    capacity: '1',
    price: '',
    type: 'Standard',
    gender: 'unisex' as 'male' | 'female' | 'unisex',
    description: ''
  });

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

      // Upload sequentially or parallel
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
    if (!formData.hostelId || !formData.roomNumber || !formData.price) {
      return alert('Hostel, Room Number, and Price are required.');
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

      const response: any = await createRoom({
        hostel_id: formData.hostelId,
        room_number: formData.roomNumber,
        capacity: Number(formData.capacity),
        price: Number(formData.price),
        gender: formData.gender,
        type: formData.type,
        description: formData.description,
        image: main_image,
        gallery: galleryData
      });

      if (response.status === 'success') {
        alert('Room added successfully!');
        refreshData();
        navigate(-1);
      } else {
        alert(response.message || 'Could not add room.');
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
            <h1 className="text-3xl font-bold flex items-center gap-3"><DoorOpen className="w-8 h-8" /> Add New Room</h1>
            <p className="mt-2 text-amber-100">Showcase this room's features with descriptions and pictures.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Room Details</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Hostel *</label>
                  <select required value={formData.hostelId} onChange={e => setFormData({ ...formData, hostelId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    {managerHostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Room Number *</label>
                  <input required value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="101" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400"/> Semester Rent (GH₵) *</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="1500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity</label>
                    <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none">
                      <option value="unisex">Unisex</option>
                      <option value="male">Male Only</option>
                      <option value="female">Female Only</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Room Type</label>
                  <input value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="Standard, Ensuite, etc." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none" placeholder="e.g. Spacious room with balcony..." />
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-amber-500"/> Room Gallery</h2>
                <span className="text-sm text-gray-500">{gallery.length} / 5 images</span>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {gallery.map((img, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-200 relative group">
                    <button type="button" onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="w-4 h-4" /></button>
                    <div className="aspect-[4/3] w-full rounded-xl overflow-hidden mb-3 bg-gray-200 relative">
                      <img src={img.previewUrl} alt="Preview" className={`w-full h-full object-cover transition-opacity ${img.isUploading ? 'opacity-50' : 'opacity-100'}`} />
                      {img.isUploading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    <input type="text" value={img.desc} onChange={e => {
                      const newG = [...gallery];
                      newG[idx].desc = e.target.value;
                      setGallery(newG);
                    }} placeholder="Description (e.g. Study Desk, Balcony)" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                  </div>
                ))}

                {gallery.length < 5 && (
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
                {isSubmitting ? 'Saving...' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
