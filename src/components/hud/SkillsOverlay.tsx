import React from 'react';
import { Flame, HeartPulse, Shield } from 'lucide-react';
import { PlayerStats, SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { soundEngine } from '../../utils/soundEngine';

interface SkillsOverlayProps {
  stats: PlayerStats;
  onSkillClick: (skillKey: 'nova' | 'syphon' | 'bone_shield') => void;
  getCooldownRemaining: (spellId: string) => number;
}

export const SkillsOverlay: React.FC<SkillsOverlayProps> = ({
  stats,
  onSkillClick,
  getCooldownRemaining
}) => {
  const typedSpells = spellsData as Record<string, SpellConfig>;
  const novaCd = getCooldownRemaining('hellfire_nova');
  const syphonCd = getCooldownRemaining('syphon_soul');
  const boneCd = getCooldownRemaining('bone_shield');

  return (
    <div className="flex flex-col gap-2 mb-1 pointer-events-auto">
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
  );
};
