import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Hexagon, CheckCircle2, ArrowRight, Sparkles, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { requestOtp } from '../api/api.js';
import { updateMetaTags } from '../utils/seo';

export default function LoginPage() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState<string>(() => {
    return localStorage.getItem('unihive_saved_email') || '';
  });
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return !!localStorage.getItem('unihive_saved_email');
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // OTP State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    updateMetaTags({
      title: "Sign In to Your Account | UNIHIVE Ghana",
      description: "Sign in to your UNIHIVE account to search and book verified student hostels near UG, KNUST, UCC, and other major Ghanaian universities.",
    });
  }, []);

  useEffect(() => {
    if (auth.user) {
      const targetRoute = auth.user.role === 'admin'
        ? '/admin'
        : auth.user.role === 'manager' || auth.user.role === 'hostel_manager'
          ? '/manager'
          : '/dashboard';
      navigate(targetRoute, { replace: true });
    }
  }, [auth.user, navigate]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (rememberMe) {
        localStorage.setItem('unihive_saved_email', email.trim());
      } else {
        localStorage.removeItem('unihive_saved_email');
      }

      const user = await auth.login(email.trim(), password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager' || user.role === 'hostel_manager') navigate('/manager');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to receive a login code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await requestOtp(email.trim(), 'UniHive Student', 'login');
      if (res && res.otp_code) {
        setDevOtpCode(res.otp_code);
      }
      setOtpStep('verify');
      setResendTimer(60);
      setSuccessMessage(`We sent a 6-digit verification code to your email (${email})`);
    } catch (err: any) {
      setError(err.message || 'Failed to send login code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted) {
        const newOtp = [...otpValues];
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasted[i] || '';
        }
        setOtpValues(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (rememberMe) {
        localStorage.setItem('unihive_saved_email', email.trim());
      }

      const user = await auth.login(email.trim(), undefined, fullOtp);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager' || user.role === 'hostel_manager') navigate('/manager');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Showcase Banner - Desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-950 overflow-hidden text-white flex-col justify-between p-12 lg:p-16">
        {/* Background Image with Dark Vignette */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
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
          <div className="mt-8 max-w-md">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Ghana&apos;s #1 Student Housing Network
            </span>
            <h2 className="text-4xl font-extrabold leading-tight text-white">
              Student Living, <br />
              <span className="text-amber-400">Verified &amp; Simplified.</span>
            </h2>
            <p className="mt-3 text-base text-gray-300 leading-relaxed">
              Find and book 100% physically vetted hostels across University of Ghana, KNUST, UCC, and all major Ghanaian campuses.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-4 my-8">
          {[
            { title: 'Zero Landlord Scams', desc: 'Every hostel is physically inspected and verified with real photos and transparent pricing.' },
            { title: 'Fast Mobile Money Booking', desc: 'Secure reservations backed by Paystack, MTN MoMo, and Telecel Cash with instant receipts.' },
            { title: 'Direct Campus Proximity', desc: 'Verified GPS walking distances directly from hostel gates to lecture halls.' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3.5 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform Security Guarantee */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
          <p className="text-xs text-gray-300">
            100% verified campus listings. Direct reservations and scam-free student housing across Ghana.
          </p>
        </div>
      </div>

      {/* Right Side: Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="max-w-md w-full">
          {/* Mobile Logo Header */}
          <div className="lg:hidden text-center mb-8">
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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your UniHive account to continue</p>
          </div>

          {/* Auth Method Toggle (Password vs One-Time Code) */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setError(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'password'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Lock className="w-4 h-4" /> Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setError(''); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'otp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Sign in with Code (OTP)
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 mb-5 flex items-start gap-3">
              <span className="shrink-0 text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-2xl p-4 mb-5 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode 1: Password Login */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@student.edu.gh"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Remember email</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: Passwordless One-Time Code (OTP) */}
          {authMode === 'otp' && (
            <div>
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@student.edu.gh"
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      We will email you a secure 6-digit verification code. No password required.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Login Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpLogin} className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 mb-0.5">Code sent to your Email</p>
                      <p className="text-amber-800 leading-relaxed">
                        We sent your 6-digit code to <strong>{email}</strong>. Please check your inbox or spam folder (codes are delivered to email, not SMS/phone).
                      </p>
                    </div>
                  </div>


                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpStep('request'); setOtpValues(['', '', '', '', '', '']); setError(''); }}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                      >
                        Change Email
                      </button>
                    </div>

                    <div className="flex justify-between gap-2">
                      {otpValues.map((val, idx) => (
                        <input
                          key={idx}
                          ref={el => { inputRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-bold rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm"
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
                        onClick={handleSendOtp}
                        className="font-bold text-amber-600 hover:text-amber-700 underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              New to UniHive?{' '}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-bold ml-1">
                Create an Account
              </Link>
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Link to="/" className="text-xs font-medium text-gray-400 hover:text-gray-600">
                ← Back to Homepage
              </Link>
              <span className="text-gray-300">•</span>
              <Link to="/terms" className="text-xs font-medium text-gray-400 hover:text-amber-600 transition-colors">
                Terms of Service &amp; Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}