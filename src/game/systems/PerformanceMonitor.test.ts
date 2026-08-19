import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;
  let tick = 0;

  beforeEach(() => {
    tick = 1000;
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => tick);
  });

  afterEach(() => {
    nowSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('update() acumula histórico de FPS', () => {
    const monitor = new PerformanceMonitor();
    tick = 1000;
    monitor.update();
    tick = 1050; // 50ms delta -> 20 FPS
    monitor.update();
    const metrics = monitor.getMetrics();
    expect(metrics.fps).toBe(20);
    expect(metrics.avgFps).toBeCloseTo(20, 5);
  });

  it('avg/min/max refletem múltiplos frames', () => {
    const monitor = new PerformanceMonitor();
    // 16ms -> 62.5 FPS ; 50ms -> 20 FPS ; 33ms -> ~30 FPS
    monitor.update();
    tick = 1016;
    monitor.update();
    tick = 1066;
    monitor.update();
    tick = 1099;
    monitor.update();
    const metrics = monitor.getMetrics();
    expect(metrics.minFps).toBeCloseTo(20, 0);
    expect(metrics.maxFps).toBeCloseTo(62.5, 0);
    expect(metrics.avgFps).toBeGreaterThan(20);
    expect(metrics.avgFps).toBeLessThan(62.5);
  });

  it('enable() cria overlay no body quando não recebe container', () => {
    const monitor = new PerformanceMonitor();
    monitor.enable();
    expect(document.body.querySelector('#performance-monitor')).not.toBeNull();
    monitor.disable();
    expect(document.body.querySelector('#performance-monitor')).toBeNull();
  });

  it('enable() com container usa o elemento informado', () => {
    const container = document.createElement('div');
    const monitor = new PerformanceMonitor();
    monitor.enable(container);
    expect(document.getElementById('performance-monitor')).toBeNull();
    monitor.disable();
  });

  it('getMetrics() retorna 0 antes de qualquer update', () => {
    const monitor = new PerformanceMonitor();
    const metrics = monitor.getMetrics();
    expect(metrics.fps).toBe(0);
    expect(metrics.avgFps).toBe(0);
  });

  it('reset() zera o histórico', () => {
    const monitor = new PerformanceMonitor();
    tick = 1000;
    monitor.update();
    monitor.reset();
    const metrics = monitor.getMetrics();
    expect(metrics.avgFps).toBe(0);
  });

  it('benchmark() mede tempo médio por iteração', () => {
    const elapsed = PerformanceMonitor.benchmark(() => { for (let i = 0; i < 1000; i++) {} }, 50);
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(typeof elapsed).toBe('number');
  });
});
