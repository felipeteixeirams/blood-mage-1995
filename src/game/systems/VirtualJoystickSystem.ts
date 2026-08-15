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
      this.graphics.setDepth(9999);
    }

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
    if (!this.graphics) return;

    // Smooth alpha transition
    this.targetAlpha = this.active ? this.opacity : 0;
    const lerpSpeed = this.active ? 0.25 : 0.15;
    this.currentAlpha = Phaser.Math.Linear(this.currentAlpha, this.targetAlpha, Math.min(1, lerpSpeed * (delta / 16.6)));

    this.graphics.clear();

    if (this.currentAlpha > 0.01) {
      this.renderJoystick(this.graphics, this.currentAlpha);
    }
  }

  private renderJoystick(g: Phaser.GameObjects.Graphics, alpha: number): void {
    const bx = this.baseX;
    const by = this.baseY;
    const kx = this.knobX;
    const ky = this.knobY;

    // 1. Base Outer Dark Disc
    g.fillStyle(0x0a0508, alpha * 0.45);
    g.fillCircle(bx, by, this.baseRadius);

    // 2. Base Outer Gold Ring
    g.lineStyle(2, 0xb8860b, alpha * 0.75);
    g.strokeCircle(bx, by, this.baseRadius);

    // 3. Inner Ruby Guide Ring
    g.lineStyle(1.5, 0x881337, alpha * 0.5);
    g.strokeCircle(bx, by, this.maxRadius);

    // 4. Directional Cardinal Notches (N, S, E, W)
    const notchLen = 6;
    g.lineStyle(1.5, 0xd4af37, alpha * 0.6);
    // Up
    g.lineBetween(bx, by - this.baseRadius + 2, bx, by - this.baseRadius + notchLen + 2);
    // Down
    g.lineBetween(bx, by + this.baseRadius - 2, bx, by + this.baseRadius - notchLen - 2);
    // Left
    g.lineBetween(bx - this.baseRadius + 2, by, bx - this.baseRadius + notchLen + 2, by);
    // Right
    g.lineBetween(bx + this.baseRadius - 2, by, bx + this.baseRadius - notchLen - 2, by);

    // 5. Connecting tether line between Base & Knob
    g.lineStyle(2, 0xdc2626, alpha * 0.35);
    g.lineBetween(bx, by, kx, ky);

    // 6. Knob Outer Body (Dark Crimson Ruby)
    const knobRadius = 22;
    g.fillStyle(0x450a0a, alpha * 0.9);
    g.fillCircle(kx, ky, knobRadius);

    // 7. Knob Golden Border
    g.lineStyle(2, 0xd4af37, alpha * 0.85);
    g.strokeCircle(kx, ky, knobRadius);

    // 8. Knob Inner Glowing Core
    g.fillStyle(0xef4444, alpha * 0.95);
    g.fillCircle(kx, ky, knobRadius * 0.55);

    // 9. Knob Specular Gem Highlight
    g.fillStyle(0xffffff, alpha * 0.8);
    g.fillCircle(kx - 4, ky - 4, 3);
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
  }
}
