import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className="bg-white/95 backdrop-blur-md text-[#1d1d1f] border-b border-black/[0.08] px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-2">
        <Download className="w-4 h-4 text-[#011627]" />
        <span className="font-medium text-[#1d1d1f]">Install Harisree Hostel app on your phone for faster access!</span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstall}
          className="bg-[#011627] hover:bg-[#0b253a] text-white font-medium text-xs px-3.5 py-1.5 rounded-full shadow-xs transition cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[#86868b] hover:text-[#1d1d1f] p-1 transition cursor-pointer rounded-lg hover:bg-black/[0.04]"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
