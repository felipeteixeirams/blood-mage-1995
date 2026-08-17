import React, { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';
import {
  Flame, HeartPulse, Shield, Sword, CircleDot, Zap,
} from 'lucide-react';
import { SpellConfig } from '../../types/game';
import spellsData from '../../data/spells.json';
import { useGameStore } from '../../store/gameStore';
import { soundEngine } from '../../utils/soundEngine';

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  'heart-pulse': HeartPulse,
  shield: Shield,
  sword: Sword,
  'circle-dot': CircleDot,
  zap: Zap,
};

const COLOR_MAP: Record<string, string> = {
  hellfire_nova: 'border-emerald-500 text-emerald-300',
  syphon_soul: 'border-purple-500 text-purple-300',
  bone_shield: 'border-slate-300 text-slate-200',
  crimson_scythe: 'border-red-500 text-red-300',
  blood_ritual_circle: 'border-rose-500 text-rose-300',
  hemomancy_beam: 'border-orange-400 text-orange-300',
  hemocyte_shield: 'border-rose-500 text-rose-300',
  vampiric_touch: 'border-red-400 text-red-300',
};

const MAX_SLOTS = 4;
const ALL_SKILLS = Object.keys(spellsData).filter(id => id !== 'blood_bolt');

export const SkillPresetEditor: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { skillPreset, setSkillPreset } = useGameStore();

  const toggle = (spellId: string) => {
    soundEngine.playButtonClick();
    if (skillPreset.includes(spellId)) {
      setSkillPreset(skillPreset.filter(id => id !== spellId));
    } else if (skillPreset.length < MAX_SLOTS) {
      setSkillPreset([...skillPreset, spellId]);
    }
  };

  const typedSpells = spellsData as Record<string, SpellConfig>;

  return (
    <div className="relative">
      {/* Gear toggle button */}
      <button
        onClick={() => { soundEngine.playButtonClick(); setOpen(o => !o); }}
        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors cursor-pointer touch-manipulation
          ${open
            ? 'bg-amber-900/90 border-amber-500 text-amber-300'
            : 'bg-black/70 border-gray-700/80 text-gray-400 hover:border-amber-600 hover:text-amber-400'
          }`}
        title="Editar skills no HUD"
      >
        <Settings size={14} />
      </button>

      {/* Inline panel */}
      {open && (
        <div className="absolute bottom-10 right-0 w-52 bg-[#130b10]/97 border-2 border-amber-800/80 rounded-xl p-3 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-pixel text-amber-400">SKILLS NO HUD ({skillPreset.length}/{MAX_SLOTS})</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white cursor-pointer"><X size={12} /></button>
          </div>

          <div className="flex flex-col gap-1.5">
            {ALL_SKILLS.map(spellId => {
              const spell = typedSpells[spellId];
              if (!spell) return null;
              const selected = skillPreset.includes(spellId);
              const blocked = !selected && skillPreset.length >= MAX_SLOTS;
              const IconComp = ICON_MAP[spell.icon] || Flame;
              const colorClass = COLOR_MAP[spellId] || 'border-gray-500 text-gray-300';

              return (
                <button
                  key={spellId}
                  onClick={() => toggle(spellId)}
                  disabled={blocked}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer
                    ${selected
                      ? `${colorClass} bg-black/60`
                      : blocked
                        ? 'border-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                        : 'border-gray-700/60 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  <IconComp size={13} />
                  <span className="text-[9px] font-pixel flex-1">{spell.name}</span>
                  {selected && <Check size={11} className="shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <p className="text-[8px] font-retro text-gray-600 mt-2 text-center">
            Toque para selecionar / remover
          </p>
        </div>
      )}
    </div>
  );
};
