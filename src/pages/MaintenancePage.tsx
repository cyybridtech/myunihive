import React, { useState } from 'react';
import { Hexagon, Wrench, Sparkles, ShieldCheck, Mail, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <Hexagon className="w-7 h-7 text-slate-950 fill-slate-950/20" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">
              Uni<span className="text-amber-400">Hive</span>
            </span>
            <span className="block text-xs uppercase tracking-widest text-amber-300/80 font-semibold">
              Ghana Campus Living
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-medium text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Scheduled Upgrade
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-6 py-12 my-auto">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <div className="text-center max-w-2xl mx-auto">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300 mb-6 shadow-sm">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              Under Active Development & Maintenance
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              We’re Upgrading Your <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                Student Living Experience
              </span>
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              <strong className="text-white">myunihive.com</strong> is currently undergoing a major platform upgrade to bring you smoother hostel bookings, enhanced room verification, smart roommate discovery, and instant student accommodations across Ghana.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <div className="p-2 bg-amber-500/10 w-fit rounded-xl mb-3 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">New Interface</h3>
                <p className="text-xs text-slate-400">Faster, responsive discovery and streamlined mobile checkouts.</p>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <div className="p-2 bg-amber-500/10 w-fit rounded-xl mb-3 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">Verified Hostels</h3>
                <p className="text-xs text-slate-400">100% verified hostel managers & direct payment protections.</p>
              </div>

              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                <div className="p-2 bg-amber-500/10 w-fit rounded-xl mb-3 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">Back Shortly</h3>
                <p className="text-xs text-slate-400">We will be live with full functionality very soon.</p>
              </div>
            </div>

            {/* Notification Subscription / Contact Form */}
            <div className="max-w-md mx-auto">
              {subscribed ? (
                <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Thank you! We’ll keep you updated as soon as we launch.</span>
                </div>
              ) : (
                <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your student or personal email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Get Notified</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Direct Support Contact */}
            <div className="mt-8 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-4">
              <span>Need immediate assistance?</span>
              <a
                href="mailto:support@myunihive.com"
                className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
              >
                support@myunihive.com
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} UniHive Inc. All rights reserved. • Accra, Ghana</p>
      </footer>
    </div>
  );
}
