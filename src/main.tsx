import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

// Monkey-patch AudioContext and HTMLMediaElement to prevent unhandled promise rejections
if (typeof window !== 'undefined') {
  if (window.AudioContext || (window as any).webkitAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const originalResume = AudioCtx.prototype.resume;
    if (originalResume) {
      AudioCtx.prototype.resume = function() {
        try {
          const promise = originalResume.call(this);
          if (promise && typeof promise.catch === 'function') {
            return promise.catch((_e: any) => {
              // Ignore unhandled DOMExceptions from AudioContext.resume()
            });
          }
          return promise;
        } catch {
          return Promise.resolve();
        }
      };
    }
  }

  if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype.play) {
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      try {
        const promise = originalPlay.call(this);
        if (promise && typeof promise.catch === 'function') {
          return promise.catch((_e: any) => {
            // Ignore unhandled autoplay restriction rejections
          });
        }
        return promise;
      } catch {
        return Promise.resolve();
      }
    };
  }
}

import './index.css';

// ─── PWA Service Worker Registration ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered:', registration);

      // Verificar por atualizações a cada 6 horas
      setInterval(() => {
        registration.update().catch((err) => {
          console.error('[PWA] Update check failed:', err);
        });
      }, 6 * 60 * 60 * 1000);

      // Avisar quando uma nova versão está pronta
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              console.log('[PWA] New version available - refresh to update');
              // Aqui poderíamos mostrar um toast/notificação para o usuário
            }
          });
        }
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

function SentryErrorFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-center text-red-500 font-press-start text-sm p-8">
      <div>
        <p className="text-2xl mb-4">⚠️ ERRO CRÍTICO</p>
        <p className="mb-4">Ocorreu um erro inesperado.</p>
        <p className="text-gray-400 text-xs">
          O erro foi registrado. Recarregue a página para tentar novamente.
        </p>
      </div>
    </div>
  );
}
