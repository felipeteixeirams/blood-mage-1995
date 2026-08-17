import React from 'react';
import {
  Flame, HeartPulse, Shield, Sword, CircleDot, Zap,
} from 'lucide-react';
import { PlayerStats, SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { useGameStore } from '../../store/gameStore';
import { SkillPresetEditor } from './SkillPresetEditor';
import { soundEngine } from '../../utils/soundEngine';
import { CombatFeel } from '../../game/systems/CombatFeel';

type SkillKey = 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam' | 'hemocyte_shield' | 'vampiric_touch';

const SPELL_TO_SKILLKEY: Record<string, SkillKey> = {
  hellfire_nova: 'nova',
  syphon_soul: 'syphon',
  bone_shield: 'bone_shield',
  crimson_scythe: 'crimson_scythe',
  blood_ritual_circle: 'blood_ritual_circle',
  hemomancy_beam: 'hemomancy_beam',
  hemocyte_shield: 'hemocyte_shield',
  vampiric_touch: 'vampiric_touch',
};

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  'heart-pulse': HeartPulse,
  shield: Shield,
  sword: Sword,
  'circle-dot': CircleDot,
  zap: Zap,
};

const COLOR_ACTIVE: Record<string, string> = {
  hellfire_nova: 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  syphon_soul: 'bg-purple-950/80 border-purple-600 text-purple-300 shadow-[0_0_12px_rgba(147,51,234,0.35)]',
  bone_shield: 'bg-zinc-900/80 border-[#b8860b]/60 text-amber-200 shadow-[0_0_12px_rgba(184,134,11,0.25)]',
  crimson_scythe: 'bg-red-950/80 border-red-700 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
  blood_ritual_circle: 'bg-rose-950/80 border-rose-700 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
  hemomancy_beam: 'bg-orange-950/80 border-orange-600 text-orange-200 shadow-[0_0_12px_rgba(251,146,60,0.4)]',
  hemocyte_shield: 'bg-rose-950/90 border-rose-600 text-rose-200 shadow-[0_0_12px_rgba(225,29,72,0.4)]',
  vampiric_touch: 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_12px_rgba(225,29,72,0.4)]',
};

interface SkillsOverlayProps {
  stats: PlayerStats;
  onSkillClick: (skillKey: SkillKey) => void;
  getCooldownRemaining: (spellId: string) => number;
}

