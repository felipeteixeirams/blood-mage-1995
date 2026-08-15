import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

// Monkey-patch AudioContext to prevent unhandled promise rejections from Phaser
if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const originalResume = AudioCtx.prototype.resume;
  AudioCtx.prototype.resume = function() {
    const promise = originalResume.call(this);
    if (promise && promise.catch) {
      return promise.catch((e: any) => {
        // Ignore unhandled DOMExceptions from AudioContext.resume()
      });
    }
    return promise;
  };
}

import './index.css';

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
