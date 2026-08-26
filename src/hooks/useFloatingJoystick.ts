import { useState, useRef, useCallback } from 'react';
import {
  applyJoystickResponse,
  JoystickResponseConfig,
  DEFAULT_JOYSTICK_DEADZONE,
  DEFAULT_JOYSTICK_CURVE,
} from '../utils/joystickResponse';

/** Max visual displacement of the knob from the base */
const KNOB_RADIUS = 52;

/**
 * When the finger travels this far from the current base position,
 * the base "follows" the finger (Mobile Legends / Diablo Immortal behaviour).
 */
const FOLLOW_THRESHOLD = 62;

export interface FloatingJoystickState {
  active: boolean;
  /** Screen-space origin of the base ring (px) */
  originX: number;
  originY: number;
  /** Knob displacement relative to originX/Y (already clamped) */
  knobX: number;
  knobY: number;
}

const INITIAL_STATE: FloatingJoystickState = {
  active: false,
  originX: 0,
  originY: 0,
  knobX: 0,
  knobY: 0,
};

/**
 * Floating / dynamic joystick that spawns wherever the finger touches.
 * The base follows the finger when it moves past FOLLOW_THRESHOLD,
 * so the player never needs to reposition — they can slide their thumb
 * continuously across the zone.
 */
export const useFloatingJoystick = (
  onUpdate: (x: number, y: number) => void,
  responseConfig: JoystickResponseConfig = {},
) => {
  const [state, setState] = useState<FloatingJoystickState>(INITIAL_STATE);

  const baseX = useRef(0);
  const baseY = useRef(0);
  const activePointerId = useRef<number | null>(null);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const responseConfigRef = useRef(responseConfig);
  responseConfigRef.current = responseConfig;

  const applyPosition = useCallback(
    (clientX: number, clientY: number) => {
      let bx = baseX.current;
      let by = baseY.current;

      const dx = clientX - bx;
      const dy = clientY - by;
      const dist = Math.hypot(dx, dy);

      // Follow mode: slide base toward finger when it exceeds threshold
      if (dist > FOLLOW_THRESHOLD) {
        const excess = dist - FOLLOW_THRESHOLD;
        const nx = dx / dist;
        const ny = dy / dist;
        bx += nx * excess;
        by += ny * excess;
        baseX.current = bx;
        baseY.current = by;
      }

      // Knob clamped to radius
      const kdx = clientX - bx;
      const kdy = clientY - by;
      const kdist = Math.hypot(kdx, kdy);
      const knobX = kdist > KNOB_RADIUS ? (kdx / kdist) * KNOB_RADIUS : kdx;
      const knobY = kdist > KNOB_RADIUS ? (kdy / kdist) * KNOB_RADIUS : kdy;

      setState({
        active: true,
        originX: bx,
        originY: by,
        knobX,
        knobY,
      });

      const normX = knobX / KNOB_RADIUS;
      const normY = knobY / KNOB_RADIUS;

      // Apply configurable deadzone + non-linear response curve + sensitivity
      const shaped = applyJoystickResponse(normX, normY, responseConfigRef.current);
      onUpdateRef.current(shaped.x, shaped.y);
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== null) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {
        // ignore fallback
      }
      activePointerId.current = e.pointerId;
      baseX.current = e.clientX;
      baseY.current = e.clientY;
      applyPosition(e.clientX, e.clientY);
    },
    [applyPosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      applyPosition(e.clientX, e.clientY);
    },
    [applyPosition],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch (_) {
        // ignore
      }
      activePointerId.current = null;
      setState(INITIAL_STATE);
      onUpdateRef.current(0, 0);
    },
    [],
  );

  const onPointerCancel = onPointerUp;

  return { state, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
};
