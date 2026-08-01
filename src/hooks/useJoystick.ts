import React, { useState, useRef } from 'react';

export const useJoystick = (
  onUpdate: (x: number, y: number) => void,
  resetOnEnd: boolean = true
) => {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);

  const updateJoystick = (touch: React.Touch, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 10 && active && resetOnEnd) {
      onUpdate(0, 0);
      setPos({ x: 0, y: 0 });
      return;
    }

    const normX = Math.min(1, Math.max(-1, dx / maxRadius));
    const normY = Math.min(1, Math.max(-1, dy / maxRadius));

    const renderX = dist > maxRadius ? (dx / dist) * maxRadius : dx;
    const renderY = dist > maxRadius ? (dy / dist) * maxRadius : dy;

    setPos({ x: renderX, y: renderY });
    onUpdate(normX, normY);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    setActive(true);
    updateJoystick(touch, e.currentTarget);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (touchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId.current) {
        updateJoystick(e.changedTouches[i], e.currentTarget);
        break;
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    touchId.current = null;
    setActive(false);
    if (resetOnEnd) {
      setPos({ x: 0, y: 0 });
      onUpdate(0, 0);
    }
  };

  return { active, pos, onTouchStart, onTouchMove, onTouchEnd };
};
