import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStatus } from './hud/PlayerStatus';
import { GameStats } from './hud/GameStats';
import { ActionButtons } from './hud/ActionButtons';
import { LootLog } from './hud/LootLog';
import { SkillsOverlay } from './hud/SkillsOverlay';
import { ContractHUD } from './hud/ContractHUD';
import { RecordsDisplay } from './hud/RecordsDisplay';
import palettesData from '../data/palettes.json';
import { useFloatingJoystick } from '../hooks/useFloatingJoystick';
import { soundEngine } from '../utils/soundEngine';
import { useGameStore } from '../store/gameStore';
import type { FloatingJoystickState } from '../hooks/useFloatingJoystick';
import {
  Eye, EyeOff, Settings, X, Shield, Scroll, RefreshCw,
  MapPin, Backpack, Sparkles, Volume2, VolumeX, Pause, Play, LogOut, CheckSquare, Square
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

  const ringBg = "bg-gradient-to-br from-[#120d0c]/90 to-[#241e1d]/90";
  const ringBorder = variant === 'move' ? "border-[#990000]/70" : "border-[#5a189a]/70";
  const knobBg = variant === 'move' ? "from-[#ff3333] to-[#660000]" : "from-[#b388ff] to-[#3c096c]";

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
      <div className={`w-28 h-28 rounded-full border-4 ${ringBorder} ${ringBg} shadow-[0_0_15px_rgba(0,0,0,0.85)] flex items-center justify-center relative`}>
        {/* Draw simple crosshair runes */}
        <div className="absolute top-1 w-1 h-3 bg-amber-600/50" />
        <div className="absolute bottom-1 w-1 h-3 bg-amber-600/50" />
        <div className="absolute left-1 w-3 h-1 bg-amber-600/50" />
        <div className="absolute right-1 w-3 h-1 bg-amber-600/50" />

        {/* Tether lines */}
        {state.active && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="56" y1="56"
              x2={56 + state.knobX} y2={56 + state.knobY}
              stroke="#990000" strokeWidth="2" strokeDasharray="3, 2"
            />
          </svg>
        )}
      </div>

      {/* Inner stone beveled thumbstick knob */}
      <div
        className={`absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-gradient-to-br ${knobBg} border-2 border-[#e8c76a] shadow-[2px_2px_4px_#000000] flex items-center justify-center`}
        style={{
          transform: `translate(calc(-50% + ${state.knobX}px), calc(-50% + ${state.knobY}px))`,
        }}
      >
        {/* Center runic gem */}
        <div className="w-4 h-4 rounded-full bg-black/60 border border-amber-600/80" />
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
  const [isPauseOpen, setPauseOpen] = useState(false);
  const [inventoryActiveTab, setInventoryActiveTab] = useState<'items' | 'scrolls'>('items');

  // Cooldown timers
  const [activeCooldowns, setCooldowns] = useState<Record<string, number>>({});

  const handlePauseToggle = useCallback(() => {
    soundEngine.playButtonClick();
    setPauseOpen(true);
    setGameState('paused');
  }, [setGameState]);

  const handleResume = useCallback(() => {
    soundEngine.playButtonClick();
    setPauseOpen(false);
    setGameState('playing');
  }, [setGameState]);

  const moveJoystick = useFloatingJoystick((x, y) => {
    onMoveUpdate(x, y);
    if (x !== 0 || y !== 0) {
      // Reveal the golden paths gradually on joystick drag
      setExploredPercentage(prev => Math.min(100, prev + 0.05));
    }
  });

  const aimJoystick = useFloatingJoystick(onAimUpdate);

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

  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

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
      <div className="absolute top-3 left-3 p-1 z-30 pointer-events-auto flex flex-col gap-1.5">
        <PlayerStatus stats={stats} />
        {(stats.statusConditions?.bleeding || stats.statusConditions?.poison || stats.statusConditions?.infection) && (
          <div className="flex gap-1.5 pl-0.5">
            {stats.statusConditions.bleeding && (
              <button
                onClick={() => useCurative('bandages')}
                disabled={(stats.curatives?.bandages || 0) < 1}
                className="flex items-center gap-1 bg-[#181211]/95 border border-red-700 px-1.5 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Sangramento — drena HP ao se mover. Clique para usar Atadura."
              >
                <span className="text-[10px]">🩸</span>
                <span className="text-[8px] font-pixel text-red-300 uppercase font-bold">
                  Sangrando ({stats.curatives?.bandages || 0})
                </span>
              </button>
            )}
            {stats.statusConditions.poison && (
              <button
                onClick={() => useCurative('antidotes')}
                disabled={(stats.curatives?.antidotes || 0) < 1}
                className="flex items-center gap-1 bg-[#181211]/95 border border-lime-700 px-1.5 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Envenenado — drena HP continuamente. Clique para usar Antídoto."
              >
                <span className="text-[10px]">🍇</span>
                <span className="text-[8px] font-pixel text-lime-300 uppercase font-bold">
                  Envenenado ({stats.curatives?.antidotes || 0})
                </span>
              </button>
            )}
            {stats.statusConditions.infection && (
              <button
                onClick={() => useCurative('antibiotics')}
                disabled={(stats.curatives?.antibiotics || 0) < 1}
                className="flex items-center gap-1 bg-[#181211]/95 border border-purple-700 px-1.5 py-0.5 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                title="Infeccionado — reduz HP máximo e bloqueia regeneração. Clique para usar Antibiótico."
              >
                <span className="text-[10px]">🧪</span>
                <span className="text-[8px] font-pixel text-purple-300 uppercase font-bold">
                  Infeccionado ({stats.curatives?.antibiotics || 0})
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TOP CENTER: Area Banner & Time SURVIVED ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[280px] md:max-w-[420px] w-full text-center">
        <GameStats stats={stats} />
      </div>

      {/* ── TOP RIGHT PANEL: Adaptive Minimap & Actions ── */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2.5 z-30 pointer-events-auto">

        {/* Trophy Button — Records Hall */}
        <button
          className="bg-[#181211]/95 border-2 border-[#e8c76a] p-2 text-[#e8c76a] hover:bg-[#2f2827] hover:border-[#ffdf9a] shadow-[2px_2px_0px_#000000] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
          onClick={() => { soundEngine.playButtonClick(); setPauseOpen(true); setRecordsOpen(true); setGameState('paused'); }}
          
        >
          {/* Pixel-art trophy icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base */}
            <rect x="2" y="13" width="12" height="1" fill="currentColor" />
            {/* Stem */}
            <rect x="7" y="9" width="2" height="4" fill="currentColor" />
            {/* Cup body */}
            <rect x="4" y="5" width="8" height="4" fill="currentColor" opacity="0.8" />
            {/* Cup shine */}
            <rect x="5" y="6" width="1" height="2" fill="currentColor" opacity="0.4" />
            {/* Left handle */}
            <rect x="2" y="6" width="2" height="3" fill="currentColor" opacity="0.6" />
            {/* Right handle */}
            <rect x="12" y="6" width="2" height="3" fill="currentColor" opacity="0.6" />
          </svg>
        </button>

        {/* Quick action buttons column */}
        <div className="flex gap-2">
          <button
            className="bg-[#181211]/95 border-2 border-[#ab8983] p-2 text-[#e8c76a] hover:bg-[#2f2827] shadow-[2px_2px_0px_#000000] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
            onClick={() => { soundEngine.playButtonClick(); setInventoryOpen(true); }}
            
          >
            <Backpack size={16} />
          </button>

          <button
            className="bg-[#181211]/95 border-2 border-[#ab8983] p-2 text-[#e8c76a] hover:bg-[#2f2827] shadow-[2px_2px_0px_#000000] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
            onClick={() => { soundEngine.playButtonClick(); setQuickSettingsOpen(!isQuickSettingsOpen); }}
            
          >
            <Settings size={16} />
          </button>

          <button
            className="bg-[#181211]/95 border-2 border-[#ab8983] p-2 text-white hover:bg-[#2f2827] shadow-[2px_2px_0px_#000000] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center"
            onClick={handlePauseToggle}
            
          >
            <Pause size={16} />
          </button>
        </div>

        {/* Run contracts panel */}
        <ContractHUD />
      </div>

      {/* ── INVENTORY MODAL OVERLAY (Gothic Stone Slab) ── */}
      {isInventoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#181211] border-4 border-[#5b403c] shadow-[8px_8px_0px_#000000] p-4 max-w-md w-full relative flex flex-col gap-3">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#ab8983] pb-2">
              <div className="flex items-center gap-2">
                <Backpack className="text-[#e8c76a]" size={18} />
                <h3 className="font-pixel text-[#e8c76a] text-sm md:text-base uppercase tracking-wider">TESOUROS DO SACRIFÍCIO</h3>
              </div>
              <button
                onClick={() => setInventoryOpen(false)}
                className="p-1 hover:bg-[#2f2827] text-[#ab8983] hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1">
              <button
                onClick={() => setInventoryActiveTab('items')}
                className={`flex-1 py-1.5 text-[10px] uppercase font-bold border border-[#5b403c] transition ${
                  inventoryActiveTab === 'items' ? 'bg-[#990000] text-white' : 'bg-black/40 text-gray-500 hover:bg-[#241e1d]'
                }`}
              >
                EQUIPAMENTO
              </button>
              <button
                onClick={() => setInventoryActiveTab('scrolls')}
                className={`flex-1 py-1.5 text-[10px] uppercase font-bold border border-[#5b403c] transition ${
                  inventoryActiveTab === 'scrolls' ? 'bg-[#990000] text-white' : 'bg-black/40 text-gray-500 hover:bg-[#241e1d]'
                }`}
              >
                PERGAMINHOS e ELIXIRES
              </button>
            </div>

            {/* Grid display */}
            {inventoryActiveTab === 'items' ? (
              <div className="grid grid-cols-4 gap-2 bg-[#110e05]/60 p-2.5 border border-[#524341]">
                {/* Cajado de Osso */}
                <div className="aspect-square bg-gradient-to-b from-[#241e1d] to-black border-2 border-[#b8860b] p-1.5 flex flex-col items-center justify-center relative group cursor-pointer hover:border-amber-400">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#e8c76a] fill-none stroke-current" strokeWidth="1.5">
                    <line x1="4" y1="20" x2="20" y2="4" />
                    <circle cx="20" cy="4" r="3" />
                    <path d="M 4,20 L 7,21 L 5,18 Z" fill="currentColor" />
                  </svg>
                  {/* Gold rare tag */}
                  <span className="absolute bottom-0 inset-x-0 bg-amber-600/90 text-[6px] text-center text-black font-bold uppercase font-sans">RARIDADE</span>
                </div>

                {/* Gema de Sangue */}
                <div className="aspect-square bg-gradient-to-b from-[#241e1d] to-black border-2 border-red-800 p-1.5 flex flex-col items-center justify-center relative group cursor-pointer hover:border-red-400">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#ff3333] fill-current">
                    <polygon points="12,2 20,9 12,22 4,9" />
                  </svg>
                  <span className="absolute bottom-0 inset-x-0 bg-red-800/95 text-[6px] text-center text-white font-bold uppercase font-sans">SANGUÍNEO</span>
                </div>

                {/* Slots placeholders */}
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={`inv-slot-${idx}`} className="aspect-square bg-[#0f0d14]/80 border border-[#524341] flex items-center justify-center">
                    <span className="text-gray-700 text-xs">+</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2 bg-[#110e05]/60 p-2.5 border border-[#524341] max-h-48 overflow-y-auto">
                {/* Scroll item 1 */}
                <div className="flex gap-2.5 p-2 bg-[#181211] border border-[#5b403c] rounded-none">
                  <Scroll className="text-amber-500 w-8 h-8 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-amber-200 uppercase font-bold">Pergaminho de Hemomancia</span>
                    <span className="text-[8px] text-gray-400 leading-normal">Casta instantaneamente a habilidade Blood Nova causando 250% de dano base sacrificando vitalidade.</span>
                  </div>
                </div>

                {/* Scroll item 2 */}
                <div className="flex gap-2.5 p-2 bg-[#181211] border border-[#5b403c] rounded-none">
                  <Shield className="text-purple-400 w-8 h-8 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-purple-300 uppercase font-bold">Elixir de Almas</span>
                    <span className="text-[8px] text-gray-400 leading-normal">Restaura 50% de Mana instantaneamente e concede imunidade a fadiga por 10 segundos.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tooltip detail inside Inventory */}
            <div className="bg-[#120d0c] border border-[#5b403c] p-2 text-left">
              <span className="text-[9px] text-[#e8c76a] font-bold uppercase block">CAJADO DE OSSO (LENDÁRIO)</span>
              <span className="text-[8px] text-gray-400 block mt-0.5 leading-normal">Concedido pelas almas perdidas no Fosso das Chagas. Concede +15% de Dano de Sangue e reduz o custo de HP de suas magias em 20%.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK CONFIGURATIONS OVERLAY PANEL ── */}
      {isQuickSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#181211] border-4 border-[#5b403c] shadow-[8px_8px_0px_#000000] p-4 max-w-sm w-full relative flex flex-col gap-3 text-left">
            <div className="flex justify-between items-center border-b border-[#ab8983] pb-2">
              <h3 className="font-pixel text-[#e8c76a] text-sm uppercase">CONFIURAÇÕES RÁPIDAS</h3>
              <button onClick={() => setQuickSettingsOpen(false)} className="text-[#ab8983] hover:text-red-500">
                <X size={16} />
              </button>
            </div>

            {/* Toggle Retrato Animado */}
            <div className="flex items-center justify-between py-1 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">RETRATO ANIMADO (MOBILE FX)</span>
              <button
                onClick={() => updateSettings({ ...settings, animatedPortrait: !settings.animatedPortrait })}
                className="text-amber-500"
              >
                {settings.animatedPortrait ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>

            {/* Toggle CRT Filter */}
            <div className="flex items-center justify-between py-1 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">SCANLINES FILTRO CRT</span>
              <button
                onClick={() => updateSettings({ ...settings, crtFilter: !settings.crtFilter })}
                className="text-amber-500"
              >
                {settings.crtFilter ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>

            {/* Toggle Screen Shake */}
            <div className="flex items-center justify-between py-1 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">TREMOR DE TELA</span>
              <button
                onClick={() => updateSettings({ ...settings, screenShakeEnabled: !settings.screenShakeEnabled })}
                className="text-amber-500 cursor-pointer"
              >
                {settings.screenShakeEnabled !== false ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>

            {/* Toggle Flashes */}
            <div className="flex items-center justify-between py-1 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">FLASHES DE DANO</span>
              <button
                onClick={() => updateSettings({ ...settings, flashesEnabled: !settings.flashesEnabled })}
                className="text-amber-500 cursor-pointer"
              >
                {settings.flashesEnabled !== false ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>

            {/* Toggle High Contrast Texts */}
            <div className="flex items-center justify-between py-1 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">DANOS ALTO CONTRASTE</span>
              <button
                onClick={() => updateSettings({ ...settings, highContrastDamageTexts: !settings.highContrastDamageTexts })}
                className="text-amber-500 cursor-pointer"
              >
                {settings.highContrastDamageTexts ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>

            {/* HUD Edit Button */}
            <div className="flex items-center justify-between py-2 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">LAYOUT DE BOTÕES</span>
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setQuickSettingsOpen(false); // Close quick settings
                  setEditingHUD(true); // Open edit mode
                }}
                className="px-2.5 py-1 bg-amber-900 border border-amber-500 text-amber-100 hover:bg-amber-800 text-[8px] uppercase font-pixel tracking-wide flex items-center gap-1 cursor-pointer animate-pulse"
              >
                EDITAR
              </button>
            </div>

            {/* Cosmetic Palettes */}
            <div className="flex flex-col gap-1 py-1.5 border-b border-[#524341]">
              <span className="text-[10px] text-gray-300 uppercase">PALETA DE SANGUE</span>
              <div className="grid grid-cols-4 gap-1.5 mt-1 text-[7px] text-center font-bold">
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
                        window.dispatchEvent(new CustomEvent('update-cosmetic-tint'));
                      }}
                      className={`py-1 border transition cursor-pointer ${
                        active
                          ? 'border-amber-500 text-amber-300 bg-amber-950/40'
                          : 'border-gray-800 text-gray-500 bg-black/40 hover:border-gray-700'
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
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>OPACIDADE DOS CONTROLES HUD</span>
                <span className="text-[#e8c76a] font-bold">{Math.round(settings.virtualControlsOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={settings.virtualControlsOpacity}
                onChange={(e) => updateSettings({ ...settings, virtualControlsOpacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-black accent-amber-500 rounded-none cursor-pointer"
              />
            </div>

            {/* SFX / BGM Volume sliders */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-gray-300">
                <span>SFE VOLUME DOS EFEITOS</span>
                <span className="text-amber-500">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => updateSettings({ ...settings, sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-1 bg-black accent-amber-500 rounded-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setQuickSettingsOpen(false)}
              className="w-full mt-2 py-1.5 bg-[#990000] border border-red-500 text-white text-[10px] uppercase font-bold hover:bg-red-800 transition"
            >
              FECHAR AJUSTES
            </button>
          </div>
        </div>
      )}

      {/* ── PAUSE OVERLAY MODAL ── */}
      {isPauseOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#181211] border-4 border-[#5b403c] p-6 max-w-xs w-full text-center space-y-4 shadow-[8px_8px_0px_#000000]">
            <h2 className="text-lg font-pixel text-amber-200 uppercase tracking-widest">JOGO PAUSADO</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleResume}
                className="w-full py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-100 font-pixel text-[10px] rounded-none transition"
              >
                RECOMECAR JORNADA
              </button>
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setPauseOpen(false);
                  setGameState('menu');
                }}
                className="w-full py-2 bg-[#990000] hover:bg-red-900 border border-red-800 text-white font-pixel text-[10px] rounded-none transition"
              >
                SAIR DO ANDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TOUCH ZONES — pointer-active overlay zones.
          Left side (47%) regulates the movement Analog Joystick.
          Right side (47%) handles aiming gestures.
         ══════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════
          TOUCH ZONES — pointer-active overlay zones.
          Left side (47%) regulates the movement Analog Joystick.
          Right side (47%) handles aiming gestures.
         ══════════════════════════════════════════════════════════ */}

      {!gamepadConnected && isTouchDevice && (
        <>
          {/* MOVE zone (left) */}
          <div
            className="absolute left-0 bottom-0 touch-none z-10"
            style={{ width: '47%', height: '65%' }}
            onPointerDown={moveJoystick.onPointerDown}
            onPointerMove={moveJoystick.onPointerMove}
            onPointerUp={moveJoystick.onPointerUp}
            onPointerCancel={moveJoystick.onPointerCancel}
          />

          {/* AIM zone (right) */}
          <div
            className="absolute right-0 bottom-0 touch-none"
            style={{ width: '47%', height: '65%', zIndex: 10 }}
            onPointerDown={aimJoystick.onPointerDown}
            onPointerMove={aimJoystick.onPointerMove}
            onPointerUp={aimJoystick.onPointerUp}
            onPointerCancel={aimJoystick.onPointerCancel}
          />
        </>
      )}

      {/* ── Onboarding / Tutorial Tip Overlay ── */}
      {activeTip && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[110] max-w-sm w-full bg-[#181211]/95 border-2 border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.3)] p-3 text-center pointer-events-auto rounded-lg">
          <span className="text-amber-400 font-bold uppercase text-[9px] block tracking-wider mb-1">📖 APRENDA O RITUAL</span>
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
        style={{ zIndex: 20, opacity: settings.virtualControlsOpacity }}
      >
        <SkillsOverlay
          stats={stats}
          getCooldownRemaining={getCooldownRemaining}
          onSkillClick={handleSkillAction}
        />
      </div>

      {/* ── MOVE Joystick hint label ── */}
      {!gamepadConnected && isTouchDevice && !moveJoystick.state.active && (
        <div
          className="absolute left-6 bottom-6 pointer-events-none"
          style={{ opacity: settings.virtualControlsOpacity * 0.55 }}
        >
          <div className="w-16 h-16 rounded-full border border-dashed border-[#ab8983] flex items-center justify-center animate-pulse">
            <span className="text-[8px] font-pixel text-gray-500 uppercase tracking-widest">ARRASTAR</span>
          </div>
        </div>
      )}

      {/* ── Virtual joystick visual indicators ── */}
      {!gamepadConnected && isTouchDevice && (
        <>
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
        </>
      )}

      {/* ── HUD Edit Mode Banner ── */}
      {isEditingHUD && (
        <div className="fixed top-20 inset-x-0 mx-auto max-w-lg bg-[#181211] border-4 border-amber-500 shadow-[4px_4px_0px_#000000] p-4 text-center z-50 flex flex-col gap-2 text-white font-pixel text-xs pointer-events-auto">
          <span className="text-amber-400 font-bold uppercase tracking-wider block">✍️ MODO DE EDIÇÃO DE HUD</span>
          <span className="text-[10px] text-gray-300 block font-sans leading-normal">
            Arraste os botões de skill para qualquer posição da tela. Clique nos botões S/M/L sobre cada habilidade para mudar o tamanho dos botões.
          </span>
          <div className="flex gap-2.5 justify-center mt-1">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setEditingHUD(false);
              }}
              className="px-4 py-2 bg-emerald-900 border border-emerald-500 text-emerald-100 uppercase hover:bg-emerald-800 text-[10px] cursor-pointer"
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
              className="px-4 py-2 bg-black border border-gray-600 text-gray-300 uppercase hover:bg-gray-900 text-[10px] cursor-pointer"
            >
              RESTAURAR PADRÃO
            </button>
          </div>
        </div>
      )}

      {/* ── NPC Interaction Prompt ── */}
      {closestNPCType && !activeNPC && (
        <div className="fixed bottom-1/4 inset-x-0 mx-auto max-w-xs bg-[#171309] border-2 border-sky-500 shadow-[4px_4px_0px_rgba(0,0,0,0.8)] p-2.5 text-center z-40 flex flex-col items-center gap-1.5 text-[#E3DAC9] pointer-events-auto select-none">
          <span className="text-sky-400 text-xs font-bold uppercase tracking-wider block">
            👤 {closestNPCType === 'cleric' ? 'CLÉRIGO' : closestNPCType === 'alchemist' ? 'ALQUIMISTA' : closestNPCType === 'blacksmith' ? 'FERREIRO' : 'ANCIÃO'} ESTÁ PRÓXIMO
          </span>
          <span className="text-[10px] text-gray-400 font-sans block leading-none">
            Aproxime-se e pressione <span className="text-amber-500 font-bold">[E]</span> para falar.
          </span>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundEngine.playButtonClick();
              setActiveNPC(closestNPCType);
            }}
            className="mt-1 px-3 py-1 bg-sky-950 border border-sky-600 text-sky-100 hover:bg-sky-900 active:scale-95 text-[10px] font-bold uppercase cursor-pointer"
          >
            FALAR COM NPC
          </button>
        </div>
      )}

      {/* ── NPC Dialogue Modal ── */}
      {activeNPC && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-[#171309] border-4 border-[#B8860B] rounded-none p-5 max-w-md w-full text-[#E3DAC9] shadow-[0_0_30px_rgba(184,134,11,0.4)]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#B8860B]/40 pb-3 mb-4">
              <span className="text-sm font-pixel text-[#B8860B] uppercase font-bold tracking-wider">
                {activeNPC === 'cleric' ? 'Clérigo Curandeiro' : activeNPC === 'alchemist' ? 'Alquimista de Fronteira' : activeNPC === 'blacksmith' ? 'Ferreiro Necromântico' : 'Ancião da Vila'}
              </span>
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setActiveNPC(null);
                }}
                className="p-1 text-red-400 hover:bg-red-950/40 border border-red-900/60 rounded-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content / Dialog Text */}
            <p className="text-xs font-gothic leading-relaxed mb-5 italic border-l-2 border-amber-600 pl-3 py-1 text-gray-300">
              {activeNPC === 'cleric' && '"Que a benção do Sangue Purificador te guarde, Mestre do Sangue. Deseja curar suas chagas ou purificar a infecção?"'}
              {activeNPC === 'alchemist' && '"Frascos, elixires e ataduras para aplacar os males do abismo... Que desejas comprar, Bloodmage?"'}
              {activeNPC === 'blacksmith' && '"O metal clama por sacrifício. Posso aprimorar sua foice ou sua couraça de ossos em troca de cristais de sangue."'}
              {activeNPC === 'elder' && '"Nossas paliçadas resistem sob as sombras, mas os monstros lá fora estão cada vez mais agressivos. Se puderes deter o Mini-Chefe das Catacumbas, nosso caminho estará livre para avançar..."'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3 font-pixel text-[11px]">

              {/* Cleric actions */}
              {activeNPC === 'cleric' && (
                <>
                  <button
                    onClick={() => {
                      soundEngine.playButtonClick();
                      // Full Heal HP/Mana
                      setPlayerStats({
                        ...stats,
                        hp: stats.maxHp,
                        mana: stats.maxMana
                      });
                      soundEngine.playNova(); // special trigger sound
                    }}
                    className="w-full text-left p-2.5 bg-sky-950/40 border border-sky-600 hover:bg-sky-900/50 uppercase transition-colors font-bold cursor-pointer"
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
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      stats.statusConditions?.infection && bloodCrystals >= 15
                        ? 'bg-emerald-950/40 border-emerald-500 hover:bg-emerald-900/50 text-emerald-100 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
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
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 15
                        ? 'bg-red-950/40 border-red-600 hover:bg-red-900/50 text-red-200 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🩸 Comprar Atadura (Sangramento) - 15 Cristais [Possui: {stats.curatives?.bandages || 0}]
                  </button>
                  <button
                    disabled={bloodCrystals < 20}
                    onClick={() => {
                      buyCurative('antidotes', 20);
                    }}
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 20
                        ? 'bg-purple-950/40 border-purple-600 hover:bg-purple-900/50 text-purple-200 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🍇 Comprar Antídoto (Veneno) - 20 Cristais [Possui: {stats.curatives?.antidotes || 0}]
                  </button>
                  <button
                    disabled={bloodCrystals < 35}
                    onClick={() => {
                      buyCurative('antibiotics', 35);
                    }}
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 35
                        ? 'bg-emerald-950/40 border-emerald-600 hover:bg-emerald-900/50 text-emerald-200 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
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
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 50
                        ? 'bg-amber-950/40 border-[#B8860B] hover:bg-amber-900/50 text-amber-200 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
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
                    className={`w-full text-left p-2.5 border font-bold uppercase transition-colors ${
                      bloodCrystals >= 50
                        ? 'bg-amber-950/40 border-[#B8860B] hover:bg-amber-900/50 text-amber-200 cursor-pointer'
                        : 'bg-black/30 border-gray-800 text-gray-500 cursor-not-allowed'
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
                    // Quest acceptance: give them 100 crystals as startup aid!
                    addBloodCrystals(100);
                    soundEngine.playNova();
                    setActiveNPC(null);
                  }}
                  className="w-full text-left p-2.5 bg-amber-950/40 border border-[#B8860B] hover:bg-amber-900/50 text-amber-200 font-bold uppercase cursor-pointer"
                >
                  📜 Aceitar Clamor de Auxílio (+100 Cristais de Sangue)
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  setActiveNPC(null);
                }}
                className="w-full text-center p-2.5 bg-black border border-gray-700 text-gray-400 uppercase font-bold hover:bg-gray-950 cursor-pointer"
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
