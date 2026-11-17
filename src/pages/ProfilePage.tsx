import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { updateUserProfile, changeUserPassword, uploadImage } from '../api/api.js';
import { User, Lock, Phone, GraduationCap, Shield, CheckCircle, AlertCircle, Save, KeyRound, ArrowLeft, Camera, CreditCard, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { universities } = useApp();
  const navigate = useNavigate();

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<'male' | 'female'>((user?.gender as 'male' | 'female') || 'male');
  const [universityId, setUniversityId] = useState(user?.university_id || '');
  const [idType, setIdType] = useState<'ghana_card' | 'passport'>(
    user?.id_type || (user?.passport_number ? 'passport' : 'ghana_card')
  );
  const [ghanaCard, setGhanaCard] = useState(user?.ghana_card_number || '');
  const [passportNumber, setPassportNumber] = useState(user?.passport_number || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Status message states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      if (user.gender === 'male' || user.gender === 'female') {
        setGender(user.gender);
      }
      setUniversityId(user.university_id || '');
      setGhanaCard(user.ghana_card_number || '');
      setPassportNumber(user.passport_number || '');
      if (user.id_type) setIdType(user.id_type);
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const formatGhanaCard = (input: string): string => {
    let raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!raw) return '';

    if (raw.startsWith('GHA')) {
      raw = raw.slice(3);
    } else if (raw.startsWith('GH')) {
      raw = raw.slice(2);
    } else if (raw.startsWith('G')) {
      raw = raw.slice(1);
    }

    const digits = raw.replace(/[^0-9]/g, '').slice(0, 10);
    if (!digits) return 'GHA-';

    if (digits.length <= 9) {
      return `GHA-${digits}`;
    }
    return `GHA-${digits.slice(0, 9)}-${digits.slice(9, 10)}`;
  };

  const formatPassport = (input: string): string => {
    const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return '';
    const firstLetter = clean.charAt(0).replace(/[^A-Z]/g, 'G');
    const digits = clean.slice(1).replace(/\D/g, '').slice(0, 8);
    return `${firstLetter}${digits}`;
  };

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassportNumber(formatPassport(e.target.value));
  };

  const handleGhanaCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val || val === 'GHA' || val === 'GHA-') {
      setGhanaCard('');
      return;
    }
    setGhanaCard(formatGhanaCard(val));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileLoading(true);

    try {
      let finalAvatarUrl = avatar;

      if (avatarFile) {
        const uploadRes = await uploadImage(avatarFile);
        if (uploadRes.status === 'success' && uploadRes.url) {
          finalAvatarUrl = uploadRes.url;
        }
      }

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender,
        university_id: universityId,
        id_type: idType,
        ghana_card_number: ghanaCard.trim(),
        passport_number: passportNumber.trim(),
        avatar: finalAvatarUrl,
      };

      const response = await updateUserProfile(payload);

      if (response.status === 'success') {
        updateUser({
          full_name: payload.full_name,
          phone: payload.phone,
          gender: payload.gender,
          university_id: payload.university_id,
          id_type: payload.id_type,
          ghana_card_number: payload.ghana_card_number,
          passport_number: payload.passport_number,
          avatar: payload.avatar,
        });
        setProfileSuccess('Profile updated successfully! Closing...');
        setTimeout(() => {
          navigate(-1);
        }, 1200);
      } else {
        setProfileError(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Network error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.status === 'success') {
        setPasswordSuccess('Password updated successfully! Keep it safe.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(response.message || 'Failed to update password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Network error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Platform Administrator';
      case 'manager':
      case 'hostel_manager': return 'Hostel Manager';
      default: return 'Student Resident';
    }
  };

  const userUni = universities.find(u => u.id === (universityId || user?.university_id));

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top bar back button */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-xs font-medium text-gray-400">Account Settings</span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar with upload overlay */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-500 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-lg overflow-hidden border-2 border-amber-400/30">
                {avatar && (avatar.startsWith('http') || avatar.startsWith('blob:')) ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs font-semibold gap-1"
              >
                <Camera className="w-5 h-5" />
                <span>Change</span>
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user?.full_name || 'My Profile'}</h1>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
                  {roleLabel(user?.role)}
                </span>
                {user?.verified ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified ID
                  </span>
                ) : null}
              </div>

              <p className="text-gray-300 text-sm mb-4">{user?.email}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-gray-300">
                {userUni && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                    <GraduationCap className="w-4 h-4 text-amber-400" /> {userUni.name}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Phone className="w-4 h-4 text-amber-400" /> {user.phone}
                  </span>
                )}
                {user?.created_at && (
                  <span className="text-gray-400">
                    Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2 Columns: Edit Profile Info + Password & Security */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left / Main: Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
                  <p className="text-xs text-gray-500">Update your public name, contact phone, and student identifiers</p>
                </div>
              </div>

              {profileSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Samuel Mensah"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">Locked</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+233</span>
                      <input
                        type="tel"
                        value={phone.replace(/^\+?233/, '')}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="24 123 4567"
                        className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as 'male' | 'female')}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Affiliated University
                    </label>
                    <select
                      value={universityId}
                      onChange={e => setUniversityId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800 bg-white"
                    >
                      <option value="">-- Select University --</option>
                      {universities.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Official Identification Document
                      </label>
                      {user?.verified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Identity Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/verify-identity')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" /> Complete Face & ID Scan
                        </button>
                      )}
                    </div>

                    {/* ID Type Switcher */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIdType('ghana_card')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          idType === 'ghana_card'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Ghana Card (NIA)
                      </button>

                      <button
                        type="button"
                        onClick={() => setIdType('passport')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          idType === 'passport'
                            ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> Passport
                      </button>
                    </div>

                    {/* Document Input */}
                    {idType === 'ghana_card' ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-500">Ghana Card Number</span>
                          {ghanaCard && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              /^GHA-\d{9}-\d$/.test(ghanaCard) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {/^GHA-\d{9}-\d$/.test(ghanaCard) ? 'Valid NIA Format' : 'GHA-XXXXXXXXX-X'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={ghanaCard}
                            onChange={handleGhanaCardChange}
                            maxLength={15}
                            placeholder="GHA-123456789-0"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800 font-mono font-bold tracking-wider uppercase"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Hyphens and GHA- prefix format automatically as you type.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-500">Passport Number</span>
                          {passportNumber && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              /^[A-Z]\d{7,8}$/.test(passportNumber) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {/^[A-Z]\d{7,8}$/.test(passportNumber) ? 'Valid Passport Format' : 'e.g. G1234567'}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={passportNumber}
                            onChange={handlePassportChange}
                            maxLength={9}
                            placeholder="G1234567"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800 font-mono font-bold tracking-wider uppercase"
                          />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">1 capital letter followed by 7 or 8 digits (e.g. G1234567).</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {profileLoading ? 'Updating Profile...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Security & Password */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                  <p className="text-xs text-gray-500">Ensure your account stays secure</p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-800"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    {passwordLoading ? 'Updating password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" /> Account Security & Role
              </h3>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-400">Account Type</span>
                  <span className="font-semibold text-gray-800 capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-400">User ID</span>
                  <span className="font-mono text-gray-800">#{user?.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Ghana Card Status</span>
                  <span className={`font-semibold ${user?.ghana_card_number ? 'text-green-600' : 'text-amber-600'}`}>
                    {user?.ghana_card_number ? 'Linked' : 'Not Linked'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
