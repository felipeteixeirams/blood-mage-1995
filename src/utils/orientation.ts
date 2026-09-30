/**
 * Utility for handling screen orientation locking gracefully.
 * Attempts to lock screen orientation to landscape on mobile browsers/PWAs
 * without blocking or disrupting portrait fallback.
 */

export function tryLockLandscape(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof screen === 'undefined') {
    return Promise.resolve(false);
  }

  try {
    const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
    if (orientation && typeof (orientation as any).lock === 'function') {
      return (orientation as any).lock('landscape')
        .then(() => true)
        .catch(() => {
          // Silently ignore: iOS Safari, missing fullscreen permission, or unsupported browser
          return false;
        });
    }
  } catch {
    // Ignore any browser security/permission exception
  }

  return Promise.resolve(false);
}

/**
 * Attaches passive one-time listeners to user gestures (touches / clicks / keys)
 * to attempt locking into landscape mode at the earliest permitted moment.
 */
export function initOrientationGestureHandler(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleGesture = () => {
    tryLockLandscape();
  };

  // Attempt immediately on mount
  tryLockLandscape();

  // Also attempt on user interaction (browsers often require user interaction)
  window.addEventListener('pointerdown', handleGesture, { passive: true });
  window.addEventListener('touchstart', handleGesture, { passive: true });
  window.addEventListener('click', handleGesture, { passive: true });
  window.addEventListener('keydown', handleGesture, { passive: true });

  return () => {
    window.removeEventListener('pointerdown', handleGesture);
    window.removeEventListener('touchstart', handleGesture);
    window.removeEventListener('click', handleGesture);
    window.removeEventListener('keydown', handleGesture);
  };
}
