import { MessageCircle, Mail, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  // Configurable WhatsApp support contact number/link
  const whatsappNumber = "233540000000"; // Ghana country code format or custom support number
  const whatsappMessage = encodeURIComponent("Hello UniHive Support, I am inquiring about the platform updates.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen w-full bg-[#141619] text-[#9EA3A8] flex flex-col items-center justify-between p-6 sm:p-10 select-none font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-[#ff6b00]/[0.03] to-[#0f243e]/[0.08] rounded-full blur-3xl pointer-events-none" />

      {/* Top Section / Brand */}
      <div className="w-full max-w-md pt-4 flex flex-col items-center z-10 animate-fade-in">
        <div className="relative group mb-3">
          <img
            src="/unihive-logo.jpg"
            alt="UniHive - Find Your Perfect Hostel"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-2xl shadow-black/80 border border-white/[0.08] transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Uni<span className="text-[#FF6B00]">Hive</span>
          </h2>
          <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-slate-400 font-semibold mt-1">
            — FIND YOUR PERFECT HOSTEL —
          </p>
        </div>
      </div>

      {/* Center Minimalist Status Card (Matching User Reference) */}
      <main className="w-full max-w-md flex flex-col items-center text-center my-auto py-8 z-10">
        {/* Glowing Circular Badge */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1C1F24] border border-white/[0.08] flex items-center justify-center shadow-xl shadow-black/60 relative">
            <div className="absolute inset-0 rounded-full border border-[#FF6B00]/20 animate-pulse" />
            <ShieldAlert className="w-9 h-9 sm:w-10 sm:h-10 text-[#FF6B00]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Status Headline */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.15em] text-[#E1E4E8] uppercase mb-4">
          SITE UNDER DEVELOPMENT
        </h1>

        {/* Minimalist Divider */}
        <div className="w-16 h-[2px] bg-[#2C3036] rounded-full mb-6" />

        {/* Descriptive Message */}
        <p className="text-sm sm:text-base text-[#7E858E] leading-relaxed max-w-sm mb-10 px-2 font-normal">
          This website is currently undergoing heavy updates and improvements. Please contact the administrator or reach out via WhatsApp for immediate inquiries.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full max-w-xs gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-full bg-[#1C2025] hover:bg-[#252A31] border border-white/[0.08] hover:border-[#FF6B00]/40 text-[#D0D5DD] hover:text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-lg shadow-black/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]/20" />
            <span>Chat on WhatsApp</span>
          </a>

          <a
            href="mailto:support@myunihive.com"
            className="w-full py-3 px-6 rounded-full bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] text-xs text-[#707680] hover:text-[#A0A6B0] flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>support@myunihive.com</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4 z-10">
        <p className="text-[11px] text-[#4F555E] tracking-wide">
          © {new Date().getFullYear()} UniHive • All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
