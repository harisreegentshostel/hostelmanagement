import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? window.__pwaInstallPrompt || null : null;
  });
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
  });
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone display mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandaloneApp(standalone);

    // 2. Detect iOS devices (Safari does not fire beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    // 3. Listen for Chromium beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Android / Desktop Chrome prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
      }
    } else if (isIosDevice) {
      // Show Apple Safari step-by-step guidance
      setShowIosGuide(!showIosGuide);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    } catch {}
  };

  // Do not show if already running in installed app or if user dismissed in this session
  if (isStandaloneApp || dismissed) {
    return null;
  }

  // Show if either Chromium has install prompt ready OR on iOS Safari
  const canInstall = Boolean(deferredPrompt || isIosDevice);
  if (!canInstall) {
    return null;
  }

  return (
    <aside aria-label="Install web application" className="w-full bg-[#011627] text-white border-b border-white/10 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            {isIosDevice ? (
              <Smartphone className="w-4 h-4 text-sky-400" />
            ) : (
              <Download className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-semibold block sm:inline text-white">Install Harisree Hostel</span>
            <span className="hidden sm:inline text-white/70"> — </span>
            <span className="text-white/70 text-[11px] sm:text-xs block sm:inline">
              Fast, fullscreen home screen app with offline support
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-[#011627] hover:bg-white/90 shadow-xs transition cursor-pointer active:scale-95"
          >
            {isIosDevice ? (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#011627]" />
                <span>How to Install</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#011627]" />
                <span>Install App</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Instruction Dropdown */}
      {showIosGuide && isIosDevice && (
        <div className="bg-[#0b253a] border-t border-white/10 px-4 py-3 text-xs text-white/90 animate-fadeIn">
          <div className="max-w-xl mx-auto space-y-1.5">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span>To install on iPhone or iPad:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-white/80 text-[11px] sm:text-xs">
              <li>
                Tap the <strong className="text-white">Share</strong> button at the bottom of Safari (<Share2 className="w-3 h-3 inline text-sky-400" />).
              </li>
              <li>
                Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-white">Add</strong> in the top-right corner.
              </li>
            </ol>
          </div>
        </div>
      )}
    </aside>
  );
};
