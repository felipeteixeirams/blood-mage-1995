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

type SkillKey = 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam';

const SPELL_TO_SKILLKEY: Record<string, SkillKey> = {
  hellfire_nova: 'nova',
  syphon_soul: 'syphon',
  bone_shield: 'bone_shield',
  crimson_scythe: 'crimson_scythe',
  blood_ritual_circle: 'blood_ritual_circle',
  hemomancy_beam: 'hemomancy_beam',
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
  hellfire_nova: 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)]',
  syphon_soul: 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_14px_rgba(147,51,234,0.4)]',
  bone_shield: 'bg-slate-900/90 border-slate-300 text-slate-100 shadow-[0_0_14px_rgba(226,232,240,0.4)]',
  crimson_scythe: 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.5)]',
  blood_ritual_circle: 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.5)]',
  hemomancy_beam: 'bg-orange-950/90 border-orange-400 text-orange-200 shadow-[0_0_14px_rgba(251,146,60,0.5)]',
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
    const activeCls = COLOR_ACTIVE[spellId] || 'bg-gray-900/90 border-gray-500 text-gray-300';

    const cdMax = spell.cooldownMs;
    const cdPct = cd > 0 ? Math.min(1, cd / cdMax) : 0;

    // Layout values
    const layout = settings.hudLayout?.[spellId];
    const size = layout?.size || 'medium';

    let sizeClasses = 'w-14 h-14 md:w-16 md:h-16 text-[10px]';
    let iconSize = 'w-5 h-5 md:w-6 md:h-6';
    if (size === 'small') {
      sizeClasses = 'w-11 h-11 md:w-12 md:h-12 text-[8px]';
      iconSize = 'w-4 h-4 md:w-5 md:h-5';
    } else if (size === 'large') {
      sizeClasses = 'w-16 h-16 md:w-20 md:h-20 text-xs';
      iconSize = 'w-6 h-6 md:w-7 md:h-7';
    }

    if (isEditingHUD) {
      return (
        <button
          key={spellId}
          onPointerDown={(e) => handleEditPointerDown(e, spellId)}
          onPointerMove={(e) => handleEditPointerMove(e, spellId)}
          onPointerUp={(e) => handleEditPointerUp(e, spellId)}
          className={`relative border-2 border-dashed border-amber-500 bg-amber-950/70 text-amber-200 flex flex-col items-center justify-center gap-0.5 select-none cursor-move ${sizeClasses}`}
          style={layout ? { position: 'fixed', left: layout.x, top: layout.y, zIndex: 100 } : undefined}
        >
          <Icon className={iconSize} />
          <span className="text-[6px] font-pixel block font-sans">ARRASTAR</span>

          {/* Size picker */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-1 bg-black/90 border border-amber-500 p-0.5 rounded shadow z-50 pointer-events-auto">
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'small'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-amber-400 ${size === 'small' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
            >
              S
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'medium'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-amber-400 ${size === 'medium' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
            >
              M
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setButtonSize(spellId, 'large'); }}
              className={`px-1 text-[8px] cursor-pointer hover:text-amber-400 ${size === 'large' ? 'text-amber-400 font-bold' : 'text-gray-400'}`}
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
            // Haptic feedback: weak pulse when skill is on cooldown
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
        className={`relative rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5
          transition-all active:scale-90 cursor-pointer touch-manipulation select-none
          ${!canCast
            ? 'bg-gray-950/90 border-gray-800 text-gray-600 opacity-60'
            : `${activeCls} hover:brightness-125`
          } ${sizeClasses}`}
        style={layout ? { position: 'fixed', left: layout.x, top: layout.y, zIndex: 100 } : undefined}
        title={`${spell.name}: ${spell.description}`}
        aria-label={spell.name}
      >
        <Icon className={iconSize} />

        {/* HP cost badge */}
        {spell.hpCost ? (
          <span className="text-[7px] font-pixel text-red-400 leading-none">-{spell.hpCost}HP</span>
        ) : (
          <span className="text-[7px] font-pixel text-gray-500 leading-none">
            {spell.manaCost > 0 ? `-${spell.manaCost}MP` : ''}
          </span>
        )}

        {/* Cooldown overlay */}
        {cd > 0 && (
          <>
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `conic-gradient(rgba(0,0,0,0.72) ${cdPct * 360}deg, transparent ${cdPct * 360}deg)`,
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
              {(cd / 1000).toFixed(1)}
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

      {/* 2×2 skill grid */}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((spellId, idx) =>
          spellId ? (
            renderSkill(spellId)
          ) : (
            <div
              key={`empty-${idx}`}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 border-dashed border-gray-800/60 bg-black/30 flex items-center justify-center"
            >
              <span className="text-[8px] font-pixel text-gray-700">+</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
};
