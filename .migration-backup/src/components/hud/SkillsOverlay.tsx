import React from 'react';
import { Flame, HeartPulse, Shield, Sword, CircleDot, Zap } from 'lucide-react';
import { PlayerStats, SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';

type SkillKey = 'nova' | 'syphon' | 'bone_shield' | 'crimson_scythe' | 'blood_ritual_circle' | 'hemomancy_beam';

interface SkillsOverlayProps {
  stats: PlayerStats;
  onSkillClick: (skillKey: SkillKey) => void;
  getCooldownRemaining: (spellId: string) => number;
}

export const SkillsOverlay: React.FC<SkillsOverlayProps> = ({
  stats,
  onSkillClick,
  getCooldownRemaining
}) => {
  const typedSpells = spellsData as Record<string, SpellConfig>;

  const checkCanCast = (spellId: string): boolean => {
    const spell = typedSpells[spellId];
    if (!spell) return false;
    const cd = getCooldownRemaining(spellId);
    if (cd > 0) return false;
    if (stats.mana < spell.manaCost) return false;
    if (spell.hpCost && stats.hp <= spell.hpCost) return false;
    return true;
  };

  const renderSkillButton = (
    skillKey: SkillKey,
    spellId: string,
    IconComponent: React.ElementType,
    hotkeyLabel: string,
    activeColorClass: string,
    textColorClass: string
  ) => {
    const spell = typedSpells[spellId];
    if (!spell) return null;
    const cd = getCooldownRemaining(spellId);
    const canCast = checkCanCast(spellId);

    return (
      <button
        key={spellId}
        onClick={() => onSkillClick(skillKey)}
        disabled={!canCast}
        title={`${spell.name}: ${spell.description}`}
        className={`relative p-2.5 md:p-3 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer touch-manipulation group ${
          !canCast
            ? 'bg-gray-900/90 border-gray-800 text-gray-600 opacity-60'
            : `${activeColorClass} hover:scale-110 active:scale-95`
        }`}
      >
        <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
        {cd > 0 && (
          <div className="absolute inset-0 bg-black/85 rounded-full flex items-center justify-center font-pixel text-[9px] text-white">
            {(cd / 1000).toFixed(1)}s
          </div>
        )}
        <span className={`absolute -top-1.5 -right-1.5 bg-black/90 text-[7px] font-pixel px-1 ${textColorClass} border border-gray-700 rounded`}>
          {hotkeyLabel}
        </span>
        {spell.hpCost ? (
          <span className="absolute -bottom-1 -left-1 bg-red-950 text-[7px] font-pixel px-1 text-red-400 border border-red-800 rounded">
            -{spell.hpCost}HP
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 mb-1 pointer-events-auto max-w-[170px] md:max-w-[210px]">
      {/* Skill 1: Hellfire Nova */}
      {renderSkillButton('nova', 'hellfire_nova', Flame, 'Q', 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]', 'text-emerald-400')}
      
      {/* Skill 2: Syphon Soul */}
      {renderSkillButton('syphon', 'syphon_soul', HeartPulse, 'E', 'bg-purple-950/90 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(147,51,234,0.4)]', 'text-purple-400')}
      
      {/* Skill 3: Bone Shield */}
      {renderSkillButton('bone_shield', 'bone_shield', Shield, 'SPC', 'bg-slate-900/90 border-slate-300 text-slate-100 shadow-[0_0_12px_rgba(226,232,240,0.4)]', 'text-slate-300')}
      
      {/* Skill 4: Crimson Scythe */}
      {renderSkillButton('crimson_scythe', 'crimson_scythe', Sword, 'R', 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]', 'text-red-400')}
      
      {/* Skill 5: Blood Ritual Circle */}
      {renderSkillButton('blood_ritual_circle', 'blood_ritual_circle', CircleDot, 'SHF', 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)]', 'text-rose-400')}
      
      {/* Skill 6: Hemomancy Beam */}
      {renderSkillButton('hemomancy_beam', 'hemomancy_beam', Zap, 'F', 'bg-red-900/90 border-red-400 text-red-200 shadow-[0_0_12px_rgba(252,165,165,0.5)]', 'text-red-300')}
    </div>
  );
};
