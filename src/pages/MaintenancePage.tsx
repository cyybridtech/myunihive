import { MessageCircle, Mail, ShieldAlert } from 'lucide-react';

export default function MaintenancePage() {
  // Configurable WhatsApp support contact number/link
  const whatsappNumber = "233533143634"; // Ghana WhatsApp number: 0533143634
  const whatsappMessage = encodeURIComponent("Hello UniHive Support, I am inquiring about the platform updates.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen w-full bg-[#141619] text-[#9EA3A8] flex flex-col items-center justify-between p-6 sm:p-10 select-none font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-[#ff6b00]/[0.04] to-[#0f243e]/[0.1] rounded-full blur-3xl pointer-events-none" />

      {/* Top Section / Brand */}
      <div className="w-full max-w-md pt-4 flex flex-col items-center z-10 animate-fade-in">
        <div className="relative group mb-4">
          <div className="p-1 rounded-full bg-gradient-to-tr from-[#0F243E] via-[#FF6B00]/40 to-[#0F243E] shadow-2xl shadow-black/80">
            <img
              src="/unihive-logo.jpg"
              alt="UniHive - Find Your Perfect Hostel"
              className="w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-full border-2 border-white/10 transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Uni<span className="text-[#FF6B00]">Hive</span>
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.22em] uppercase text-slate-400 font-semibold mt-1">
            — FIND YOUR PERFECT HOSTEL —
          </p>
        </div>
      </div>

      {/* Center Minimalist Status Card (Matching User Reference) */}
      <main className="w-full max-w-md flex flex-col items-center text-center my-auto py-6 z-10">
        {/* Glowing Circular Badge */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1C1F24] border border-white/[0.08] flex items-center justify-center shadow-xl shadow-black/60 relative">
            <div className="absolute inset-0 rounded-full border border-[#FF6B00]/20 animate-pulse" />
            <ShieldAlert className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF6B00]" strokeWidth={1.75} />
          </div>
        </div>

        {/* Status Headline */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-[0.15em] text-[#E1E4E8] uppercase mb-3">
          SITE UNDER DEVELOPMENT
        </h1>

        {/* Minimalist Divider */}
        <div className="w-16 h-[2px] bg-[#2C3036] rounded-full mb-5" />

        {/* Descriptive Message */}
        <p className="text-sm sm:text-base text-[#7E858E] leading-relaxed max-w-sm mb-8 px-2 font-normal">
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
            href="mailto:cyybridtechnnology@gmail.com"
            className="w-full py-3 px-6 rounded-full bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] text-xs text-[#707680] hover:text-[#A0A6B0] flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>cyybridtechnnology@gmail.com</span>
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
