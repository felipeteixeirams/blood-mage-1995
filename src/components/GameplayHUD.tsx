import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStatus } from './hud/PlayerStatus';
import { GameStats } from './hud/GameStats';
import { ActionButtons } from './hud/ActionButtons';
import { LootLog } from './hud/LootLog';
import { SkillsOverlay } from './hud/SkillsOverlay';
import { TargetFrame } from './hud/TargetFrame';
import { ContractHUD } from './hud/ContractHUD';
import { Minimap } from './hud/Minimap';
import { RecordsDisplay } from './hud/RecordsDisplay';
import palettesData from '../data/palettes.json';
import { useFloatingJoystick } from '../hooks/useFloatingJoystick';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';
import type { FloatingJoystickState } from '../hooks/useFloatingJoystick';
import {
  Eye, EyeOff, Settings, X, Shield, Scroll, RefreshCw,
  MapPin, Backpack, Sparkles, Volume2, VolumeX, Pause, Play, LogOut, CheckSquare, Square, Skull
} from 'lucide-react';

interface GameplayHUDProps {
  getCooldownRemaining: (spellId: string) => number;
}

interface BloodSplatter {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

// ─── Floating joystick visual overlay ────────────────────────────────────────

const JoystickVisual: React.FC<{
  state: FloatingJoystickState;
  variant: 'move' | 'aim';
  opacity: number;
}> = ({ state, variant, opacity }) => {
  if (!state.active || opacity === 0) return null;

  const ringBg = "bg-gradient-to-br from-[#0c0a09]/95 to-[#1f1a17]/95";
  const ringBorder = variant === 'move' ? "border-[#dc2626]/80" : "border-[#7c3aed]/80";
  const knobBg = variant === 'move' ? "from-[#ef4444] to-[#7f1d1d]" : "from-[#c084fc] to-[#4c1d95]";
  const dist = Math.hypot(state.knobX, state.knobY);
  const angleDeg = (Math.atan2(state.knobY, state.knobX) * 180) / Math.PI;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: state.originX,
        top: state.originY,
        transform: 'translate(-50%, -50%)',
        zIndex: 200,
        opacity,
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Base ring with runic subdivided indicators */}
      <div className={`w-28 h-28 rounded-full border-4 ${ringBorder} ${ringBg} shadow-[0_0_20px_rgba(220,38,38,0.35)] flex items-center justify-center relative`}>
        {/* Cardinal Notches */}
        <div className="absolute top-1 w-1.5 h-3.5 bg-amber-400 rounded-sm shadow-sm" />
        <div className="absolute bottom-1 w-1.5 h-3.5 bg-amber-400 rounded-sm shadow-sm" />
        <div className="absolute left-1 w-3.5 h-1.5 bg-amber-400 rounded-sm shadow-sm" />
        <div className="absolute right-1 w-3.5 h-1.5 bg-amber-400 rounded-sm shadow-sm" />

        {/* Directional Chevron Pointer at outer edge */}
        {dist > 4 && (
          <div
            className="absolute w-full h-full pointer-events-none flex items-center justify-end"
            style={{
              transform: `rotate(${angleDeg}deg)`,
            }}
          >
            <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[11px] border-l-amber-400 drop-shadow-[0_0_6px_#f59e0b] translate-x-2" />
          </div>
        )}

        {/* Tether line */}
        {state.active && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="56" y1="56"
              x2={56 + state.knobX} y2={56 + state.knobY}
              stroke={variant === 'move' ? '#ef4444' : '#a855f7'}
              strokeWidth="2.5"
              strokeDasharray="4, 2"
            />
          </svg>
        )}
      </div>

