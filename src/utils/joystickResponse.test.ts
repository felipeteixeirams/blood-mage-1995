import { describe, it, expect } from 'vitest';
import {
  applyJoystickResponse,
  DEFAULT_JOYSTICK_CURVE,
  DEFAULT_JOYSTICK_DEADZONE,
} from './joystickResponse';

describe('applyJoystickResponse', () => {
  it('returns 0,0 for neutral input', () => {
    expect(applyJoystickResponse(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('snaps values below deadzone to 0', () => {
    const r = applyJoystickResponse(0.04, 0.04, { deadzone: 0.08 });
    expect(r).toEqual({ x: 0, y: 0 });
  });

  it('preserves full deflection at max input', () => {
    const r = applyJoystickResponse(1, 0);
    expect(r.x).toBeCloseTo(1, 5);
    expect(r.y).toBeCloseTo(0, 5);
  });

  it('produces a non-linear (sub-linear) response in the central zone', () => {
    // At 30% deflection with default curve 1.8, output must be lower than input
    const r = applyJoystickResponse(0.3, 0, { deadzone: 0.08 });
    expect(r.x).toBeLessThan(0.3);
    expect(r.x).toBeGreaterThan(0);
  });

  it('produces faster response in the outer zone', () => {
    // Compare slope: output delta from 0.7->0.9 vs 0.3->0.5 should be steeper outside
    const a = applyJoystickResponse(0.3, 0, { deadzone: 0.08 }).x;
    const b = applyJoystickResponse(0.5, 0, { deadzone: 0.08 }).x;
    const c = applyJoystickResponse(0.7, 0, { deadzone: 0.08 }).x;
    const d = applyJoystickResponse(0.9, 0, { deadzone: 0.08 }).x;
    const innerSlope = b - a;
    const outerSlope = d - c;
    expect(outerSlope).toBeGreaterThan(innerSlope);
  });

  it('preserves direction of input', () => {
    const r = applyJoystickResponse(-0.5, -0.5, { deadzone: 0.08 });
    expect(r.x).toBeLessThan(0);
    expect(r.y).toBeLessThan(0);
    expect(r.x).toBeCloseTo(r.y, 5);
  });

  it('curve of 1 behaves like a linear response after deadzone', () => {
    const r = applyJoystickResponse(0.54, 0, { deadzone: 0.08, curve: 1 });
    // (0.54 - 0.08) / 0.92 = 0.5 -> linear keeps 0.5
    expect(r.x).toBeCloseTo(0.5, 5);
  });

  it('higher curve exponent gives slower central response', () => {
    const soft = applyJoystickResponse(0.3, 0, { deadzone: 0.08, curve: 0.5 }).x;
    const hard = applyJoystickResponse(0.3, 0, { deadzone: 0.08, curve: 3.0 }).x;
    expect(soft).toBeGreaterThan(hard);
  });

  it('clamps out-of-range config values', () => {
    const r = applyJoystickResponse(1, 0, { deadzone: 2, curve: 99 });
    expect(r.x).toBeLessThanOrEqual(1);
    expect(r.x).toBeGreaterThan(0);
  });

  it('scales response according to sensitivity', () => {
    const normal = applyJoystickResponse(0.5, 0, { deadzone: 0.08, curve: 1.0, sensitivity: 1.0 }).x;
    const fast = applyJoystickResponse(0.5, 0, { deadzone: 0.08, curve: 1.0, sensitivity: 1.5 }).x;
    expect(fast).toBeGreaterThan(normal);
  });

  it('defaults match exported constants', () => {
    const r = applyJoystickResponse(0.3, 0);
    const r2 = applyJoystickResponse(0.3, 0, {
      deadzone: DEFAULT_JOYSTICK_DEADZONE,
      curve: DEFAULT_JOYSTICK_CURVE,
    });
    expect(r).toEqual(r2);
  });
});
