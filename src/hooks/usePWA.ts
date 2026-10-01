import { useState, useEffect, useCallback } from 'react';
import { tryLockLandscape } from '../utils/orientation';
import { logger } from '../utils/logger';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWA_DISMISSED_KEY = 'bloodmage_pwa_install_dismissed';

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check standalone mode and platform
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isNavigatorStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      const standalone = isStandaloneMedia || isNavigatorStandalone || isAndroidApp;
      setIsStandalone(standalone);
      return standalone;
    };

    checkStandalone();

    // Check iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Check banner dismissed state
    try {
      const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
      if (dismissed) {
        const timestamp = parseInt(dismissed, 10);
        // Dismissed for 3 days
        if (Date.now() - timestamp < 3 * 24 * 60 * 60 * 1000) {
          setIsBannerDismissed(true);
        } else {
          localStorage.removeItem(PWA_DISMISSED_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Check fullscreen state
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', updateFullscreenState);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      logger.info('PWA', 'Capturado evento beforeinstallprompt para PWA');
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      logger.info('PWA', 'Bloodmage 1995 instalado com sucesso como PWA');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('fullscreenchange', updateFullscreenState);
    };
  }, []);

  // Online / Offline tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnectedToast(true);
        setTimeout(() => {
          setShowReconnectedToast(false);
        }, 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnectedToast(false);
      logger.warn('PWA', 'Conexão perdida. Modo Offline-First ativo.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Prompt install flow
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      logger.error('PWA', 'Erro ao abrir prompt de instalação do PWA', { error: err });
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        tryLockLandscape();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      logger.warn('PWA', 'Fullscreen não suportado ou bloqueado pelo navegador', { error: err });
    }
  }, []);

  return {
    isInstallable: isInstallable || (isIOS && !isStandalone),
    hasNativePrompt: Boolean(deferredPrompt),
    isStandalone,
    isOnline,
    showReconnectedToast,
    isIOS,
    isBannerDismissed,
    isFullscreen,
    promptInstall,
    dismissBanner,
    toggleFullscreen,
  };
}
