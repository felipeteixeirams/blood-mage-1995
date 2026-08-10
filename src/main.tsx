import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline support
registerSW({ immediate: true });

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
