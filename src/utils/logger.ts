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

class LoggerService {
  private sessionId: string;
  private buffer: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private errorCount: number = 0;

  constructor() {
    this.sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    this.setupGlobalHandlers();
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
    this.errorCount = 0;
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
        stack: error?.stack,
      });
    };

    window.onunhandledrejection = (event) => {
      this.error('UNHANDLED_REJECTION', 'Unhandled Promise Rejection', {
        reason: event.reason,
      });
    };
  }
}

export const logger = new LoggerService();
