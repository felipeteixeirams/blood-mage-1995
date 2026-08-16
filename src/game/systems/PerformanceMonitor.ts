import { logger } from '../../utils/logger';

/**
 * Performance Monitor (Fase 5)
 * Monitor de FPS, memória e performance do jogo
 */

export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  memoryUsed: number;
  memoryMax: number;
  frameTime: number;
  objectCount: number;
  culledCount: number;
}

export class PerformanceMonitor {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameHistory: number[] = [];
  private maxHistory: number = 300; // 5 segundos @ 60 FPS
  private enabled: boolean = false;
  private displayElement: HTMLElement | null = null;

  constructor() {
    this.lastFrameTime = performance.now();
  }

  /**
   * Ativar monitor de performance (mostra UI)
   */
  public enable(displayIn: HTMLElement | null = null): void {
    this.enabled = true;

    if (displayIn) {
      this.displayElement = displayIn;
    } else {
      // Criar elemento de display padrão
      this.displayElement = document.createElement('div');
      this.displayElement.id = 'performance-monitor';
      Object.assign(this.displayElement.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '8px',
        borderRadius: '4px',
        zIndex: '10000',
        pointerEvents: 'none',
      });
      document.body.appendChild(this.displayElement);
    }
  }

  /**
   * Desativar monitor
   */
  public disable(): void {
    this.enabled = false;
    if (this.displayElement && this.displayElement.parentNode) {
      this.displayElement.parentNode.removeChild(this.displayElement);
      this.displayElement = null;
    }
  }

  /**
   * Atualizar monitor (chamar a cada frame)
   */
  public update(): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Calcular FPS
    if (deltaTime > 0) {
      this.fps = 1000 / deltaTime;
      this.frameHistory.push(this.fps);

      if (this.frameHistory.length > this.maxHistory) {
        this.frameHistory.shift();
      }
    }

    if (this.enabled && this.displayElement) {
      this.updateDisplay();
    }
  }

  /**
   * Atualizar elemento de display
   */
  private updateDisplay(): void {
    if (!this.displayElement) return;

    const metrics = this.getMetrics();
    const memoryText =
      (performance as any).memory?.usedJSHeapSize
        ? `Memory: ${(((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1))}MB`
        : '';

    const fpsColor = metrics.fps > 55 ? '#0f0' : metrics.fps > 40 ? '#ff0' : '#f00';

    this.displayElement.innerHTML = `
      <div style="color: ${fpsColor}">FPS: ${metrics.fps.toFixed(0)} (avg: ${metrics.avgFps.toFixed(0)})</div>
      <div>Frame: ${metrics.frameTime.toFixed(2)}ms</div>
      ${memoryText ? `<div>${memoryText}</div>` : ''}
    `;
  }

  /**
   * Obter métricas completas
   */
  public getMetrics(): PerformanceMetrics {
    const avgFps = this.frameHistory.length > 0
      ? this.frameHistory.reduce((a, b) => a + b) / this.frameHistory.length
      : 0;
    const minFps = this.frameHistory.length > 0 ? Math.min(...this.frameHistory) : 0;
    const maxFps = this.frameHistory.length > 0 ? Math.max(...this.frameHistory) : 0;

    let memoryUsed = 0;
    let memoryMax = 0;
    if ((performance as any).memory) {
      memoryUsed = (performance as any).memory.usedJSHeapSize / 1048576; // MB
      memoryMax = (performance as any).memory.jsHeapSizeLimit / 1048576; // MB
    }

    return {
      fps: this.fps,
      avgFps,
      minFps,
      maxFps,
      memoryUsed,
      memoryMax,
      frameTime: 1000 / Math.max(this.fps, 1),
      objectCount: 0, // Será preenchido externamente
      culledCount: 0, // Será preenchido externamente
    };
  }

  /**
   * Resetar histórico
   */
  public reset(): void {
    this.frameHistory = [];
    this.fps = 0;
  }

  /**
   * Log de performance ao console
   */
  public logMetrics(): void {
    const metrics = this.getMetrics();
    const isDegraded = metrics.fps < 30 || metrics.avgFps < 30;
    const logData = {
      currentFps: metrics.fps.toFixed(0),
      avgFps: metrics.avgFps.toFixed(0),
      minFps: metrics.minFps.toFixed(0),
      maxFps: metrics.maxFps.toFixed(0),
      frameTime: `${metrics.frameTime.toFixed(2)}ms`,
      memoryUsed: `${metrics.memoryUsed.toFixed(1)}MB`,
      memoryMax: `${metrics.memoryMax.toFixed(1)}MB`,
    };

    if (isDegraded) {
      logger.warn('PERFORMANCE', 'Desempenho degradado detectado (< 30 FPS)', logData);
    } else {
      logger.debug('PERFORMANCE', 'Métricas de desempenho estáveis', logData);
    }
  }

  /**
   * Benchmark: medir performance de uma função
   */
  public static benchmark(fn: () => void, iterations: number = 100): number {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    return (end - start) / iterations;
  }

  /**
   * Profiler: medir performance de renderização via requestAnimationFrame
   */
  public static async profileRender(duration: number = 1000): Promise<PerformanceMetrics> {
    const monitor = new PerformanceMonitor();
    const startTime = performance.now();

    return new Promise((resolve) => {
      const tick = () => {
        monitor.update();
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(tick);
        } else {
          resolve(monitor.getMetrics());
        }
      };
      tick();
    });
  }
}

export default PerformanceMonitor;
