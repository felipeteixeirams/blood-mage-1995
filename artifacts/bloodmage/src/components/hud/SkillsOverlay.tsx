import React from 'react';
import {
  Flame, HeartPulse, Shield, Sword, CircleDot, Zap,
} from 'lucide-react';
import { PlayerStats, SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { useGameStore } from '../../store/gameStore';
import { SkillPresetEditor } from './SkillPresetEditor';
import { soundEngine } from '../../utils/soundEngine';

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
  const { skillPreset } = useGameStore();
  const typedSpells = spellsData as Record<string, SpellConfig>;

  const checkCanCast = (spellId: string): boolean => {
    const spell = typedSpells[spellId];
    if (!spell) return false;
    if (getCooldownRemaining(spellId) > 0) return false;
    if (stats.mana < spell.manaCost) return false;
    if (spell.hpCost && stats.hp <= spell.hpCost) return false;
    return true;
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

    // Cooldown arc as border-based progress using conic-gradient
    const cdMax = spell.cooldownMs;
    const cdPct = cd > 0 ? Math.min(1, cd / cdMax) : 0;

    return (
      <button
        key={spellId}
        onClick={() => {
          if (canCast) {
            soundEngine.playButtonClick();
            onSkillClick(skillKey);
          }
        }}
        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5
          transition-all active:scale-90 cursor-pointer touch-manipulation select-none
          ${!canCast
            ? 'bg-gray-950/90 border-gray-800 text-gray-600 opacity-60'
            : `${activeCls} hover:brightness-125`
          }`}
        title={`${spell.name}: ${spell.description}`}
        aria-label={spell.name}
      >
        <Icon className="w-5 h-5 md:w-6 md:h-6" />

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
            {/* Dimming sweep using conic-gradient */}
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

  // Fill empty slots with ghost placeholders (always show 4 slots)
  const slots = [...skillPreset, ...Array(Math.max(0, 4 - skillPreset.length)).fill(null)];

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-auto">
      {/* Preset editor gear button */}
      <SkillPresetEditor />

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
