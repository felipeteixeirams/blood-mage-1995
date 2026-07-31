import React, { useState, useRef } from 'react';
import { PlayerStats, SpellConfig } from '../types/game';
import spellsData from '../data/spells.json';
import { Flame, HeartPulse, Shield, Pause, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface GameplayHUDProps {
  stats: PlayerStats;
  onSkillClick: (skillKey: 'nova' | 'syphon' | 'bone_shield') => void;
  getCooldownRemaining: (spellId: string) => number;
  onMoveJoystickUpdate: (x: number, y: number) => void;
  onAimJoystickUpdate: (x: number, y: number) => void;
  onPauseToggle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  virtualControlsOpacity: number;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  stats,
  onSkillClick,
  getCooldownRemaining,
  onMoveJoystickUpdate,
  onAimJoystickUpdate,
  onPauseToggle,
  isMuted,
  onToggleMute,
  virtualControlsOpacity,
}) => {
  const typedSpells = spellsData as Record<string, SpellConfig>;

  // Touch Joysticks State
  const [moveJoystickActive, setMoveJoystickActive] = useState(false);
  const [moveJoystickPos, setMoveJoystickPos] = useState({ x: 0, y: 0 });
  const moveTouchId = useRef<number | null>(null);

  const [aimJoystickActive, setAimJoystickActive] = useState(false);
  const [aimJoystickPos, setAimJoystickPos] = useState({ x: 0, y: 0 });
  const aimTouchId = useRef<number | null>(null);

  // Touch handlers for Left Movement Joystick
  const handleMoveTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    moveTouchId.current = touch.identifier;
    setMoveJoystickActive(true);
    updateMoveJoystick(touch, e.currentTarget);
  };

  const handleMoveTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (moveTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === moveTouchId.current) {
        updateMoveJoystick(e.changedTouches[i], e.currentTarget);
        break;
      }
    }
  };

  const handleMoveTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    moveTouchId.current = null;
    setMoveJoystickActive(false);
    setMoveJoystickPos({ x: 0, y: 0 });
    onMoveJoystickUpdate(0, 0);
  };

  const updateMoveJoystick = (touch: React.Touch, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    // Sensibilidade de deadzone
    if (dist < 10 && moveJoystickActive) {
      onMoveJoystickUpdate(0, 0);
      setMoveJoystickPos({ x: 0, y: 0 });
      return;
    }

    const normX = Math.min(1, Math.max(-1, dx / maxRadius));
    const normY = Math.min(1, Math.max(-1, dy / maxRadius));

    const renderX = dist > maxRadius ? (dx / dist) * maxRadius : dx;
    const renderY = dist > maxRadius ? (dy / dist) * maxRadius : dy;

    setMoveJoystickPos({ x: renderX, y: renderY });
    onMoveJoystickUpdate(normX, normY);
  };

  // Touch handlers for Right Aim Joystick
  const handleAimTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.changedTouches[0];
    aimTouchId.current = touch.identifier;
    setAimJoystickActive(true);
    updateAimJoystick(touch, e.currentTarget);
  };

  const handleAimTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (aimTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === aimTouchId.current) {
        updateAimJoystick(e.changedTouches[i], e.currentTarget);
        break;
      }
    }
  };

  const handleAimTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    aimTouchId.current = null;
    setAimJoystickActive(false);
    setAimJoystickPos({ x: 0, y: 0 });
    // Não zeramos o aim no final para manter a última direção de mira
  };

  const updateAimJoystick = (touch: React.Touch, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    const normX = Math.min(1, Math.max(-1, dx / maxRadius));
    const normY = Math.min(1, Math.max(-1, dy / maxRadius));

    const renderX = dist > maxRadius ? (dx / dist) * maxRadius : dx;
    const renderY = dist > maxRadius ? (dy / dist) * maxRadius : dy;

    setAimJoystickPos({ x: renderX, y: renderY });
    onAimJoystickUpdate(normX, normY);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100));

  const novaCd = getCooldownRemaining('hellfire_nova');
  const syphonCd = getCooldownRemaining('syphon_soul');
  const boneCd = getCooldownRemaining('bone_shield');

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-6 select-none overflow-hidden">
      {/* CRT Scanline & Vignette Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.12] mix-blend-overlay" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px' }}>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[101] shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]"></div>
      
      {/* Top Header HUD: HP/Mana Orbs + Wave Stats + Menu Buttons */}
      <div className="w-full flex justify-between items-start">
        {/* Left: Stone Gothic Frame for HP / Mana / Level */}
        <div className="pointer-events-auto bg-black/85 border-2 border-[#4a2e35] p-3 rounded-lg shadow-2xl backdrop-blur flex items-center gap-3">
          {/* Blood Life Globe */}
          <div className="relative w-12 h-12 rounded-full bg-black border-2 border-red-900 overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.9)]">
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-red-950 via-red-600 to-red-500 transition-all duration-200"
              style={{ height: `${hpPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
              {Math.ceil(stats.hp)}
            </div>
          </div>

          {/* Bars Column */}
          <div className="flex flex-col gap-1.5 min-w-[130px] md:min-w-[180px]">
            {/* Health Bar */}
            <div className="w-full h-3 bg-gray-950 border border-red-900/80 rounded-sm overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-red-100 font-bold">
                HP {Math.ceil(stats.hp)} / {stats.maxHp}
              </span>
            </div>

            {/* Mana Bar */}
            <div className="w-full h-2.5 bg-gray-950 border border-blue-900/80 rounded-sm overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-200"
                style={{ width: `${manaPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-blue-100">
                MP {Math.ceil(stats.mana)} / {stats.maxMana}
              </span>
            </div>

            {/* XP Bar & Level Badge */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">
                NV {stats.level}
              </span>
              <div className="flex-1 h-2 bg-gray-950 border border-emerald-900/80 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Top: Dungeon Floor Depth & Score Display */}
        <div className="bg-black/80 border-2 border-amber-900/80 px-4 py-2 rounded-lg text-center backdrop-blur shadow-xl flex flex-col items-center">
          <div className="font-pixel text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>🏰 CALABOUÇO NIVEL {stats.floorDepth || 1}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-retro text-gray-300 pt-0.5">
            <span className="text-red-400">ABATES: <strong className="text-white">{stats.kills}</strong></span>
            <span>•</span>
            <span className="text-emerald-400">PONTOS: <strong className="text-white">{stats.score}</strong></span>
            <span>•</span>
            <span className="text-blue-300">{formatTime(stats.timeSurvivedSeconds)}</span>
          </div>
        </div>

        {/* Top-Right: Controls / Mute / Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onToggleMute();
            }}
            className="p-2 bg-black/80 hover:bg-red-950 border border-red-900/80 rounded text-red-400 transition-colors shadow cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-red-400" />}
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onPauseToggle();
            }}
            className="p-2 bg-black/80 hover:bg-amber-950 border border-amber-900/80 rounded text-amber-400 transition-colors shadow cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Virtual Joysticks & Skill Hotkeys */}
      <div className="w-full flex justify-between items-end pb-2">
        {/* Bottom Left: Touch Movement Joystick */}
        <div
          onTouchStart={handleMoveTouchStart}
          onTouchMove={handleMoveTouchMove}
          onTouchEnd={handleMoveTouchEnd}
          style={{ opacity: virtualControlsOpacity }}
          className="pointer-events-auto relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/40 border-2 border-red-900/60 flex items-center justify-center touch-none backdrop-blur-xs shadow-2xl"
        >
          {/* Inner Joystick Thumb */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-red-800 to-red-950 border border-red-500/80 shadow-lg"
            style={{
              transform: `translate(${moveJoystickPos.x}px, ${moveJoystickPos.y}px)`,
              transition: moveJoystickActive ? 'none' : 'transform 0.1s ease-out',
            }}
          />
          <span className="absolute bottom-2 text-[9px] font-pixel text-gray-400/60 pointer-events-none">MOVER</span>
        </div>

        {/* Bottom Right: Touch Aim Joystick + Skill Action Buttons */}
        <div className="pointer-events-auto flex items-end gap-3 md:gap-4">
          {/* Skill Hotkey Buttons Column */}
          <div className="flex flex-col gap-2 mb-1">
            {/* Skill 1: Hellfire Nova */}
            <button
              onClick={() => onSkillClick('nova')}
              disabled={novaCd > 0 || stats.mana < typedSpells['hellfire_nova'].manaCost}
              className={`relative p-3 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                novaCd > 0
                  ? 'bg-gray-900/90 border-gray-700 text-gray-500'
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-300 hover:scale-105 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
              }`}
            >
              <Flame className="w-5 h-5" />
              {novaCd > 0 && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center font-pixel text-[10px] text-emerald-400">
                  {(novaCd / 1000).toFixed(1)}s
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-black text-[8px] font-pixel px-1 text-emerald-400 border border-emerald-800 rounded">Q</span>
            </button>

            {/* Skill 2: Syphon Soul */}
            <button
              onClick={() => onSkillClick('syphon')}
              disabled={syphonCd > 0 || stats.mana < typedSpells['syphon_soul'].manaCost}
              className={`relative p-3 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                syphonCd > 0
                  ? 'bg-gray-900/90 border-gray-700 text-gray-500'
                  : 'bg-purple-950/90 border-purple-500 text-purple-300 hover:scale-105 shadow-[0_0_12px_rgba(147,51,234,0.5)]'
              }`}
            >
              <HeartPulse className="w-5 h-5" />
              {syphonCd > 0 && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center font-pixel text-[10px] text-purple-400">
                  {(syphonCd / 1000).toFixed(1)}s
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-black text-[8px] font-pixel px-1 text-purple-400 border border-purple-800 rounded">E</span>
            </button>

            {/* Skill 3: Bone Shield */}
            <button
              onClick={() => onSkillClick('bone_shield')}
              disabled={boneCd > 0 || stats.mana < typedSpells['bone_shield'].manaCost}
              className={`relative p-3 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                boneCd > 0
                  ? 'bg-gray-900/90 border-gray-700 text-gray-500'
                  : 'bg-slate-900/90 border-slate-300 text-slate-100 hover:scale-105 shadow-[0_0_12px_rgba(226,232,240,0.5)]'
              }`}
            >
              <Shield className="w-5 h-5" />
              {boneCd > 0 && (
                <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center font-pixel text-[10px] text-slate-300">
                  {(boneCd / 1000).toFixed(1)}s
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-black text-[8px] font-pixel px-1 text-slate-300 border border-slate-700 rounded">SPC</span>
            </button>
          </div>

          {/* Aim Virtual Joystick */}
          <div className="relative group pointer-events-auto">
            {/* Blood Nova Shortcut (Mobile) */}
            <button 
              onClick={() => {
                soundEngine.playButtonClick();
                onSkillClick('nova');
              }}
              disabled={novaCd > 0 || stats.mana < typedSpells['hellfire_nova'].manaCost}
              className={`absolute -top-20 right-0 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${
                novaCd > 0 
                  ? 'bg-gray-900/90 border-gray-700 opacity-50' 
                  : 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              }`}
            >
              <Flame className={`w-7 h-7 ${novaCd > 0 ? 'text-gray-600' : 'text-red-400 animate-pulse'}`} />
              {novaCd > 0 && (
                <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-red-400">
                  {Math.ceil(novaCd/1000)}
                </div>
              )}
            </button>
            <div className="absolute -top-6 right-3 text-[8px] font-pixel text-red-500/80">BLOOD NOVA</div>

            <div
              onTouchStart={handleAimTouchStart}
            onTouchMove={handleAimTouchMove}
            onTouchEnd={handleAimTouchEnd}
            style={{ opacity: virtualControlsOpacity }}
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/40 border-2 border-red-900/60 flex items-center justify-center touch-none backdrop-blur-xs shadow-2xl"
          >
            {/* Inner Joystick Thumb */}
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-red-400 shadow-lg"
              style={{
                transform: `translate(${aimJoystickPos.x}px, ${aimJoystickPos.y}px)`,
                transition: aimJoystickActive ? 'none' : 'transform 0.1s ease-out',
              }}
            />
            <span className="absolute bottom-2 text-[9px] font-pixel text-gray-400/60 pointer-events-none">MIRAR</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
