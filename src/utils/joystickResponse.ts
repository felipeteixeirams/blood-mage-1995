/**
 * Joystick response curve (spec 3.4)
 * Non-linear response: slow in the central 30% (precision zone),
 * fast in the outer 70%. Configurable deadzone (default 8%).
 */

export const DEFAULT_JOYSTICK_DEADZONE = 0.08;
export const DEFAULT_JOYSTICK_CURVE = 1.0;

export const MIN_JOYSTICK_CURVE = 0.5;
export const MAX_JOYSTICK_CURVE = 3.0;
export const MIN_JOYSTICK_DEADZONE = 0;
export const MAX_JOYSTICK_DEADZONE = 0.5;

export interface JoystickResponseConfig {
  deadzone?: number;
  curve?: number;
  sensitivity?: number;
}

/**
 * Applies deadzone + non-linear power curve to a normalized joystick vector.
 * Preserves direction; only the magnitude is transformed.
 * @param x normalized horizontal input in [-1, 1]
 * @param y normalized vertical input in [-1, 1]
 */
export function applyJoystickResponse(
  x: number,
  y: number,
  config: JoystickResponseConfig = {},
): { x: number; y: number } {
  const deadzone = clamp(config.deadzone ?? DEFAULT_JOYSTICK_DEADZONE, MIN_JOYSTICK_DEADZONE, MAX_JOYSTICK_DEADZONE);
  const curve = clamp(config.curve ?? DEFAULT_JOYSTICK_CURVE, MIN_JOYSTICK_CURVE, MAX_JOYSTICK_CURVE);
  const sensitivity = config.sensitivity ?? 1.0;

  const magnitude = Math.hypot(x, y);
  if (magnitude === 0) return { x: 0, y: 0 };

  // Deadzone: values below it snap to 0
  if (magnitude <= deadzone) return { x: 0, y: 0 };

  // Remap [deadzone, 1] -> [0, 1] then apply sensitivity and power curve
  const remapped = (magnitude - deadzone) / (1 - deadzone);
  const scaled = Math.min(1, remapped * sensitivity);
  const shaped = signPow(scaled, curve);

  const scale = shaped / magnitude;
  return { x: x * scale, y: y * scale };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** signed power: preserves sign, e.g. (-0.5)^1.8 -> -0.2987 */
function signPow(value: number, exponent: number): number {
  if (value === 0) return 0;
  return Math.sign(value) * Math.pow(Math.abs(value), exponent);
}
