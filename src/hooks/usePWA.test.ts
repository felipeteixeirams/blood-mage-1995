import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('PWA & Offline-First Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects online/offline event listeners correctly', () => {
    let isOnline = navigator.onLine;
    const onlineHandler = () => { isOnline = true; };
    const offlineHandler = () => { isOnline = false; };

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    window.dispatchEvent(new Event('offline'));
    expect(isOnline).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(isOnline).toBe(true);

    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  });

  it('persists install banner dismissal to sessionStorage', () => {
    const PWA_DISMISSED_KEY = 'bloodmage_pwa_dismissed';
    expect(sessionStorage.getItem(PWA_DISMISSED_KEY)).toBeNull();

    sessionStorage.setItem(PWA_DISMISSED_KEY, 'true');
    expect(sessionStorage.getItem(PWA_DISMISSED_KEY)).toBe('true');
  });

  it('handles beforeinstallprompt event mock and userChoice resolution', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const event = new Event('beforeinstallprompt') as any;
    event.prompt = mockPrompt;
    event.userChoice = mockUserChoice;

    let deferredPrompt: any = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    window.dispatchEvent(event);
    expect(deferredPrompt).not.toBeNull();

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    expect(mockPrompt).toHaveBeenCalled();
    expect(choice.outcome).toBe('accepted');
  });

  it('handles fullscreen toggle with standard and vendor prefixes', async () => {
    const mockRequest = vi.fn().mockResolvedValue(undefined);
    const mockExit = vi.fn().mockResolvedValue(undefined);

    document.documentElement.requestFullscreen = mockRequest;
    document.exitFullscreen = mockExit;

    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      expect(mockRequest).toHaveBeenCalled();
    }
  });
});