export const SkillsOverlay: React.FC<SkillsOverlayProps> = ({
  stats,
  onSkillClick,
  getCooldownRemaining,
}) => {
  const { skillPreset, isEditingHUD, settings, updateSettings } = useGameStore();
  const typedSpells = spellsData as Record<string, SpellConfig>;

  const dragStateRef = React.useRef({
    spellId: '',
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
    hasDragged: false
  });

  // HUD layout edit drag reference
  const editDragRef = React.useRef({
    spellId: '',
    offsetX: 0,
    offsetY: 0,
    active: false
  });

  const checkCanCast = (spellId: string): boolean => {
    const spell = typedSpells[spellId];
    if (!spell) return false;
    if (getCooldownRemaining(spellId) > 0) return false;
    if (stats.mana < spell.manaCost) return false;
    if (spell.hpCost && stats.hp <= spell.hpCost) return false;
    return true;
  };

  const setButtonSize = (spellId: string, size: 'small' | 'medium' | 'large') => {
    const currentLayout = settings.hudLayout || {};
    const currentItem = currentLayout[spellId] || { x: window.innerWidth - 120, y: window.innerHeight - 120, size: 'medium' };
    updateSettings({
      ...settings,
      hudLayout: {
        ...currentLayout,
        [spellId]: {
          ...currentItem,
          size
        }
      }
    });
  };

  const handleEditPointerDown = (e: React.PointerEvent<HTMLButtonElement>, spellId: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    editDragRef.current = {
      spellId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      active: true
    };
  };

  const handleEditPointerMove = (e: React.PointerEvent<HTMLButtonElement>, spellId: string) => {
    const d = editDragRef.current;
    if (!d.active || d.spellId !== spellId) return;

    const x = e.clientX - d.offsetX;
    const y = e.clientY - d.offsetY;

    const currentLayout = settings.hudLayout || {};
    const currentItem = currentLayout[spellId] || { x, y, size: 'medium' };

    updateSettings({
      ...settings,
      hudLayout: {
        ...currentLayout,
        [spellId]: {
          ...currentItem,
          x,
          y
        }
      }
    });
  };

  const handleEditPointerUp = (e: React.PointerEvent<HTMLButtonElement>, spellId: string) => {
    const d = editDragRef.current;
    if (!d.active || d.spellId !== spellId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    d.active = false;
  };

  const renderSkill = (spellId: string) => {
    const spell = typedSpells[spellId];
    if (!spell) return null;

    const skillKey = SPELL_TO_SKILLKEY[spellId];
    if (!skillKey) return null;

    const cd = getCooldownRemaining(spellId);
    const canCast = checkCanCast(spellId);
    const Icon = ICON_MAP[spell.icon] || Flame;
    const activeCls = COLOR_ACTIVE[spellId] || 'bg-gray-900 border-gray-600 text-gray-300';

    const cdMax = spell.cooldownMs;
    const cdPct = cd > 0 ? Math.min(1, cd / cdMax) : 0;

    // Layout values
    const layout = settings.hudLayout?.[spellId];
    
    // Find index in preset to determine default arc position
    const presetIndex = skillPreset.indexOf(spellId);
    
    // Size logic
    let size = layout?.size;
    if (!size) {
      // Default: First skill (index 0) is large (primary attack), others are small
      size = presetIndex === 0 ? 'large' : 'medium';
    }

    let sizeClasses = 'w-14 h-14 md:w-16 md:h-16 text-[9px]';
    let iconSize = 'w-5 h-5 md:w-6 md:h-6';
    if (size === 'small') {
      sizeClasses = 'w-11 h-11 md:w-12 md:h-12 text-[8px]';
      iconSize = 'w-4 h-4 md:w-5 md:h-5';
    } else if (size === 'large') {
      sizeClasses = 'w-20 h-20 md:w-24 md:h-24 text-xs'; // Made it slightly larger for the main attack
      iconSize = 'w-8 h-8 md:w-10 md:h-10';
    }

    // Determine default absolute positioning if no custom layout is set
    // This creates the Diablo-like arc layout
    let defaultPositionStyle: React.CSSProperties = { position: 'relative' };
    if (!layout && presetIndex >= 0) {
      if (presetIndex === 0) {
        defaultPositionStyle = { position: 'absolute', bottom: '0px', right: '0px' };
      } else if (presetIndex === 1) {
        defaultPositionStyle = { position: 'absolute', bottom: '10px', right: '100px' };
      } else if (presetIndex === 2) {
        defaultPositionStyle = { position: 'absolute', bottom: '70px', right: '80px' };
      } else if (presetIndex === 3) {
        defaultPositionStyle = { position: 'absolute', bottom: '110px', right: '20px' };
      }
    }

    if (isEditingHUD) {
      return (
        <button
          key={spellId}
          onPointerDown={(e) => handleEditPointerDown(e, spellId)}
          onPointerMove={(e) => handleEditPointerMove(e, spellId)}
          onPointerUp={(e) => handleEditPointerUp(e, spellId)}
          className={`absolute border-2 border-dashed border-[#b8860b] bg-[#1e1713] text-[#e8c76a] flex flex-col items-center justify-center gap-0.5 select-none cursor-move rounded-full ${sizeClasses}`}
          style={layout ? { position: 'fixed', left: layout.x, top: layout.y, zIndex: 100 } : { ...defaultPositionStyle, zIndex: 100 }}
        >
          <Icon className={iconSize} />
          <span className="text-[6px] font-pixel block font-sans">MOVER</span>

          {/* Size picker */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-1 bg-[#0c0a09] border border-[#b8860b]/60 p-0.5 rounded shadow z-50 pointer-events-auto">
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'small'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-white ${size === 'small' ? 'text-[#e8c76a] font-bold' : 'text-gray-500'}`}
            >
              S
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'medium'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-white ${size === 'medium' ? 'text-[#e8c76a] font-bold' : 'text-gray-500'}`}
            >
              M
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'large'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-white ${size === 'large' ? 'text-[#e8c76a] font-bold' : 'text-gray-500'}`}
            >
              L
            </span>
          </div>
        </button>
      );
    }

    return (
      <button
        key={spellId}
        onPointerDown={(e) => {
          if (!canCast) {
            if (cd > 0) {
              CombatFeel.triggerVibration('cooldown_warning');
            }
            return;
          }
          e.currentTarget.setPointerCapture(e.pointerId);
          dragStateRef.current = {
            spellId,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            active: true,
            hasDragged: false
          };
          window.dispatchEvent(new CustomEvent('drag-aim-start', { detail: { spellId } }));
        }}
        onPointerMove={(e) => {
          const d = dragStateRef.current;
          if (!d.active || d.spellId !== spellId) return;
          const dx = e.clientX - d.startX;
          const dy = e.clientY - d.startY;
          if (Math.hypot(dx, dy) > 15) {
            d.hasDragged = true;
          }
          d.currentX = e.clientX;
          d.currentY = e.clientY;
          window.dispatchEvent(new CustomEvent('drag-aim-move', { detail: { spellId, dx, dy } }));
        }}
        onPointerUp={(e) => {
          const d = dragStateRef.current;
          if (!d.active || d.spellId !== spellId) return;
          e.currentTarget.releasePointerCapture(e.pointerId);
          d.active = false;
          const dx = d.currentX - d.startX;
          const dy = d.currentY - d.startY;

          window.dispatchEvent(new CustomEvent('drag-aim-end', {
            detail: {
              spellId,
              dx,
              dy,
              isDrag: d.hasDragged
            }
          }));

          if (!d.hasDragged) {
            soundEngine.playButtonClick();
            onSkillClick(skillKey);
          }
        }}
        onPointerCancel={(e) => {
          const d = dragStateRef.current;
          if (!d.active || d.spellId !== spellId) return;
          e.currentTarget.releasePointerCapture(e.pointerId);
          d.active = false;
          window.dispatchEvent(new CustomEvent('drag-aim-end', {
            detail: {
              spellId,
              dx: 0,
              dy: 0,
              isDrag: false
            }
          }));
        }}
        className={`absolute rounded-full border-2 flex flex-col items-center justify-center gap-0.5
          transition-all active:scale-95 cursor-pointer touch-manipulation select-none
          ${!canCast
            ? 'bg-black/80 border-gray-900 text-gray-700 opacity-50'
            : `${activeCls} hover:brightness-110`
          } ${sizeClasses}`}
        style={layout ? { position: 'fixed', left: layout.x, top: layout.y, zIndex: 100 } : { ...defaultPositionStyle, zIndex: 100 }}
        title={`${spell.name}: ${spell.description}`}
        aria-label={spell.name}
      >
        {/* Stone-carved icon overlay feel */}
        <Icon className={`${iconSize} drop-shadow-[1px_1px_2px_rgba(0,0,0,0.9)]`} />

        {/* Cost labels */}
        {spell.hpCost ? (
          <span className="text-[7px] font-pixel text-rose-400 font-bold leading-none">-{spell.hpCost}HP</span>
        ) : (
          <span className="text-[7px] font-pixel text-blue-300 font-bold leading-none">
            {spell.manaCost > 0 ? `-${spell.manaCost}MP` : ''}
          </span>
        )}

        {/* Cooldown overlay */}
        {cd > 0 && (
          <>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(rgba(0,0,0,0.78) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-pixel text-[9px] text-[#e8c76a] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
              {(cd / 1000).toFixed(1)}s
            </span>
          </>
        )}
      </button>
    );
  };

  const slots = [...skillPreset, ...Array(Math.max(0, 4 - skillPreset.length)).fill(null)];

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-auto">
      {/* Hide Preset Editor button in edit mode */}
      {!isEditingHUD && <SkillPresetEditor />}

      {/* Arc layout container */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56">
        {slots.map((spellId, idx) => {
          if (spellId) {
            return renderSkill(spellId);
          }
          
          // Empty slot positioning matching default arc
          let posStyle: React.CSSProperties = {};
          if (idx === 0) posStyle = { position: 'absolute', bottom: '0px', right: '0px' };
          else if (idx === 1) posStyle = { position: 'absolute', bottom: '10px', right: '100px' };
          else if (idx === 2) posStyle = { position: 'absolute', bottom: '70px', right: '80px' };
          else if (idx === 3) posStyle = { position: 'absolute', bottom: '110px', right: '20px' };

          return (
            <div
              key={`empty-${idx}`}
              className={`absolute rounded-full border-2 border-dashed border-gray-800 bg-black/35 flex items-center justify-center text-gray-700 font-bold ${idx === 0 ? 'w-20 h-20 md:w-24 md:h-24 text-lg' : 'w-11 h-11 md:w-12 md:h-12 text-xs'}`}
              style={posStyle}
            >
              +
            </div>
          );
        })}
      </div>
    </div>
  );
};
