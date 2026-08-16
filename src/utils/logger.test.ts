import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger';

describe('LoggerService (Vercel Runtime Logs Integration)', () => {
  beforeEach(() => {
    logger.clear();
    logger.setRemoteEnabled(true);
    logger.setRemoteEndpoint('/api/log');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a unique sessionId on creation', () => {
    const sessionId = logger.getSessionId();
    expect(sessionId).toBeDefined();
    expect(sessionId.startsWith('sess_')).toBe(true);
  });

  it('records logs into buffer and increments error count for errors', () => {
    logger.info('TEST', 'Info message');
    logger.warn('TEST', 'Warning message');
    logger.error('TEST', 'Error message', { code: 500 });

    const logs = logger.getLogs();
    expect(logs.length).toBe(3);
    expect(logger.getErrorCount()).toBe(1);

    expect(logs[0].level).toBe('ERROR');
    expect(logs[0].namespace).toBe('TEST');
    expect(logs[0].message).toBe('Error message');
    expect(logs[0].data).toEqual({ code: 500 });
    expect(logs[0].sessionId).toBe(logger.getSessionId());
  });

  it('queues ERROR and WARN logs for remote ingestion', () => {
    logger.setRemoteEnabled(true);

    logger.info('GENERAL', 'Info should not queue by default unless telemetry');
    expect(logger.getRemoteQueueLength()).toBe(0);

    logger.warn('SYSTEM', 'Warning should queue');
    expect(logger.getRemoteQueueLength()).toBe(1);

    logger.error('SYSTEM', 'Error should queue');
    expect(logger.getRemoteQueueLength()).toBe(2);
  });

  it('queues TELEMETRY and EVENT: logs for remote ingestion', () => {
    logger.setRemoteEnabled(true);

    logger.info('TELEMETRY', 'Session metric updated');
    expect(logger.getRemoteQueueLength()).toBe(1);

    logger.info('EVENT:BOSS_DEFEATED', 'Boss defeated event');
    expect(logger.getRemoteQueueLength()).toBe(2);
  });

  it('successfully flushes remote logs to Vercel log ingestion endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, processed: 1 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    logger.error('TEST_FLUSH', 'Critical failure');
    expect(logger.getRemoteQueueLength()).toBe(1);

    await logger.flushRemote();

    expect(fetchMock).toHaveBeenCalledWith('/api/log', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.logs).toBeDefined();
    expect(callBody.logs[0].message).toBe('Critical failure');
    expect(logger.getRemoteQueueLength()).toBe(0);
  });

  it('gracefully handles network errors during flush without throwing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    logger.error('TEST_FAIL', 'Network failure log');
    expect(logger.getRemoteQueueLength()).toBe(1);

    await expect(logger.flushRemote()).resolves.not.toThrow();

    // Re-queued on failure
    expect(logger.getRemoteQueueLength()).toBe(1);
  });

  it('clears log buffer, remote queue, and error counts', () => {
    logger.error('TEST', 'Error 1');
    logger.warn('TEST', 'Warn 1');

    expect(logger.getLogs().length).toBe(2);
    expect(logger.getErrorCount()).toBe(1);

    logger.clear();

    expect(logger.getLogs().length).toBe(0);
    expect(logger.getErrorCount()).toBe(0);
    expect(logger.getRemoteQueueLength()).toBe(0);
  });

  it('exports structured log payload containing session metadata', () => {
    logger.info('EXPORT', 'Test message');
    const jsonStr = logger.exportLogsJson();
    const parsed = JSON.parse(jsonStr);

    expect(parsed.app).toBe('Bloodmage 1995');
    expect(parsed.sessionId).toBe(logger.getSessionId());
    expect(parsed.logs.length).toBe(1);
  });
});
