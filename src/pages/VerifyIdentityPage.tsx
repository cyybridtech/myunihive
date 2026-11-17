import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyIdentity } from '../api/api.js';
import {
  ShieldCheck,
  CheckCircle2,
  Camera,
  CameraOff,
  RefreshCw,
  ArrowRight,
  FileText,
  Sparkles,
  AlertCircle,
  Upload,
  Lock,
  ChevronRight
} from 'lucide-react';

export default function VerifyIdentityPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [idType, setIdType] = useState<'ghana_card' | 'passport'>('ghana_card');
  const [idNumber, setIdNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ============ ID FORMATTING & VALIDATION ============

  // Ghana Card Formatter: GHA-XXXXXXXXX-X
  const formatGhanaCard = (input: string) => {
    let clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('GHA')) {
      clean = clean.slice(3);
    }
    const digits = clean.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return 'GHA-';
    if (digits.length <= 9) return `GHA-${digits}`;
    return `GHA-${digits.slice(0, 9)}-${digits.slice(9, 10)}`;
  };

  // Passport Formatter: 1 capital letter + 7 or 8 digits (e.g. G1234567)
  const formatPassport = (input: string) => {
    const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return '';
    const firstLetter = clean.charAt(0).replace(/[^A-Z]/g, 'G');
    const remainingDigits = clean.slice(1).replace(/\D/g, '').slice(0, 8);
    return `${firstLetter}${remainingDigits}`;
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const val = e.target.value;
    if (idType === 'ghana_card') {
      setIdNumber(formatGhanaCard(val));
    } else {
      setIdNumber(formatPassport(val));
    }
  };

  const isGhanaCardValid = /^GHA-\d{9}-\d$/.test(idNumber);
  const isPassportValid = /^[A-Z]\d{7,8}$/.test(idNumber);
  const isIdValid = idType === 'ghana_card' ? isGhanaCardValid : isPassportValid;

  // Switch ID Type
  const handleTypeSelect = (type: 'ghana_card' | 'passport') => {
    if (type !== idType) {
      setIdType(type);
      setIdNumber(type === 'ghana_card' ? 'GHA-' : '');
      setError(null);
    }
  };

  // ============ CAMERA MANAGEMENT ============

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraActive(false);
      setCameraError('Camera access not available or blocked. You can upload a selfie photo below.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    // Initialize with Ghana Card default prefix
    if (!idNumber && idType === 'ghana_card') {
      setIdNumber('GHA-');
    }

    // Auto-start camera if no photo captured yet
    if (!capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, idType]);

  // Capture face snapshot from video feed
  const handleCaptureFace = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the image horizontally to match webcam mirror preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } catch (e: any) {
      setError('Failed to capture face photo: ' + e.message);
    } finally {
      setIsCapturing(false);
    }
  };

  // Fallback: handle direct file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (JPG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        stopCamera();
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // ============ SUBMISSION ============

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isIdValid) {
      setError(
        idType === 'ghana_card'
          ? 'Please enter a complete Ghana Card number (e.g. GHA-123456789-0)'
          : 'Please enter a valid Passport number (e.g. G1234567)'
      );
      return;
    }

    if (!capturedImage) {
      setError('Please complete the face scan to verify your identity.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await verifyIdentity({
        id_type: idType,
        id_number: idNumber.trim(),
        face_image: capturedImage
      });

      if (res && res.status === 'success') {
        setSuccess(true);
        if (res.user) {
          updateUser(res.user);
        }

        // Seamless auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(res?.message || 'Verification could not be processed');
      }
    } catch (err: any) {
      console.error('KYC Verification submission failed:', err);
      setError(err.message || 'Identity verification failed. Please check your document number.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-gray-50 to-orange-50/40 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Fast Track Student Verification
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Verify Your Student Identity
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            Protect campus safety and unlock verified student discounts, direct manager inquiries, and instant room reservations.
          </p>
        </div>

        {/* Success Card */}
        {success ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-green-200 shadow-xl shadow-green-500/5 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-2">
                Identity Verified
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                You&apos;re All Set, {user?.full_name || 'Student'}! 🎓
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                Your {idType === 'ghana_card' ? 'Ghana Card' : 'Passport'} and biometric face scan have been registered. Redirecting to your dashboard...
              </p>
            </div>
            <div className="pt-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                Go to Dashboard Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-amber-500/5 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Document Type Selector */}
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2.5">
                1. Select Official Document Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeSelect('ghana_card')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    idType === 'ghana_card'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 text-gray-900 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 text-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${idType === 'ghana_card' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Ghana Card</p>
                    <p className="text-[10px] text-gray-500">NIA National ID</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeSelect('passport')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    idType === 'passport'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20 text-gray-900 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 text-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${idType === 'passport' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Passport</p>
                    <p className="text-[10px] text-gray-500">Biometric Travel Doc</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Document Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                  2. {idType === 'ghana_card' ? 'Ghana Card (NIA) Number' : 'Passport Number'} *
                </label>
                {isIdValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Valid Format
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 font-medium">
                    {idType === 'ghana_card' ? 'Format: GHA-XXXXXXXXX-X' : 'Format: G1234567'}
                  </span>
                )}
              </div>

              <input
                type="text"
                value={idNumber}
                onChange={handleIdChange}
                placeholder={idType === 'ghana_card' ? 'GHA-123456789-0' : 'e.g. G1234567'}
                maxLength={idType === 'ghana_card' ? 15 : 9}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-500 outline-none text-sm font-mono tracking-wider transition-all uppercase"
              />
              <p className="text-[11px] text-gray-500 mt-1.5">
                {idType === 'ghana_card'
                  ? 'Hyphens are inserted automatically as you type numbers.'
                  : 'Enter your 8 or 9 character biometric passport number starting with a letter.'}
              </p>
            </div>

            {/* Biometric Face Scan Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                  3. Live Biometric Face Scan *
                </label>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" /> Encrypted &amp; Private
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-gray-950 aspect-[4/3] flex items-center justify-center border-2 border-dashed border-gray-300">
                {/* 1. Captured Photo Preview */}
                {capturedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={capturedImage}
                      alt="Captured Face"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Face Scan Ready
                        </span>
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retake
                        </button>
                      </div>
                    </div>
                  </div>
                ) : cameraActive ? (
                  /* 2. Live Video Feed with Biometric Oval Guide */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />

                    {/* Biometric Oval Target Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-48 h-60 sm:w-56 sm:h-68 rounded-[50%] border-2 border-dashed border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative">
                        {/* Scanning radar indicator line */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse top-1/2" />
                      </div>
                      <p className="text-white text-[11px] font-semibold mt-3 px-3 py-1 bg-black/60 rounded-full backdrop-blur-sm">
                        Position face inside oval &amp; look directly at camera
                      </p>
                    </div>

                    {/* Capture Floating Action Button */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        disabled={isCapturing}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full font-bold text-xs shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        {isCapturing ? 'Processing...' : 'Scan / Capture Face'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. Camera Offline / Fallback upload state */
                  <div className="text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                      <CameraOff className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200">Camera Inactive</p>
                      <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                        {cameraError || 'Click below to start your webcam or upload a clear selfie.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Start Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input for fallback upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={submitting || !isIdValid || !capturedImage}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  <>
                    Complete Verification <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer py-1"
                >
                  I&apos;ll do this later (Skip for now)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security Assurance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Identity documents are encrypted and processed in compliance with Data Protection laws.</span>
        </div>
      </div>
    </div>
  );
}
