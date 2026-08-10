import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

/**
 * Shows a full-screen overlay forcing the user to rotate their device
 * to landscape. Attempts to auto-lock via Screen Orientation API.
 * Hides as soon as the device is in landscape orientation.
 */
export const RotateDeviceOverlay: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(true); // assume portrait until proven otherwise

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    // Initial check
    checkOrientation();

    // Listen for resize / orientation change
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Best-effort orientation lock (requires user gesture + fullscreen on some browsers)
    if ('orientation' in screen && typeof (screen.orientation as any).lock === 'function') {
      (screen.orientation as any).lock('landscape').catch(() => {
        // Silently fail — overlay still works as a prompt
      });
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none p-8">
      {/* Blood-red glow circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-red-900/10 blur-3xl animate-pulse" />
      </div>

      {/* Rotate icon */}
      <Smartphone
        className="w-28 h-28 text-red-500 mb-6 rotate-0 animate-[spin_2s_linear_infinite]"
        style={{
          animation: 'phoneRotate 2s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes phoneRotate {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
      `}</style>

      <h2 className="text-2xl md:text-3xl font-gothic text-red-400 mb-4 text-center">
        ROTACIONE O DISPOSITIVO
      </h2>

      <p className="text-sm md:text-base font-retro text-gray-400 text-center max-w-xs leading-relaxed">
        Bloodmage 1995 exige o modo paisagem para uma experiência ideal de jogo.
      </p>

      <p className="mt-6 text-[10px] font-pixel text-red-800 animate-pulse">
        A JOGAR EM MODO RETRATO NÃO É SUPORTADO
      </p>

      {/* Decorative blood drip */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8">
        <div className="w-0.5 h-16 bg-red-900/40 rounded-full" />
        <div className="w-0.5 h-10 bg-red-900/30 rounded-full" />
        <div className="w-0.5 h-20 bg-red-900/50 rounded-full" />
      </div>
    </div>
  );
};
