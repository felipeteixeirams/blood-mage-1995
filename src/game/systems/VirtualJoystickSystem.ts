import Phaser from 'phaser';
import { applyJoystickResponse } from '../../utils/joystickResponse';

export interface VirtualJoystickConfig {
  maxRadius?: number;
  baseRadius?: number;
  deadzone?: number;
  curve?: number;
  sensitivity?: number;
  opacity?: number;
  dragToFollow?: boolean;
  enabled?: boolean;
}

export interface JoystickVector {
  x: number;
  y: number;
  rawX: number;
  rawY: number;
  magnitude: number;
  active: boolean;
}

export class VirtualJoystickSystem {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private glowGraphics: Phaser.GameObjects.Graphics | null = null;

  // Configuration
  private maxRadius: number = 54;
  private baseRadius: number = 66;
  private deadzone: number = 0.08;
  private curve: number = 1.0;
  private sensitivity: number = 1.0;
  private opacity: number = 0.85;
  private dragToFollow: boolean = true;
  private enabled: boolean = true;

  // Active state
  private active: boolean = false;
  private pointerId: number | null = null;
  private baseX: number = 0;
  private baseY: number = 0;
  private knobX: number = 0;
  private knobY: number = 0;

  // Output vector
  private vector: { x: number; y: number } = { x: 0, y: 0 };
  private rawVector: { x: number; y: number } = { x: 0, y: 0 };

  // Visual transitions
  private currentAlpha: number = 0;
  private targetAlpha: number = 0;

  constructor(scene: Phaser.Scene, config?: VirtualJoystickConfig) {
    this.scene = scene;
    if (config) {
      this.updateConfig(config);
    }
  }

  public init(): void {
    // Create graphics object rendered in screen space (scrollFactor = 0)
    if (this.scene.add && !this.graphics) {
      this.graphics = this.scene.add.graphics();
      this.graphics.setScrollFactor(0);
      this.graphics.setDepth(9998);

      this.glowGraphics = this.scene.add.graphics();
      this.glowGraphics.setScrollFactor(0);
      this.glowGraphics.setDepth(9999);
      this.glowGraphics.setBlendMode(Phaser.BlendModes.ADD); // ADD blend mode for neon/bloom
    }

    // Set default idle position (bottom-left)
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.baseX = Math.min(width * 0.12, 100);
    this.baseY = height - Math.min(height * 0.20, 100);
    this.knobX = this.baseX;
    this.knobY = this.baseY;

    // Register input listeners on the scene
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointerout', this.handlePointerUp, this);
    this.scene.input.on('pointercancel', this.handlePointerUp, this);
  }