      {/* Inner stone beveled thumbstick knob */}
      <div
        className={`absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${knobBg} border-2 border-[#fbbf24] shadow-[0_0_10px_rgba(0,0,0,0.9)] flex items-center justify-center`}
        style={{
          transform: `translate(calc(-50% + ${state.knobX}px), calc(-50% + ${state.knobY}px))`,
        }}
      >
        {/* Center runic gem with forward direction bead */}
        <div className="w-4 h-4 rounded-full bg-black/70 border border-amber-400/90 relative flex items-center justify-center">
          {dist > 4 && (
            <div
              className="w-1.5 h-1.5 rounded-full bg-amber-300 absolute"
              style={{
                transform: `rotate(${angleDeg}deg) translate(5px)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main HUD ────────────────────────────────────────────────────────────────

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  getCooldownRemaining,
}) => {
  const {
    playerStats: stats,
    setPlayerStats,
    setActiveSkillTrigger: onSkillClick,
    setTouchMoveInput: onMoveUpdate,
    setTouchAimInput: onAimUpdate,
    setGameState,
    isMuted,
    toggleMute: onToggleMute,
    settings,
    updateSettings,
    isInventoryOpen,
    setInventoryOpen,
    isEditingHUD,
    setEditingHUD,
    gamepadConnected,
    activeTip,
    setActiveTip,
    isRecordsOpen,
    setRecordsOpen,
    activeNPC,
    setActiveNPC,
    closestNPCType,
    setClosestNPCType,
    buyCurative,
    useCurative,
    bloodCrystals,
    addBloodCrystals,
    setStatusCondition,
  } = useGameStore();

  const [splatters, setSplatters] = useState<BloodSplatter[]>([]);
  const [exploredRatio, setExploredPercentage] = useState<number>(18); // Reveal map progress
  const [isQuickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [inventoryActiveTab, setInventoryActiveTab] = useState<'items' | 'scrolls'>('items');

  // Cooldown timers
  const [activeCooldowns, setCooldowns] = useState<Record<string, number>>({});

  // NOTA (2026-08-25): o modal de pausa local (isPauseOpen) foi removido — era
  // um segundo overlay de pausa duplicado do de App.tsx (gameState === 'paused'),
  // que agora é o único, já que <GameplayHUD> continua montado durante a pausa
  // (ver comentário em App.tsx). Os dois nunca deveriam coexistir; manter os
  // dois teria feito dois modais "JOGO PAUSADO" empilhados. handlePauseToggle
  // agora só seta o gameState — App.tsx cuida do resto.
  const handlePauseToggle = useCallback(() => {
    soundEngine.playButtonClick();
    setGameState('paused');
  }, [setGameState]);

  const moveJoystick = useFloatingJoystick((x, y) => {
    onMoveUpdate(x, y);
    if (x !== 0 || y !== 0) {
      // Reveal the golden paths gradually on joystick drag
      setExploredPercentage(prev => Math.min(100, prev + 0.05));
    }
  }, {
    deadzone: settings.joystickDeadzone,
    curve: settings.joystickCurve,
    sensitivity: settings.touchSensitivity,
  });

  const aimJoystick = useFloatingJoystick(onAimUpdate, {
    deadzone: settings.joystickDeadzone,
    curve: settings.joystickCurve,
    sensitivity: settings.touchSensitivity,
  });

  // Spawn pixelated blood splatters on screen tap
  const handleBackgroundTapRemoved = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // ignore clicks on actual buttons

    soundEngine.playGoreExplosion();
    const size = Math.floor(Math.random() * 26) + 16;
    const rotation = Math.floor(Math.random() * 360);
    const newSplatter: BloodSplatter = {
      id: `blood_${Date.now()}_${Math.random()}`,
      x: e.clientX,
      y: e.clientY,
      size,
      rotation,
    };

    setSplatters(prev => [...prev.slice(-24), newSplatter]); // Limit maximum active splatters to 25
  };

  const isTouchCapable =
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) ||
      (typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches));

  const showTouchControls =
    !gamepadConnected &&
    (settings.controlsMode === 'touch' ||
      (settings.controlsMode !== 'keyboard' && (isTouchCapable || settings.controlsMode === 'auto' || settings.controlsMode === undefined)));

  const isTouchDevice = isTouchCapable;

  // Cooldown management loop
  useEffect(() => {
    const timer = setInterval(() => {
      const updated: Record<string, number> = {};
      let changed = false;

      // Update values from Phaser remaining cooldowns
      ['hellfire_nova', 'bone_shield', 'syphon_soul', 'crimson_scythe', 'blood_ritual_circle', 'hemomancy_beam'].forEach(spellId => {
        const remaining = getCooldownRemaining(spellId);
        if (remaining > 0) {
          updated[spellId] = remaining;
          changed = true;
        }
      });

      if (changed || Object.keys(activeCooldowns).length > 0) {
        setCooldowns(updated);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [getCooldownRemaining, activeCooldowns]);

  // Skill click and dreno stats hook
  const handleSkillAction = (skillKey: 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam') => {
    let hpCost = 0;
    let manaCost = 0;

    switch(skillKey) {
      case 'nova': hpCost = 15; break;
      case 'bone_shield': manaCost = 20; break;
      case 'syphon': manaCost = 15; break;
      case 'crimson_scythe': hpCost = 10; break;
    }

    if (stats.hp <= hpCost && hpCost > 0) return;
    if (stats.mana < manaCost && manaCost > 0) return;

    // Drain and send back to game loop
    const nextHp = Math.max(1, stats.hp - hpCost);
    const nextMana = Math.max(0, stats.mana - manaCost);

    setPlayerStats({
      ...stats,
      hp: nextHp,
      mana: nextMana
    });

    onSkillClick(skillKey);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none overflow-hidden font-pixel">
      <TargetFrame />

      {/* ── Unconscious Tunnel Vision & Desaturation Overlay ── */}
      {stats.isUnconscious && (
        <div className="fixed inset-0 pointer-events-none z-[100] transition-all duration-700 animate-pulse">
          {/* Tunnel vision dark radial gradient border */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.95)_80%)]" />
          {/* Desaturation grayscale filter tint */}
          <div className="absolute inset-0 bg-red-950/20 backdrop-grayscale backdrop-contrast-125" />
          {/* Alert Badge Center-Top */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#0c0a09]/95 border-2 border-[#b8860b] px-4 py-2 shadow-[0_0_30px_rgba(184,134,11,0.8)] flex flex-col items-center animate-bounce">
            <span className="font-pixel text-[#e8c76a] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <Skull className="w-5 h-5 animate-spin" /> INCONSCIENTE ({stats.knockoutCount}/2)
            </span>
            <span className="font-retro text-[10px] text-gray-300 mt-0.5 uppercase">
              Regenerando HP... Agarre o sopro de vida para se levantar!
            </span>
          </div>
        </div>
      )}

      {/* ── Status Vignette Overlays (Poison Green, Bleeding Crimson, Infection Purple) ── */}
      {!stats.isUnconscious && (
        <>
          {stats.statusConditions?.poison && (
            <div className="fixed inset-0 pointer-events-none z-[80] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(34,197,94,0.35)_100%)] animate-pulse" />
          )}
          {stats.statusConditions?.bleeding && (
            <div className="fixed inset-0 pointer-events-none z-[80] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(239,68,68,0.3)_100%)] animate-pulse" />
          )}
          {stats.statusConditions?.infection && (
            <div className="fixed inset-0 pointer-events-none z-[80] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(168,85,247,0.3)_100%)] animate-pulse" />
          )}
        </>
      )}

      {/* ── Simulated Isometric Game Field and click area ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {/* Draw subtle grid background to represent top-down isometric environment */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at center, rgba(153, 0, 0, 0.15) 0%, transparent 70%),
              repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(91, 64, 60, 0.1) 40px, rgba(91, 64, 60, 0.1) 80px)`,
          }}
        />

        {/* Ambient oscillating light representing flicker of torches */}
        <div
          className={`absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-gradient-radial from-[#990000]/25 to-transparent pointer-events-none ${
            settings.animatedPortrait ? 'animate-pulse' : ''
          }`}
          style={{ animationDuration: '4s' }}
        />
        <div
          className={`absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-radial from-[#990000]/15 to-transparent pointer-events-none ${
            settings.animatedPortrait ? 'animate-pulse' : ''
          }`}
          style={{ animationDuration: '3s' }}
        />

        {/* Drifting dark atmospheric Fog of War mist clouds */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none mix-blend-multiply opacity-80"
        />
        <div
          className="absolute w-[200%] h-full top-0 left-0 bg-repeat-x pointer-events-none opacity-30 mix-blend-overlay animate-[drift_45s_linear_infinite]"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(24, 18, 17, 0.8) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* ── TOP LEFT HUD: Segmented HP/MP & Portrait ── */}
      <div className="absolute top-2 left-2 p-1 z-30 pointer-events-auto flex flex-col gap-1">
        <PlayerStatus stats={stats} />
        {(stats.statusConditions?.bleeding || stats.statusConditions?.poison || stats.statusConditions?.infection) && (
          <div className="flex gap-1 pl-0.5">
            {stats.statusConditions.bleeding && (
              <button
                onClick={() => useCurative('bandages')}
                disabled={(stats.curatives?.bandages || 0) < 1}
                className="flex items-center gap-1 bg-[#0c0a09]/95 border border-red-700 px-1 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Sangramento — drena HP ao se mover. Clique para usar Atadura."
              >
                <span className="text-[9px]">🩸</span>
                <span className="text-[7px] font-pixel text-red-300 uppercase font-bold">
                  SANGUE ({stats.curatives?.bandages || 0})
                </span>
              </button>
            )}
            {stats.statusConditions.poison && (
              <button
                onClick={() => useCurative('antidotes')}
                disabled={(stats.curatives?.antidotes || 0) < 1}
                className="flex items-center gap-1 bg-[#0c0a09]/95 border border-lime-700 px-1 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Envenenado — drena HP continuamente. Clique para usar Antídoto."
              >
                <span className="text-[9px]">🍇</span>
                <span className="text-[7px] font-pixel text-lime-300 uppercase font-bold">
                  VENENO ({stats.curatives?.antidotes || 0})
                </span>
              </button>
            )}
            {stats.statusConditions.infection && (
              <button
                onClick={() => useCurative('antibiotics')}
                disabled={(stats.curatives?.antibiotics || 0) < 1}
                className="flex items-center gap-1 bg-[#0c0a09]/95 border border-purple-700 px-1 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Infeccionado — reduz HP máximo e bloqueia regeneração. Clique para usar Antibiótico."
              >
                <span className="text-[9px]">🧪</span>
                <span className="text-[7px] font-pixel text-purple-300 uppercase font-bold">
                  INFECT ({stats.curatives?.antibiotics || 0})
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TOP CENTER: Area Banner & Time SURVIVED (Discreet Line-Style for Mobile First) ── */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[280px] md:max-w-[420px] w-full text-center">
        <GameStats stats={stats} />
      </div>

      {/* ── TOP RIGHT PANEL: Adaptive Minimap & Actions ── */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-30 pointer-events-auto">

        {/* Fase 2 de docs/archive/specs/propostas/09_HUD_REFERENCIAS_VISUAIS_DIABLO_DUNGEON_SIEGE.md */}
        <Minimap />

        {/* Compact action buttons row to clean the view for smartphones */}
        <div className="flex gap-1.5">
          {/* Trophy Button — Records Hall */}
          <button
            className="bg-[#0c0a09]/95 border border-[#b8860b]/50 p-1.5 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center w-8 h-8"
            onClick={() => { soundEngine.playButtonClick(); setRecordsOpen(true); setGameState('paused'); }}
            title="Recordes"
          >
            {/* Pixel-art trophy icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="13" width="12" height="1" fill="currentColor" />
              <rect x="7" y="9" width="2" height="4" fill="currentColor" />
              <rect x="4" y="5" width="8" height="4" fill="currentColor" opacity="0.8" />
              <rect x="2" y="6" width="2" height="3" fill="currentColor" opacity="0.6" />
              <rect x="12" y="6" width="2" height="3" fill="currentColor" opacity="0.6" />
            </svg>
          </button>

          <button
            className="bg-[#0c0a09]/95 border border-[#b8860b]/50 p-1.5 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center w-8 h-8"
            onClick={() => { soundEngine.playButtonClick(); setInventoryOpen(true); }}
            title="Inventário"
          >
            <Backpack size={14} />
          </button>

          <button
            className="bg-[#0c0a09]/95 border border-[#b8860b]/50 p-1.5 text-[#e8c76a] hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center w-8 h-8"
            onClick={() => { soundEngine.playButtonClick(); setQuickSettingsOpen(!isQuickSettingsOpen); }}
            title="Configurações Rápidas"
          >
            <Settings size={14} />
          </button>

          <button
            className="bg-[#0c0a09]/95 border border-[#b8860b]/50 p-1.5 text-white hover:bg-[#1c140e] shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center w-8 h-8"
            onClick={handlePauseToggle}
            title="Pausar"
          >
            <Pause size={14} />
          </button>
        </div>

        {/* Run contracts panel (Retractile / Compact) */}
        <ContractHUD />
      </div>

      {/* ── INVENTORY MODAL OVERLAY (Gothic Stone Slab Style) ── */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] shadow-[0_0_35px_rgba(0,0,0,0.95)] p-5 max-w-md w-full relative flex flex-col gap-3">
            {/* Cantoneiras douradas simuladas nos quatro cantos */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#b8860b]/30 pb-2.5">
              <div className="flex items-center gap-2">
                <Backpack className="text-[#e8c76a]" size={16} />
                <h3 className="font-pixel text-[#e8c76a] text-xs md:text-sm uppercase tracking-widest font-bold">TESOUROS DO SACRIFÍCIO</h3>
              </div>
              <button
                onClick={() => setInventoryOpen(false)}
                className="p-1 hover:bg-red-950/40 text-red-400 border border-red-900/40 w-8 h-8 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setInventoryActiveTab('items')}
                className={`flex-1 py-1.5 text-[9px] uppercase font-bold border transition ${
                  inventoryActiveTab === 'items'
                    ? 'bg-[#1e1713] text-[#e8c76a] border-[#b8860b]'
                    : 'bg-black/40 border-gray-900 text-gray-500 hover:text-gray-300'
                }`}
              >
                EQUIPAMENTO
              </button>
              <button
                onClick={() => setInventoryActiveTab('scrolls')}
                className={`flex-1 py-1.5 text-[9px] uppercase font-bold border transition ${
                  inventoryActiveTab === 'scrolls'
                    ? 'bg-[#1e1713] text-[#e8c76a] border-[#b8860b]'
                    : 'bg-black/40 border-gray-900 text-gray-500 hover:text-gray-300'
                }`}
              >
                PERGAMINHOS & ELIXIRES
              </button>
            </div>

            {/* Grid display */}
            {inventoryActiveTab === 'items' ? (
              <div className="grid grid-cols-4 gap-2 bg-[#120e0d]/80 p-2.5 border border-[#b8860b]/20">
                {/* Cajado de Osso */}
                <div className="aspect-square bg-[#0f0a09] border-2 border-[#b8860b] p-1.5 flex flex-col items-center justify-center relative group cursor-pointer hover:border-amber-400">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#e8c76a] fill-none stroke-current" strokeWidth="1.5">
                    <line x1="4" y1="20" x2="20" y2="4" />
                    <circle cx="20" cy="4" r="3" />
                    <path d="M 4,20 L 7,21 L 5,18 Z" fill="currentColor" />
                  </svg>
                  {/* Gold rare tag */}
                  <span className="absolute bottom-0 inset-x-0 bg-amber-600/90 text-[6px] text-center text-black font-bold uppercase font-sans">LENDÁRIO</span>
                </div>

                {/* Gema de Sangue */}
                <div className="aspect-square bg-[#0f0a09] border-2 border-red-800 p-1.5 flex flex-col items-center justify-center relative group cursor-pointer hover:border-red-400">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#ff3333] fill-current">
                    <polygon points="12,2 20,9 12,22 4,9" />
                  </svg>
                  <span className="absolute bottom-0 inset-x-0 bg-red-800/95 text-[6px] text-center text-white font-bold uppercase font-sans">SANGUÍNEO</span>
                </div>

                {/* Slots placeholders */}
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={`inv-slot-${idx}`} className="aspect-square bg-[#0c0a09]/80 border border-gray-900 flex items-center justify-center text-gray-700 font-bold">
                    +
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 bg-[#120e0d]/80 p-2.5 border border-[#b8860b]/20 max-h-48 overflow-y-auto">
                {/* Scroll item 1 */}
                <div className="flex gap-2.5 p-2 bg-[#0c0a09] border border-gray-900">
                  <Scroll className="text-[#e8c76a] w-6 h-6 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-[#e8c76a] uppercase font-bold">Pergaminho de Hemomancia</span>
                    <span className="text-[8px] text-gray-400 leading-tight">Casta instantaneamente a habilidade Blood Nova causando 250% de dano base sacrificando vitalidade.</span>
                  </div>
                </div>

                {/* Scroll item 2 */}
                <div className="flex gap-2.5 p-2 bg-[#0c0a09] border border-gray-900">
                  <Shield className="text-blue-400 w-6 h-6 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] text-blue-300 uppercase font-bold">Elixir de Almas</span>
                    <span className="text-[8px] text-gray-400 leading-tight">Restaura 50% de Mana instantaneamente e concede imunidade a fadiga por 10 segundos.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tooltip detail inside Inventory */}
            <div className="bg-[#120e0d] border border-gray-900 p-2.5 text-left">
              <span className="text-[9px] text-[#e8c76a] font-bold uppercase block">CAJADO DE OSSO (LENDÁRIO)</span>
              <span className="text-[8px] text-gray-400 block mt-0.5 leading-tight">Concedido pelas almas perdidas no Fosso das Chagas. Concede +15% de Dano de Sangue e reduz o custo de HP de suas magias em 20%.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK CONFIGURATIONS OVERLAY PANEL ── */}
      {isQuickSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] shadow-[0_0_35px_rgba(0,0,0,0.95)] p-5 max-w-sm w-full relative flex flex-col gap-2.5 text-left">
            {/* Cantoneiras */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

            <div className="flex justify-between items-center border-b-2 border-[#b8860b]/30 pb-2">
              <h3 className="font-pixel text-[#e8c76a] text-xs font-bold uppercase">AJUSTES RÁPIDOS</h3>
              <button onClick={() => setQuickSettingsOpen(false)} className="p-1 hover:bg-red-950/40 text-red-400 border border-red-900/40">
                <X size={12} />
              </button>
            </div>

            {/* Toggle Retrato Animado */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">RETRATO ANIMADO (MOBILE FX)</span>
              <button
                onClick={() => updateSettings({ ...settings, animatedPortrait: !settings.animatedPortrait })}
                className="text-[#e8c76a]"
              >
                {settings.animatedPortrait ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* Toggle CRT Filter */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">SCANLINES FILTRO CRT</span>
              <button
                onClick={() => updateSettings({ ...settings, crtFilter: !settings.crtFilter })}
                className="text-[#e8c76a]"
              >
                {settings.crtFilter ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* Toggle Screen Shake */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">TREMOR DE TELA</span>
              <button
                onClick={() => updateSettings({ ...settings, screenShakeEnabled: !settings.screenShakeEnabled })}
                className="text-[#e8c76a]"
              >
                {settings.screenShakeEnabled !== false ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* Toggle Flashes */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">FLASHES DE DANO</span>
              <button
                onClick={() => updateSettings({ ...settings, flashesEnabled: !settings.flashesEnabled })}
                className="text-[#e8c76a]"
              >
                {settings.flashesEnabled !== false ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* Toggle Atmosphere Effects */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">EFEITOS DE ATMOSFERA</span>
              <button
                onClick={() => updateSettings({ ...settings, atmosphereEffectsEnabled: !settings.atmosphereEffectsEnabled })}
                className="text-[#e8c76a]"
              >
                {settings.atmosphereEffectsEnabled !== false ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* Toggle High Contrast Texts */}
            <div className="flex items-center justify-between py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">DANOS ALTO CONTRASTE</span>
              <button
                onClick={() => updateSettings({ ...settings, highContrastDamageTexts: !settings.highContrastDamageTexts })}
                className="text-[#e8c76a]"
              >
                {settings.highContrastDamageTexts ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            </div>

            {/* HUD Edit Button */}
            <div className="flex items-center justify-between py-1.5 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">LAYOUT DE BOTÕES</span>
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setQuickSettingsOpen(false); // Close quick settings
                  setEditingHUD(true); // Open edit mode
                }}
                className="px-2 py-0.5 bg-[#171309] border border-[#b8860b] text-[#e8c76a] hover:bg-[#282216] text-[8px] uppercase tracking-wide cursor-pointer"
              >
                EDITAR
              </button>
            </div>

            {/* Cosmetic Palettes */}
            <div className="flex flex-col gap-1 py-1 border-b border-gray-900">
              <span className="text-[9px] text-gray-300 uppercase">PALETA DE SANGUE</span>
              <div className="grid grid-cols-4 gap-1 mt-1 text-[7px] text-center font-bold">
                {palettesData.map((p) => {
                  const active = settings.activePaletteId === p.id || (!settings.activePaletteId && p.id === 'crimson');
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        soundEngine.playButtonClick();
                        updateSettings({
                          ...settings,
                          activePaletteId: p.id
                        });
                        // Comando tipado via store — ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md
                        useGameStore.getState().bumpCosmeticTint();
                      }}
                      className={`py-0.5 border transition cursor-pointer ${
                        active
                          ? 'border-[#b8860b] text-[#e8c76a] bg-[#1e1713]'
                          : 'border-gray-900 text-gray-500 bg-black/40 hover:border-gray-700'
                      }`}
                      style={{ color: p.color !== '#ffffff' ? p.color : undefined }}
                    >
                      {p.name.replace('Sangue ', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Virtual Controls HUD Opacity Slider */}
            <div className="flex flex-col gap-1 py-1">
              <div className="flex justify-between text-[9px] text-gray-300">
                <span>OPACIDADE CONTROLES HUD</span>
                <span className="text-[#e8c76a] font-bold">{Math.round(settings.virtualControlsOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={settings.virtualControlsOpacity}
                onChange={(e) => updateSettings({ ...settings, virtualControlsOpacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-black accent-[#b8860b] rounded-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setQuickSettingsOpen(false)}
              className="w-full mt-1.5 py-1.5 bg-[#171309] hover:bg-[#282216] border border-[#b8860b] text-[#e8c76a] text-[9px] uppercase font-bold transition shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]"
            >
              FECHAR CONFIGS
            </button>
          </div>
        </div>
      )}

      {/* Modal de pausa: removido daqui (era duplicado de App.tsx). Ver nota
          em handlePauseToggle acima e o comentário em App.tsx sobre o bug
          de destruição do Phaser.Game ao pausar. */}

      {/* ══════════════════════════════════════════════════════════
          TOUCH & SKILLS OVERLAY — Native Phaser Joystick on Canvas + Skills Panel
         ══════════════════════════════════════════════════════════ */}

      {/* ── Onboarding / Tutorial Tip Overlay ── */}
      {activeTip && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[110] max-w-sm w-full bg-[#0c0a09]/95 border-2 border-[#b8860b] shadow-[0_0_15px_rgba(184,134,11,0.3)] p-3 text-center pointer-events-auto rounded-none">
          <span className="text-[#e8c76a] font-bold uppercase text-[9px] block tracking-wider mb-1">📖 APRENDA O RITUAL</span>
          <span className="text-[8px] text-gray-200 block leading-normal font-sans">
            {activeTip}
          </span>
          <button
            onClick={() => setActiveTip(null)}
            className="absolute top-1.5 right-1.5 text-[8px] text-gray-500 hover:text-red-400 cursor-pointer w-4 h-4 flex items-center justify-center font-sans text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* ── SKILLS PANEL — bottom-right corner ── */}
      <div
        className="absolute bottom-5 right-4 md:bottom-6 md:right-6 pointer-events-auto"
        style={{ zIndex: 25, opacity: settings.virtualControlsOpacity }}
      >
        <SkillsOverlay
          stats={stats}
          getCooldownRemaining={getCooldownRemaining}
          onSkillClick={handleSkillAction}
        />
      </div>

      {/* ── Native Canvas Joystick hint label ── */}
      {showTouchControls && (
        <div
          className="absolute left-6 bottom-6 pointer-events-none select-none"
          style={{ opacity: settings.virtualControlsOpacity * 0.45, zIndex: 16 }}
        >
          <div className="w-14 h-14 rounded-full border border-dashed border-[#b8860b]/40 flex items-center justify-center animate-pulse">
            <span className="text-[7px] font-pixel text-gray-400 uppercase tracking-widest">MOVER</span>
          </div>
        </div>
      )}

      {/* ── HUD Edit Mode Banner ── */}
      {isEditingHUD && (
        <div className="fixed top-20 inset-x-0 mx-auto max-w-lg bg-[#0c0a09] border-4 border-[#b8860b] shadow-[0_0_20px_rgba(0,0,0,0.9)] p-4 text-center z-50 flex flex-col gap-2 text-[#E3DAC9] font-pixel text-xs pointer-events-auto">
          <span className="text-[#e8c76a] font-bold uppercase tracking-widest block">✍️ MODO DE EDIÇÃO DE HUD</span>
          <span className="text-[9px] text-gray-400 block font-sans leading-normal">
            Arraste os botões de skill para qualquer posição da tela. Clique nos botões S/M/L sobre cada habilidade para mudar o tamanho dos botões.
          </span>
          <div className="flex gap-2.5 justify-center mt-1">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setEditingHUD(false);
              }}
              className="px-4 py-2 bg-emerald-950 border border-emerald-500 text-emerald-100 uppercase hover:bg-emerald-800 text-[9px] cursor-pointer"
            >
              SALVAR LAYOUT
            </button>
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                updateSettings({
                  ...settings,
                  hudLayout: undefined
                });
              }}
              className="px-4 py-2 bg-black border border-gray-650 text-gray-300 uppercase hover:bg-gray-900 text-[9px] cursor-pointer"
            >
              RESTAURAR PADRÃO
            </button>
          </div>
        </div>
      )}

      {/* ── NPC Interaction Prompt ── */}
      {closestNPCType && !activeNPC && (
        <div className="fixed bottom-1/4 inset-x-0 mx-auto max-w-xs bg-[#0c0a09] border-2 border-[#b8860b]/40 shadow-[4px_4px_10px_rgba(0,0,0,0.85)] p-2.5 text-center z-40 flex flex-col items-center gap-1.5 text-[#E3DAC9] pointer-events-auto select-none">
          <span className="text-[#e8c76a] text-xs font-bold uppercase tracking-wider block">
            👤 {closestNPCType === 'cleric' ? 'CLÉRIGO' : closestNPCType === 'alchemist' ? 'ALQUIMISTA' : closestNPCType === 'blacksmith' ? 'FERREIRO' : 'ANCIÃO'} ESTÁ PRÓXIMO
          </span>
          <span className="text-[9px] text-gray-400 font-sans block leading-none uppercase">
            Aproxime-se e pressione <span className="text-[#e8c76a] font-bold">[E]</span> para falar.
          </span>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playButtonClick();
              setActiveNPC(closestNPCType);
            }}
            className="mt-1 px-3 py-1.5 bg-[#171309] border border-[#b8860b] text-[#e8c76a] hover:bg-[#282216] active:scale-95 text-[9px] font-bold uppercase cursor-pointer shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]"
          >
            FALAR COM NPC
          </button>
        </div>
      )}

      {/* ── NPC Dialogue Modal ── */}
      {activeNPC && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-5 max-w-md w-full text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative">
            {/* Cantoneiras */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[#b8860b]/30 pb-2.5 mb-3">
              <span className="text-xs font-pixel text-[#e8c76a] uppercase font-bold tracking-wider">
                {activeNPC === 'cleric' ? 'Clérigo Curandeiro' : activeNPC === 'alchemist' ? 'Alquimista de Fronteira' : activeNPC === 'blacksmith' ? 'Ferreiro Necromântico' : 'Ancião da Vila'}
              </span>
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setActiveNPC(null);
                }}
                className="p-1 hover:bg-red-950/40 text-red-400 border border-red-900/40 w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Content / Dialog Text */}
            <p className="text-[10px] font-gothic leading-relaxed mb-4 italic border-l-2 border-[#b8860b] pl-2.5 py-1 text-gray-300 text-left">
              {activeNPC === 'cleric' && '"Que a benção do Sangue Purificador te guarde, Mestre do Sangue. Deseja curar suas chagas ou purificar a infecção?"'}
              {activeNPC === 'alchemist' && '"Frascos, elixires e ataduras para aplacar os males do abismo... Que desejas comprar, Bloodmage?"'}
              {activeNPC === 'blacksmith' && '"O metal clama por sacrifício. Posso aprimorar sua foice ou sua couraça de ossos em troca de cristais de sangue."'}
              {activeNPC === 'elder' && '"Nossas paliçadas resistem sob as sombras, mas os monstros lá fora estão cada vez mais agressivos. Se puderes deter o Mini-Chefe das Catacumbas, nosso caminho estará livre para avançar..."'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 font-pixel text-[9px]">

              {/* Cleric actions */}
              {activeNPC === 'cleric' && (
                <>
                  <button
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setPlayerStats({
                        ...stats,
                        hp: stats.maxHp,
                        mana: stats.maxMana
                      });
                      soundEngine.playNova();
                    }}
                    className="w-full text-left p-2 bg-[#171309] border border-[#b8860b] hover:bg-[#282216] uppercase font-bold cursor-pointer text-[#e8c76a]"
                  >
                    💖 Restaurar HP & Mana (Gratuito)
                  </button>
                  <button
                    disabled={!stats.statusConditions?.infection || bloodCrystals < 15}
                    onClick={() => {
                      soundEngine.playButtonClick();
                      addBloodCrystals(-15);
                      setStatusCondition('infection', false);
                      soundEngine.playNova();
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      stats.statusConditions?.infection && bloodCrystals >= 15
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🧪 Purificar Infecção (Custo: 15 Cristais)
                  </button>
                </>
              )}

              {/* Alchemist actions */}
              {activeNPC === 'alchemist' && (
                <>
                  <button
                    disabled={bloodCrystals < 15}
                    onClick={() => {
                      buyCurative('bandages', 15);
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 15
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🩸 Comprar Atadura (Sangramento) - 15 Cristais [Possui: {stats.curatives?.bandages || 0}]
                  </button>
                  <button
                    disabled={bloodCrystals < 20}
                    onClick={() => {
                      buyCurative('antidotes', 20);
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 20
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🍇 Comprar Antídoto (Veneno) - 20 Cristais [Possui: {stats.curatives?.antidotes || 0}]
                  </button>
                  <button
                    disabled={bloodCrystals < 35}
                    onClick={() => {
                      buyCurative('antibiotics', 35);
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 35
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🧪 Comprar Antibiótico (Infecção) - 35 Cristais [Possui: {stats.curatives?.antibiotics || 0}]
                  </button>
                </>
              )}

              {/* Blacksmith actions */}
              {activeNPC === 'blacksmith' && (
                <>
                  <button
                    disabled={bloodCrystals < 50}
                    onClick={() => {
                      if (bloodCrystals >= 50) {
                        soundEngine.playButtonClick();
                        addBloodCrystals(-50);
                        setPlayerStats({
                          ...stats,
                          damageMultiplier: stats.damageMultiplier + 0.10
                        });
                        soundEngine.playEquipLoot();
                      }
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 50
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ⚔️ Upgrade de Arma (+10% Dano) - 50 Cristais [Atual: +{Math.round((stats.damageMultiplier - 1)*100)}%]
                  </button>
                  <button
                    disabled={bloodCrystals < 50}
                    onClick={() => {
                      if (bloodCrystals >= 50) {
                        soundEngine.playButtonClick();
                        addBloodCrystals(-50);
                        setPlayerStats({
                          ...stats,
                          maxHp: stats.maxHp + 20,
                          hp: stats.hp + 20
                        });
                        soundEngine.playEquipLoot();
                      }
                    }}
                    className={`w-full text-left p-2 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 50
                        ? 'bg-[#1e1713] border-[#b8860b] hover:brightness-125 text-[#e8c76a] cursor-pointer'
                        : 'bg-black/30 border-gray-900 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🛡️ Upgrade de Armadura (+20 HP Máx) - 50 Cristais [Atual: {stats.maxHp} HP]
                  </button>
                </>
              )}

              {/* Elder actions */}
              {activeNPC === 'elder' && (
                <button
                  onClick={() => {
                    soundEngine.playButtonClick();
                    addBloodCrystals(100);
                    soundEngine.playNova();
                    setActiveNPC(null);
                  }}
                  className="w-full text-left p-2 bg-[#171309] border border-[#b8860b] hover:bg-[#282216] text-[#e8c76a] font-bold uppercase cursor-pointer"
                >
                  📜 Aceitar Clamor de Auxílio (+100 Cristais)
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setActiveNPC(null);
                }}
                className="w-full text-center p-2 bg-black border border-gray-900 text-gray-500 uppercase font-bold hover:bg-gray-950 cursor-pointer"
              >
                ENCERRAR DIÁLOGO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Modal */}
      <RecordsDisplay
        isOpen={isRecordsOpen}
        onClose={() => setRecordsOpen(false)}
      />
    </div>
  );
};
