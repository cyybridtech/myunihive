import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('unihive_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        setSupportsPWA(false);
      }
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('unihive_pwa_dismissed', 'true');
    } catch { /* ignore */ }
  };

  if (!supportsPWA || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-3">
        <button
          onClick={onClick}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <Download className="w-4 h-4 text-slate-950" />
          </div>
          <span>Install App</span>
        </button>
        <div className="h-4 w-px bg-slate-700"></div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss app install banner"
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

