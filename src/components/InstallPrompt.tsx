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
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-primary p-6 relative overflow-hidden max-w-md w-full animate-in zoom-in slide-in-from-bottom duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse"></div>
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Bungee', system-ui" }}>
              KUNDUZ'u Yükle
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ana ekrana ekleyerek hızlı erişim sağla! 🚀
            </p>

            {isIOS ? (
              // iOS Instructions
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 space-y-2">
                <p className="font-semibold">Ana ekrana eklemek için:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Safari'nin paylaş butonuna bas 📤</li>
                  <li>"Ana Ekrana Ekle" seçeneğine tıkla</li>
                  <li>"Ekle" butonuna bas</li>
                </ol>
              </div>
            ) : (
              // Android/Chrome Install Button
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 px-4 rounded-xl font-bold hover:shadow-xl hover:shadow-primary/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Download className="h-5 w-5" />
                Şimdi Yükle
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Belki Sonra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
