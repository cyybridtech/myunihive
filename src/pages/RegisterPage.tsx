import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Hexagon, User, Phone, GraduationCap, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Check, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUniversities, requestOtp } from '../api/api.js';
import { updateMetaTags } from '../utils/seo';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+233',
    password: '',
    confirmPassword: '',
    universityId: '',
    gender: 'male',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [dbUniversities, setDbUniversities] = useState<any[]>([]);
  const [uniSearch, setUniSearch] = useState('');
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // OTP Step State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    updateMetaTags({
      title: "Create a Verified Student Account | UNIHIVE Ghana",
      description: "Create your student account on UNIHIVE to find and book secure, vetted student hostels near Legon, KNUST, UCC, and more. Simple booking, guaranteed security.",
    });
  }, []);

  useEffect(() => {
    const fetchUnis = async () => {
      try {
        const res = await getUniversities();
        if (res.universities && res.universities.length > 0) {
          setDbUniversities(res.universities);
        }
      } catch (err) {
        console.error("Failed to fetch universities", err);
      }
    };
    fetchUnis();
  }, []);

  // Close university dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target as Node)) {
        setUniDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Filtered universities
  const filteredUniversities = useMemo(() => {
    if (!uniSearch.trim()) return dbUniversities;
    const q = uniSearch.toLowerCase();
    return dbUniversities.filter(u => u.name.toLowerCase().includes(q) || (u.city && u.city.toLowerCase().includes(q)));
  }, [dbUniversities, uniSearch]);

  const selectedUniName = useMemo(() => {
    const found = dbUniversities.find(u => u.id === formData.universityId);
    return found ? found.name : '';
  }, [dbUniversities, formData.universityId]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: '', color: 'bg-gray-200', textCol: 'text-gray-400' };
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-red-500', textCol: 'text-red-500' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500', textCol: 'text-amber-500' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500', textCol: 'text-blue-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-500', textCol: 'text-green-600' };
  }, [formData.password]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlePhoneChange = (val: string) => {
    // Strip non-digits
    let cleaned = val.replace(/\D/g, '');
    // If student types leading 0 with +233, strip it
    if (formData.countryCode === '+233' && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    updateField('phone', cleaned);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password || !formData.universityId || !formData.gender) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms of Service & Privacy Policy');
      return;
    }

    setOtpLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const res = await requestOtp(formData.email.trim(), fullName, 'register');
      if (res && res.otp_code) {
        setDevOtpCode(res.otp_code);
      }
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newOtp = [...otpValues];
        for (let i = 0; i < 6; i++) newOtp[i] = pasted[i] || '';
        setOtpValues(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const fullPhone = formData.countryCode + formData.phone.replace(/^0+/, '');
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await register(
        formData.firstName.trim(),
        formData.lastName.trim(),
        fullName,
        formData.email.trim(),
        fullPhone,
        formData.universityId,
        formData.password,
        formData.gender,
        fullOtp
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. The code may be incorrect or expired.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Showcase Banner - Desktop only */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-gray-950 overflow-hidden text-white flex-col justify-between p-12 lg:p-14">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/75 to-transparent" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20">
              <Hexagon className="w-8 h-8 text-white fill-white/10" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight">
              Uni<span className="text-amber-400">Hive</span>
            </span>
          </Link>
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Join Ghana&apos;s Trusted Student Network
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-white">
              Your Campus Home, <br />
              <span className="text-amber-400">Guaranteed &amp; Secure.</span>
            </h2>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-sm">
              Create your verified student account to browse genuine hostels, book rooms with zero agent fee exploitation, and connect with campus roommates.
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="relative z-10 space-y-3.5 my-8">
          {[
            { title: 'Physically Verified Hostels', desc: 'Every listing has verified GPS coordinates, real photos, and direct manager contacts.' },
            { title: 'Direct WhatsApp Inquiries', desc: 'Message hostel managers directly to ask questions or schedule a visit.' },
            { title: 'Verified Student Reviews', desc: 'Real reviews and ratings from student residents who actually lived there.' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Guarantee */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
          <p className="text-xs text-gray-300">
            Backed by secure verification. We protect students against fraudulent landlords and fake listings across Ghana.
          </p>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="max-w-lg w-full py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="bg-amber-500 p-2 rounded-xl shadow-md">
                <Hexagon className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Uni<span className="text-amber-500">Hive</span>
              </span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">Join thousands of students finding verified hostels across Ghana</p>
          </div>

          {/* Feedback error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 mb-5 flex items-start gap-3">
              <span className="shrink-0 text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={e => updateField('firstName', e.target.value)}
                      placeholder="e.g. Kwame"
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Surname *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={e => updateField('lastName', e.target.value)}
                      placeholder="e.g. Mensah"
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="you@student.edu.gh or personal email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Phone & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Phone Number *
                  </label>
                  <div className="flex bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-amber-500 overflow-hidden shadow-sm">
                    <div className="flex items-center px-2.5 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-700 shrink-0">
                      🇬🇭 +233
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      placeholder="24 123 4567"
                      required
                      className="w-full px-3 py-3 bg-transparent focus:outline-none text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Used for MoMo payments & manager contact. Codes go to Email.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => updateField('gender', e.target.value)}
                    required
                    className="w-full px-3 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Searchable University Picker */}
              <div className="relative" ref={uniDropdownRef}>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Your University / Campus *
                </label>
                <div
                  onClick={() => setUniDropdownOpen(prev => !prev)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm cursor-pointer flex items-center justify-between"
                >
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <span className={formData.universityId ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {selectedUniName || 'Select your Ghanaian university'}
                  </span>
                  <span className="text-xs text-amber-600 font-bold">Choose</span>
                </div>

                {uniDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl p-2.5 max-h-60 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={uniSearch}
                        onChange={e => setUniSearch(e.target.value)}
                        placeholder="Search UG, KNUST, UCC, UPSA..."
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs border border-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredUniversities.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2 text-center">No matching university found</p>
                      ) : (
                        filteredUniversities.map((u: any) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              updateField('universityId', u.id);
                              setUniDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              formData.universityId === u.id ? 'bg-amber-500 text-white font-bold' : 'hover:bg-amber-50 text-gray-800'
                            }`}
                          >
                            <span>{u.name}</span>
                            {u.city && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${formData.universityId === u.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {u.city}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => updateField('password', e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => updateField('confirmPassword', e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Live Password Strength Meter */}
              {formData.password && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Security strength:</span>
                    <span className={`font-bold ${passwordStrength.textCol}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Agreement */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  I agree to UniHive&apos;s{' '}
                  <Link to="/terms" className="text-amber-600 hover:text-amber-700 font-semibold underline">
                    Terms of Service &amp; Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending Verification Code...
                  </>
                ) : (
                  <>
                    Create Student Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Interactive 6-box OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">Check Your Email</h3>
                <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">
                  We sent a 6-digit confirmation code to <br />
                  <span className="font-bold text-gray-800">{formData.email}</span>
                </p>
              </div>

              {/* Email Delivery Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5 text-left">
                <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 mb-0.5">Code sent to Email (Not phone SMS)</p>
                  <p className="text-amber-800 leading-relaxed">
                    Check your <strong>Email Inbox</strong> or <strong>Spam/Junk folder</strong> for the 6-digit code. Verification codes are delivered to your email address, not by phone text message.
                  </p>
                </div>
              </div>

              {devOtpCode && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-left">
                  <div className="flex items-center gap-2 text-xs text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Testing Code: <strong className="font-mono text-sm tracking-widest text-emerald-900">{devOtpCode}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtpCode.split('');
                      setOtpValues(digits);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={el => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-extrabold rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Didn&apos;t receive it?</span>
                {resendTimer > 0 ? (
                  <span className="font-semibold text-gray-400">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Account...
                  </>
                ) : (
                  <>
                    Complete Registration <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Details
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:text-amber-700 font-bold ml-1">
                Sign In
              </Link>
            </p>
            <Link to="/" className="inline-block mt-3 text-xs font-medium text-gray-400 hover:text-gray-600">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