  public updateConfig(config: Partial<VirtualJoystickConfig>): void {
    if (config.maxRadius !== undefined) this.maxRadius = config.maxRadius;
    if (config.baseRadius !== undefined) this.baseRadius = config.baseRadius;
    if (config.deadzone !== undefined) this.deadzone = config.deadzone;
    if (config.curve !== undefined) this.curve = config.curve;
    if (config.sensitivity !== undefined) this.sensitivity = config.sensitivity;
    if (config.opacity !== undefined) this.opacity = Math.max(0.1, Math.min(1.0, config.opacity));
    if (config.dragToFollow !== undefined) this.dragToFollow = config.dragToFollow;
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
      if (!this.enabled && this.active) {
        this.reset();
      }
    }
  }

  public update(_time: number, delta: number): void {
    if (!this.graphics || !this.glowGraphics || !this.enabled) return;

    // Smooth alpha transition - resting state is 40% of max opacity
    this.targetAlpha = this.active ? this.opacity : this.opacity * 0.4;
    const lerpSpeed = this.active ? 0.25 : 0.15;
    this.currentAlpha = Phaser.Math.Linear(this.currentAlpha, this.targetAlpha, Math.min(1, lerpSpeed * (delta / 16.6)));

    this.graphics.clear();
    this.glowGraphics.clear();

    if (this.currentAlpha > 0.01) {
      this.renderJoystick(this.graphics, this.glowGraphics, this.currentAlpha);
    }
  }

  private renderJoystick(g: Phaser.GameObjects.Graphics, glowG: Phaser.GameObjects.Graphics, alpha: number): void {
    const bx = this.baseX;
    const by = this.baseY;
    const kx = this.knobX;
    const ky = this.knobY;

    // Calculate dynamic stretch for glowing feedback
    const dist = Phaser.Math.Distance.Between(bx, by, kx, ky);
    const forceRatio = Math.min(dist / this.maxRadius, 1);

    // ==========================================
    // 1. BASE (OUTER RING)
    // ==========================================
    
    // Outer ambient glow (Additive)
    glowG.fillStyle(0xef4444, alpha * 0.15);
    glowG.fillCircle(bx, by, this.baseRadius + 12);
    glowG.fillStyle(0x881337, alpha * 0.25);
    glowG.fillCircle(bx, by, this.baseRadius + 4);

    // Glassmorphism background (dark ruby/black)
    g.fillStyle(0x0a0508, alpha * 0.75);
    g.fillCircle(bx, by, this.baseRadius);

    // Outer Border Glow (Additive)
    glowG.lineStyle(4, 0xef4444, alpha * 0.2);
    glowG.strokeCircle(bx, by, this.baseRadius);

    // Inner Metallic Gold Ring
    g.lineStyle(2, 0xd4af37, alpha * 0.8);
    g.strokeCircle(bx, by, this.baseRadius);

    // Deep Inner Track Ring
    g.lineStyle(1.5, 0x881337, alpha * 0.4);
    g.strokeCircle(bx, by, this.baseRadius * 0.6);

    // Directional Cardinal Notches (N, S, E, W)
    const notchLen = 8;
    g.lineStyle(2, 0xd4af37, alpha * 0.7);
    g.lineBetween(bx, by - this.baseRadius + 2, bx, by - this.baseRadius + notchLen + 2); // N
    g.lineBetween(bx, by + this.baseRadius - 2, bx, by + this.baseRadius - notchLen - 2); // S
    g.lineBetween(bx - this.baseRadius + 2, by, bx - this.baseRadius + notchLen + 2, by); // W
    g.lineBetween(bx + this.baseRadius - 2, by, bx + this.baseRadius - notchLen - 2, by); // E

    // ==========================================
    // 2. CONNECTION TETHER
    // ==========================================
    if (forceRatio > 0.05) {
      g.lineStyle(1 + (forceRatio * 3), 0xef4444, alpha * (0.3 + (forceRatio * 0.4)));
      g.lineBetween(bx, by, kx, ky);
      
      // Additive glow on tether
      glowG.lineStyle(4 + (forceRatio * 4), 0xef4444, alpha * (0.1 + (forceRatio * 0.2)));
      glowG.lineBetween(bx, by, kx, ky);
    }

    // ==========================================
    // 3. KNOB (THUMB)
    // ==========================================
    const knobRadius = 26;

    // Dynamic Thumb Glow (expands and brightens based on movement force)
    glowG.fillStyle(0xef4444, alpha * (0.2 + (forceRatio * 0.3)));
    glowG.fillCircle(kx, ky, knobRadius + 8 + (forceRatio * 8));
    glowG.fillStyle(0xf87171, alpha * (0.3 + (forceRatio * 0.3)));
    glowG.fillCircle(kx, ky, knobRadius + 4);

    // Knob Outer Body (Dark Crimson Ruby)
    g.fillStyle(0x450a0a, alpha * 0.95);
    g.fillCircle(kx, ky, knobRadius);

    // Knob Mid-Core
    g.fillStyle(0x991b1b, alpha * 0.9);
    g.fillCircle(kx, ky, knobRadius * 0.7);

    // Knob Inner Glowing Core
    g.fillStyle(0xef4444, alpha * 0.95);
    g.fillCircle(kx, ky, knobRadius * 0.4);

    // Knob Golden Border
    g.lineStyle(2.5, 0xffd700, alpha * 0.9);
    g.strokeCircle(kx, ky, knobRadius);

    // Knob Specular Gem Highlight (gives it a 3D glass dome look)
    g.fillStyle(0xffffff, alpha * 0.6);
    g.fillCircle(kx - 6, ky - 6, 5);
    g.fillStyle(0xffffff, alpha * 0.3);
    g.fillCircle(kx - 3, ky - 3, 2);
  }

  public handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    if (this.active) return; // Already capturing a movement pointer

    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Movement zone: Left 48% of screen, lower 75%
    const isLeftZone = pointer.x < width * 0.48 && pointer.y > height * 0.20;

    if (isLeftZone) {
      this.active = true;
      this.pointerId = pointer.id;
      this.baseX = pointer.x;
      this.baseY = pointer.y;
      this.knobX = pointer.x;
      this.knobY = pointer.y;
      this.vector = { x: 0, y: 0 };
      this.rawVector = { x: 0, y: 0 };
    }
  }

  public handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !this.active || pointer.id !== this.pointerId) return;

    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      this.knobX = this.baseX;
      this.knobY = this.baseY;
      this.rawVector = { x: 0, y: 0 };
      this.vector = { x: 0, y: 0 };
      return;
    }

    const clampedDist = Math.min(distance, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    // Mobile Legends / Diablo Immortal Drag-to-Follow Mechanic:
    // If the player drags past the outer radius, the base smoothly glides along
    if (this.dragToFollow && distance > this.maxRadius) {
      const excess = distance - this.maxRadius;
      const moveFactor = 0.28; // Smooth gliding coefficient
      this.baseX += Math.cos(angle) * excess * moveFactor;
      this.baseY += Math.sin(angle) * excess * moveFactor;
    }

    this.knobX = this.baseX + Math.cos(angle) * clampedDist;
    this.knobY = this.baseY + Math.sin(angle) * clampedDist;

    // Normalize raw vector to [-1, 1]
    const normX = Math.cos(angle) * (clampedDist / this.maxRadius);
    const normY = Math.sin(angle) * (clampedDist / this.maxRadius);
    this.rawVector = { x: normX, y: normY };

    // Apply configurable response curve, deadzone and sensitivity
    this.vector = applyJoystickResponse(normX, normY, {
      deadzone: this.deadzone,
      curve: this.curve,
      sensitivity: this.sensitivity,
    });
  }

  public handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.active && pointer.id === this.pointerId) {
      this.reset();
    }
  }

  public reset(): void {
    this.active = false;
    this.pointerId = null;
    this.vector = { x: 0, y: 0 };
    this.rawVector = { x: 0, y: 0 };
    
    // Return to default position
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    this.baseX = Math.min(width * 0.12, 100);
    this.baseY = height - Math.min(height * 0.20, 100);
    this.knobX = this.baseX;
    this.knobY = this.baseY;
  }

  public getMovementVector(): { x: number; y: number } {
    return this.vector;
  }

  public getRawVector(): { x: number; y: number } {
    return this.rawVector;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getState(): JoystickVector {
    const mag = Math.hypot(this.vector.x, this.vector.y);
    return {
      x: this.vector.x,
      y: this.vector.y,
      rawX: this.rawVector.x,
      rawY: this.rawVector.y,
      magnitude: mag,
      active: this.active,
    };
  }

  public destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointerout', this.handlePointerUp, this);
    this.scene.input.off('pointercancel', this.handlePointerUp, this);

    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    if (this.glowGraphics) {
      this.glowGraphics.destroy();
      this.glowGraphics = null;
    }
  }
}
