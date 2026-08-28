import React, { useState, useRef } from 'react';
import {
  applyJoystickResponse,
  JoystickResponseConfig,
} from '../utils/joystickResponse';

export const useJoystick = (
  onUpdate: (x: number, y: number) => void,
  resetOnEnd: boolean = true,
  responseConfig: JoystickResponseConfig = {},
) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);

  const calculateAndApply = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 8 && resetOnEnd) {
      onUpdate(0, 0);
      setPos({ x: 0, y: 0 });
      return;
    }

    const normX = Math.min(1, Math.max(-1, dx / maxRadius));
    const normY = Math.min(1, Math.max(-1, dy / maxRadius));

    const renderX = dist > maxRadius ? (dx / dist) * maxRadius : dx;
    const renderY = dist > maxRadius ? (dy / dist) * maxRadius : dy;

    setPos({ x: renderX, y: renderY });

    // Apply configurable deadzone + non-linear response curve
    const shaped = applyJoystickResponse(normX, normY, responseConfig);
    onUpdate(shaped.x, shaped.y);
  };

  // Pointer Handlers (Works for Touch, Mouse, and Stylus)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(true);
    calculateAndApply(e.clientX, e.clientY, e.currentTarget);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    calculateAndApply(e.clientX, e.clientY, e.currentTarget);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    activePointerId.current = null;
    setActive(false);
    if (resetOnEnd) {
      setPos({ x: 0, y: 0 });
      onUpdate(0, 0);
    }
  };

  // Legacy Touch Handlers for backwards compatibility
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    setActive(true);
    calculateAndApply(touch.clientX, touch.clientY, e.currentTarget);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    if (touch) {
      calculateAndApply(touch.clientX, touch.clientY, e.currentTarget);
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    setActive(false);
    if (resetOnEnd) {
      setPos({ x: 0, y: 0 });
      onUpdate(0, 0);
    }
  };

  return {
    active,
    pos,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

