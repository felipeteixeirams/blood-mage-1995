import { logger } from './logger';

export interface TelemetryMetrics {
  fps: number;
  frameTimeMs: number;
  entityCount: number;
  activeVoices: number;
  totalLogs: number;
  errorCount: number;
  sessionDurationSec: number;
}

export interface TelemetryEvent {
  eventName: string;
  timestamp: string;
  properties?: Record<string, any>;
}

class TelemetryTracker {
  private startTime: number = Date.now();
  private eventHistory: TelemetryEvent[] = [];
  private currentMetrics: TelemetryMetrics = {
    fps: 60,
    frameTimeMs: 16.6,
    entityCount: 0,
    activeVoices: 0,
    totalLogs: 0,
    errorCount: 0,
    sessionDurationSec: 0,
  };

  constructor() {
    logger.info('TELEMETRY', 'Iniciando rastreador de telemetria da sessão', {
      sessionId: logger.getSessionId(),
      startTime: new Date().toISOString(),
    });
  }

  public trackEvent(eventName: string, properties?: Record<string, any>) {
    const event: TelemetryEvent = {
      eventName,
      timestamp: new Date().toISOString(),
      properties,
    };
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.pop();
    }

    logger.info(`EVENT:${eventName.toUpperCase()}`, `Evento registrado: ${eventName}`, properties);
  }

  public updatePerformanceMetrics(fps: number, frameTimeMs: number, entityCount: number, activeVoices: number) {
    const sessionDurationSec = Math.floor((Date.now() - this.startTime) / 1000);
    this.currentMetrics = {
      fps: Math.round(fps),
      frameTimeMs: parseFloat(frameTimeMs.toFixed(1)),
      entityCount,
      activeVoices,
      totalLogs: logger.getLogs().length,
      errorCount: logger.getErrorCount(),
      sessionDurationSec,
    };
  }

  public getMetrics(): TelemetryMetrics {
    const sessionDurationSec = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      ...this.currentMetrics,
      totalLogs: logger.getLogs().length,
      errorCount: logger.getErrorCount(),
      sessionDurationSec,
    };
  }

  public getEventHistory(): TelemetryEvent[] {
    return [...this.eventHistory];
  }
}

export const telemetry = new TelemetryTracker();
