import React from 'react';
import { FloatingJoystickState } from '../../hooks/useFloatingJoystick';

interface JoystickVisualProps {
  state: FloatingJoystickState;
  variant?: 'move' | 'aim';
  opacity?: number;
}

export const JoystickVisual: React.FC<JoystickVisualProps> = ({
  state,
  variant = 'move',
  opacity = 0.85,
}) => {
  if (!state.active) return null;

  const isAim = variant === 'aim';
  const ringBorder = isAim ? 'border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-[#b8860b]/80 shadow-[0_0_20px_rgba(184,134,11,0.35)]';
  const knobGradient = isAim
    ? 'from-purple-500 via-purple-700 to-indigo-950 border-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.8)]'
    : 'from-red-500 via-rose-700 to-[#1f0909] border-[#e8c76a] shadow-[0_0_14px_rgba(225,29,72,0.8)]';

  const angleRad = Math.atan2(state.knobY, state.knobX);
  const angleDeg = (angleRad * 180) / Math.PI;
  const dist = Math.hypot(state.knobX, state.knobY);

  return (
    <div
      className="fixed pointer-events-none select-none z-50 transition-opacity duration-150"
      style={{
        left: `${state.originX}px`,
        top: `${state.originY}px`,
        opacity,
      }}
    >
      {/* Outer Gothic Ring Base */}
      <div
        className={`w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#0c0a09]/80 backdrop-blur-sm relative flex items-center justify-center ${ringBorder}`}
      >
        {/* Inner concentric ring */}
        <div className="w-20 h-20 rounded-full border border-dashed border-[#b8860b]/30 absolute inset-auto" />

        {/* Directional Cardinal Notches */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-[#e8c76a]/80 shadow-[0_0_4px_#000]" />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-2 bg-[#e8c76a]/80 shadow-[0_0_4px_#000]" />
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-1.5 bg-[#e8c76a]/80 shadow-[0_0_4px_#000]" />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-1.5 bg-[#e8c76a]/80 shadow-[0_0_4px_#000]" />

        {/* Dynamic Direction Indicator */}
        {dist > 12 && (
          <div
            className="absolute w-28 h-28 rounded-full pointer-events-none flex items-center justify-end"
            style={{
              transform: `rotate(${angleDeg}deg)`,
            }}
          >
            <div className="w-2.5 h-2.5 mr-1 bg-[#e8c76a] rotate-45 border border-black shadow-[0_0_6px_#b8860b]" />
          </div>
        )}
      </div>

      {/* Floating Thumb Knob */}
      <div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          transform: `translate(${state.knobX}px, ${state.knobY}px)`,
          transition: 'transform 0.04s ease-out',
        }}
      >
        <div
          className={`w-14 h-14 rounded-full bg-gradient-to-br border-2 flex items-center justify-center relative ${knobGradient}`}
        >
          {/* Beveled center rune mark */}
          <div className="w-6 h-6 rounded-full border border-black/50 bg-black/40 flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
            <div className="w-2 h-2 rotate-45 bg-[#e8c76a] shadow-[0_0_4px_#e8c76a]" />
          </div>
        </div>
      </div>
    </div>
  );
};
