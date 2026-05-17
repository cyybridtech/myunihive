import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Hexagon, User, Phone, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUniversities, requestOtp } from '../api/api.js';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', countryCode: '+233', password: '', confirmPassword: '', universityId: '', gender: '' });
  // idPhotoFile removed
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [dbUniversities, setDbUniversities] = useState<any[]>([]);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    const fetchUnis = async () => {
      try {
        const res = await getUniversities();
        if (res.universities && res.universities.length > 0) {
          setDbUniversities(res.universities);
          // No auto-select - user must choose
        
        }
      } catch (err) {
        console.error("Failed to fetch universities", err);
      }
    };
    fetchUnis();
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.universityId || !formData.gender) {
      setError('Please fill all fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms');
      return;
    }
    
    setOtpLoading(true);
    try {
      const res = await requestOtp(formData.email, formData.firstName + ' ' + formData.lastName);
      // Always redirect to OTP step - email may succeed or fail
      // If email failed and SMTP_AUTH_TEST is enabled, show OTP in console
      if (res.status === 'error' && res.debug_info) {
        console.warn('[DEV] Email failed. OTP code:', res.debug_info);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    setOtpLoading(true);
    try {
      const fullPhone = formData.countryCode + formData.phone.replace(/^0+/, '');
      await register(formData.firstName, formData.lastName, formData.firstName + ' ' + formData.lastName, formData.email, fullPhone, formData.universityId, formData.password, formData.gender, otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-amber-500 p-2 rounded-xl"><Hexagon className="w-7 h-7 text-white" /></div>
            <span className="text-2xl font-bold text-gray-900">Uni<span className="text-amber-500">Hive</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Join thousands of students finding verified hostels</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

          {step === 'form' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="John" required className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Surname *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="Mensah" required className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                  </div>
                </div>
              </div>


              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="you@student.edu.gh" required className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
                <div className="flex bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 overflow-hidden">
                  <div className="relative flex items-center border-r border-gray-200 bg-gray-100/50">
                    <select
                      value={formData.countryCode}
                      onChange={e => updateField('countryCode', e.target.value)}
                      className="pl-3 pr-8 py-3 bg-transparent text-sm focus:outline-none appearance-none font-medium text-gray-700 cursor-pointer"
                    >
                      <option value="+233">🇬🇭 +233</option>
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+228">🇹🇬 +228</option>
                      <option value="+225">🇨🇮 +225</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <div className="absolute right-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} placeholder="24 123 4567" required className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">University *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select id="registerUniversity" value={formData.universityId} onChange={e => updateField('universityId', e.target.value)} required aria-label="Select your university" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm appearance-none cursor-pointer">
                    <option value="">Select your university</option>
                    {dbUniversities.length === 0 ? (
                      <option value="">Loading...</option>
                    ) : (
                      dbUniversities.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Gender *</label>
                <div className="relative">
                  <select id="registerGender" value={formData.gender} onChange={e => updateField('gender', e.target.value)} required aria-label="Select your gender" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm appearance-none cursor-pointer">
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={e => updateField('password', e.target.value)} placeholder="Min. 6 characters" required className="w-full pl-10 pr-12 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="Re-enter your password" required className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 rounded border-gray-300 text-amber-500 focus:ring-amber-400" />
                <span className="text-xs text-gray-500">I agree to UniHive&apos;s <a href="/terms" className="text-amber-600 font-medium">Terms of Service &amp; Privacy Policy</a>. I understand this agreement is required to create my account and use UniHive.</span>
              </label>

              <button type="submit" disabled={otpLoading} className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-amber-500/30">
                {otpLoading ? 'Sending Code...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-6">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Verify your email</h3>
                <p className="text-sm text-gray-500 mt-2">
                  We've sent a 6-digit code to <br/>
                  <span className="font-semibold text-gray-700">{formData.email}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block text-center">Enter Verification Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="------" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center text-2xl tracking-[0.5em] font-mono" maxLength={6} />
              </div>
              
              <button type="submit" disabled={otpLoading} className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-amber-500/30 mt-4">
                {otpLoading ? 'Verifying...' : 'Complete Registration'}
              </button>
              
              <button type="button" onClick={() => setStep('form')} className="w-full py-2 mt-4 text-gray-500 hover:text-amber-600 text-sm font-medium transition-colors">
                Back to form
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

