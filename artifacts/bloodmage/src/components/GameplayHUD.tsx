import React, { useCallback } from 'react';
import { PlayerStatus } from './hud/PlayerStatus';
import { GameStats } from './hud/GameStats';
import { ActionButtons } from './hud/ActionButtons';
import { LootLog } from './hud/LootLog';
import { SkillsOverlay } from './hud/SkillsOverlay';
import { useFloatingJoystick } from '../hooks/useFloatingJoystick';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';
import type { FloatingJoystickState } from '../hooks/useFloatingJoystick';

interface GameplayHUDProps {
  getCooldownRemaining: (spellId: string) => number;
}

// ─── Floating joystick visual overlay ────────────────────────────────────────

const JoystickVisual: React.FC<{
  state: FloatingJoystickState;
  /** 'move' = left side tint, 'aim' = right side tint */
  variant: 'move' | 'aim';
  opacity: number;
}> = ({ state, variant, opacity }) => {
  if (!state.active || opacity === 0) return null;

  const ringColor =
    variant === 'move'
      ? 'border-red-900/70 bg-black/30'
      : 'border-red-700/70 bg-black/30';

  const knobColor =
    variant === 'move'
      ? 'from-red-800 to-red-950 border-red-500/80'
      : 'from-red-600 to-red-900 border-red-400/80';

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: state.originX,
        top: state.originY,
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        opacity,
        transition: 'opacity 0.2s ease',
      }}
    >
      {/* Base ring */}
      <div
        className={`w-28 h-28 rounded-full border-2 ${ringColor} backdrop-blur-sm flex items-center justify-center`}
      />
      {/* Knob */}
      <div
        className={`absolute top-1/2 left-1/2 w-11 h-11 rounded-full bg-gradient-to-br ${knobColor} border-2 shadow-lg`}
        style={{
          transform: `translate(calc(-50% + ${state.knobX}px), calc(-50% + ${state.knobY}px))`,
        }}
      />
    </div>
  );
};

// ─── Main HUD ────────────────────────────────────────────────────────────────

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  getCooldownRemaining,
}) => {
  const {
    playerStats: stats,
    setActiveSkillTrigger: onSkillClick,
    setTouchMoveInput: onMoveUpdate,
    setTouchAimInput: onAimUpdate,
    setGameState,
    isMuted,
    toggleMute: onToggleMute,
    settings,
  } = useGameStore();

  const {
    setInventoryOpen, setTalentsOpen,
  } = useGameStore();

  const onPauseToggle = useCallback(() => setGameState('paused'), [setGameState]);

  const moveJoystick = useFloatingJoystick(onMoveUpdate);
  const aimJoystick  = useFloatingJoystick(onAimUpdate);

  // Pending stat-point badge pulse
  const pendingPoints = stats.pendingStatPoints ?? 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none overflow-hidden">

      {/* ── Scanlines / vignette (cosmetic) ── */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] opacity-[0.10] mix-blend-overlay"
        style={{
          background:
            'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-2.5 md:p-4 pointer-events-auto">
        <PlayerStatus stats={stats} />

        <div className="flex flex-col items-center gap-1">
          <GameStats stats={stats} />
          <LootLog />
          {/* Pending stat points nudge — clicável em mobile */}
          {pendingPoints > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setTalentsOpen(true); }}
              className="mt-1 px-3 py-1 bg-amber-900/90 border border-amber-500 rounded-full
                         font-pixel text-[9px] text-amber-300 animate-pulse
                         shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-pointer hover:bg-amber-800/90
                         transition-colors"
            >
              ✨ {pendingPoints} ponto{pendingPoints > 1 ? 's' : ''} disponível — toque para gastar
            </button>
          )}
        </div>

        <ActionButtons
          isMuted={isMuted}
          onToggleMute={() => { soundEngine.playButtonClick(); onToggleMute(); }}
          onPauseToggle={() => { soundEngine.playButtonClick(); onPauseToggle(); }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOUCH ZONES — invisible but pointer-active.
          Left 47 % of screen → movement joystick.
          Right 47 % of screen → aim joystick.
          The 6 % gap in the centre prevents accidental swaps.
         ══════════════════════════════════════════════════════════ */}

      {/* MOVE zone (left) */}
      <div
        className="absolute left-0 bottom-0 touch-none"
        style={{ width: '47%', height: '65%' }}
        onPointerDown={moveJoystick.onPointerDown}
        onPointerMove={moveJoystick.onPointerMove}
        onPointerUp={moveJoystick.onPointerUp}
        onPointerCancel={moveJoystick.onPointerCancel}
      />

      {/* AIM zone (right) — behind skills so skill taps fire first */}
      <div
        className="absolute right-0 bottom-0 touch-none"
        style={{ width: '47%', height: '65%', zIndex: 10 }}
        onPointerDown={aimJoystick.onPointerDown}
        onPointerMove={aimJoystick.onPointerMove}
        onPointerUp={aimJoystick.onPointerUp}
        onPointerCancel={aimJoystick.onPointerCancel}
      />

      {/* ── SKILLS PANEL — bottom-right corner, above aim zone ── */}
      <div
        className="absolute bottom-5 right-4 md:bottom-6 md:right-6"
        style={{ zIndex: 20 }}
      >
        <SkillsOverlay
          stats={stats}
          getCooldownRemaining={getCooldownRemaining}
          onSkillClick={onSkillClick}
        />
      </div>

      {/* ── MOVE label (left-bottom, subtle) ── */}
      {!moveJoystick.state.active && (
        <div
          className="absolute left-4 bottom-5 pointer-events-none"
          style={{ opacity: settings.virtualControlsOpacity * 0.55 }}
        >
          <div className="w-16 h-16 rounded-full border border-dashed border-red-900/50 flex items-center justify-center">
            <span className="text-[8px] font-pixel text-gray-600">MOVER</span>
          </div>
        </div>
      )}

      {/* ── Floating joystick visuals ── */}
      <JoystickVisual
        state={moveJoystick.state}
        variant="move"
        opacity={settings.virtualControlsOpacity}
      />
      <JoystickVisual
        state={aimJoystick.state}
        variant="aim"
        opacity={settings.virtualControlsOpacity}
      />
    </div>
  );
};
