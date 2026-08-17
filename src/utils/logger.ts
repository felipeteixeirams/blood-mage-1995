export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  sessionId: string;
}

const MAX_BUFFER_SIZE = 250;
const FLUSH_INTERVAL_MS = 1000;
const MAX_QUEUE_BATCH = 10;

class LoggerService {
  private sessionId: string;
  private buffer: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private errorCount: number = 0;

  // Remote log ingestion parameters for Vercel Runtime Logs integration
  private remoteEndpoint: string = '/api/log';
  private remoteEnabled: boolean = true;
  private remoteQueue: LogEntry[] = [];
  private flushTimer: any = null;
  private isFlushing: boolean = false;

  constructor() {
    this.sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    this.setupGlobalHandlers();
    this.setupUnloadHandlers();
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }

  public getLogs(): LogEntry[] {
    return [...this.buffer];
  }

  public setRemoteEndpoint(endpoint: string) {
    this.remoteEndpoint = endpoint;
  }

  public setRemoteEnabled(enabled: boolean) {
    this.remoteEnabled = enabled;
  }

  public isRemoteEnabled(): boolean {
    return this.remoteEnabled;
  }

  public getRemoteQueueLength(): number {
    return this.remoteQueue.length;
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.buffer]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = [...this.buffer];
    this.listeners.forEach((listener) => listener(copy));
  }

  private log(level: LogLevel, namespace: string, message: string, data?: any) {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      namespace: namespace.toUpperCase(),
      message,
      data,
      sessionId: this.sessionId,
    };

    if (level === 'ERROR') {
      this.errorCount++;
    }

    // Add to buffer
    this.buffer.unshift(entry);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.pop();
    }

    // Console output — use correct method per level so DevTools filters work
    // and so any server-side runner (Node.js, Vercel Functions) routes them correctly
    const prefix = `[${entry.timestamp.split('T')[1].slice(0, 12)}] [${entry.level}] [${entry.namespace}]`;
    const msg = `${prefix} ${entry.message}`;

    if (level === 'ERROR') {
      data !== undefined ? console.error(msg, data) : console.error(msg);
    } else if (level === 'WARN') {
      data !== undefined ? console.warn(msg, data) : console.warn(msg);
    } else if (level === 'INFO') {
      data !== undefined ? console.info(msg, data) : console.info(msg);
    } else {
      data !== undefined ? console.debug(msg, data) : console.debug(msg);
    }

    this.notify();

    // Ingest into remote queue for Vercel Runtime Logs forwarding
    // By default, forward ERROR and WARN logs (and telemetry INFO events)
    if (this.remoteEnabled && (level === 'ERROR' || level === 'WARN' || namespace.startsWith('TELEMETRY') || namespace.startsWith('EVENT:'))) {
      this.enqueueRemote(entry);
    }
  }

  private enqueueRemote(entry: LogEntry) {
    this.remoteQueue.push(entry);

    if (this.remoteQueue.length >= MAX_QUEUE_BATCH) {
      this.flushRemote();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flushRemote();
      }, FLUSH_INTERVAL_MS);
    }
  }

  public async flushRemote(): Promise<void> {
    if (!this.remoteEnabled || this.remoteQueue.length === 0 || this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    const batch = [...this.remoteQueue];
    this.remoteQueue = [];

    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch(this.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: batch }),
        });

        if (!response.ok) {
          // If remote request failed, re-queue logs up to limit to prevent loss
          if (this.remoteQueue.length < MAX_BUFFER_SIZE) {
            this.remoteQueue.unshift(...batch);
          }
        }
      }
    } catch {
      // Fail silently to prevent throwing unhandled rejections during network outages
      if (this.remoteQueue.length < MAX_BUFFER_SIZE) {
        this.remoteQueue.unshift(...batch);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  public debug(namespace: string, message: string, data?: any) {
    // Suppress debug logs in production to avoid CPU/Console bottlenecks
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
      return;
    }
    this.log('DEBUG', namespace, message, data);
  }

  public info(namespace: string, message: string, data?: any) {
    this.log('INFO', namespace, message, data);
  }

  public warn(namespace: string, message: string, data?: any) {
    this.log('WARN', namespace, message, data);
  }

  public error(namespace: string, message: string, data?: any) {
    this.log('ERROR', namespace, message, data);
  }

  public clear() {
    this.buffer = [];
    this.remoteQueue = [];
    this.errorCount = 0;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.notify();
  }

  public exportLogsJson(): string {
    const payload = {
      app: 'Bloodmage 1995',
      version: '1.5.0',
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      errorCount: this.errorCount,
      totalEntries: this.buffer.length,
      logs: this.buffer,
    };
    return JSON.stringify(payload, null, 2);
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.onerror = (message, source, lineno, colno, error) => {
      this.error('GLOBAL_EXCEPTION', typeof message === 'string' ? message : 'Unhandled Exception', {
        source,
        lineno,
        colno,
        message: error?.message || (typeof message === 'string' ? message : 'Unknown Error'),
        stack: error?.stack,
      });
    };

    window.onunhandledrejection = (event) => {
      const reason = event?.reason;
      let formattedReason: any = reason;

      if (reason instanceof Error || (typeof reason === 'object' && reason !== null && 'message' in reason)) {
        formattedReason = {
          name: reason.name || 'Error',
          message: reason.message,
          stack: reason.stack,
          code: (reason as any).code,
          ...reason,
        };
      } else if (typeof reason === 'object' && reason !== null) {
        try {
          const props: Record<string, any> = {};
          for (const key of Object.getOwnPropertyNames(reason)) {
            props[key] = (reason as any)[key];
          }
          formattedReason = Object.keys(props).length > 0 ? props : String(reason);
        } catch {
          formattedReason = String(reason);
        }
      }

      const messageStr = typeof formattedReason?.message === 'string' 
        ? formattedReason.message 
        : typeof reason === 'string' 
          ? reason 
          : '';

      // Ignore benign browser rejections (autoplay restrictions before user gesture, interrupted media play, resize loop)
      const isBenign = 
        messageStr.includes('The play() request was interrupted') ||
        messageStr.includes("user didn't interact") ||
        messageStr.includes('ResizeObserver loop') ||
        messageStr.includes("Failed to execute 'play' on 'HTMLMediaElement'") ||
        messageStr.includes('audio context');

      if (isBenign) {
        this.debug('UNHANDLED_REJECTION', 'Benign browser rejection suppressed', formattedReason);
        return;
      }

      this.error('UNHANDLED_REJECTION', 'Unhandled Promise Rejection', {
        reason: formattedReason ?? 'Unknown rejection reason',
      });
    };
  }

  private setupUnloadHandlers() {
    if (typeof window === 'undefined') return;

    const handleUnload = () => {
      if (this.remoteQueue.length > 0 && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([JSON.stringify({ logs: this.remoteQueue })], { type: 'application/json' });
          navigator.sendBeacon(this.remoteEndpoint, blob);
          this.remoteQueue = [];
        } catch {
          // Ignore beacon delivery errors on unload
        }
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    window.addEventListener('beforeunload', handleUnload);
  }
}

export const logger = new LoggerService();
