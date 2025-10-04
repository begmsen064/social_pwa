import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    if (hasSeenPrompt) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Already installed in standalone mode');
      return;
    }

    // Check if running in native app
    if ((navigator as any).standalone) {
      console.log('Running in iOS standalone mode');
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect mobile (Android/iOS)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    console.log('PWA Install Prompt - Mobile:', isMobile, 'iOS:', iOS);

    // For Android/Chrome - wait for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds
      setTimeout(() => {
        console.log('Showing install prompt (Android)');
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // ALWAYS show prompt on mobile after 5 seconds (even if beforeinstallprompt doesn't fire)
    if (isMobile) {
      setTimeout(() => {
        console.log('Showing install prompt (Mobile - forced)');
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // If we have the install prompt event, use it
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    } else {
      // If no install prompt, show instructions
      setShowInstructions(true);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  if (!showPrompt && !showInstructions) return null;

  // Instructions modal
  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => {
        setShowInstructions(false);
        setShowPrompt(false);
        localStorage.setItem('pwa-install-prompt-seen', 'true');
      }}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "'Bungee', system-ui" }}>
              Nasıl Yüklenir?
            </h3>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">Tarayıcı menüsünü aç (⋮)</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">"Ana ekrana ekle" veya "Yükle" seçeneğine tıkla</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">"Ekle" veya "Yükle" butonuna bas</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowInstructions(false);
              setShowPrompt(false);
              localStorage.setItem('pwa-install-prompt-seen', 'true');
            }}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2.5 px-4 rounded-lg font-semibold"
          >
            Anlaşıldı
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 relative overflow-hidden max-w-md mx-auto">
        {/* Background Gradient - Thin line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5" style={{ fontFamily: "'Bungee', system-ui" }}>
              KUNDUZ'u Yükle
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Ana ekrana ekle
            </p>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          {isIOS ? (
            // iOS - Show info
            <button
              onClick={() => alert('Safari paylaş menüsünden "Ana Ekrana Ekle" seçeneğini kullan')}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Nasıl Yüklenir?
            </button>
          ) : (
            // Android/Chrome Install Button
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Yükle
            </button>
          )}
          
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            Sonra
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
