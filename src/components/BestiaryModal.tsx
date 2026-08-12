import React, { useState } from 'react';
import monstersData from '../data/monsters.json';
import spellsData from '../data/spells.json';
import { MonsterConfig, SpellConfig } from '../types/game';
import { Skull, Flame } from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { soundEngine } from '../utils/soundEngine';

export const BestiaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monsters' | 'spells'>('monsters');
  const monsters = Object.values(monstersData) as MonsterConfig[];
  const spells = Object.values(spellsData) as SpellConfig[];

  return (
    <ModalBase
      title="CODEX DO SANGUE"
      subtitle="Enciclopédia ancestral de demônios e conjurações macabras"
      onClose={() => {
        soundEngine.playButtonClick();
        onClose();
      }}
    >
      <div className="flex flex-col gap-4 max-h-[60vh] font-pixel text-xs">
        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-[#b8860b]/30 pb-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('monsters');
            }}
            className={`flex-1 py-2 font-pixel text-[9px] uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              activeTab === 'monsters'
                ? 'bg-[#1e1713] text-[#e8c76a] border-[#b8860b] shadow-[0_0_8px_rgba(184,134,11,0.25)]'
                : 'bg-black/60 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>BESTIÁRIO DO INFERNO</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('spells');
            }}
            className={`flex-1 py-2 font-pixel text-[9px] uppercase transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              activeTab === 'spells'
                ? 'bg-[#1e1713] text-[#e8c76a] border-[#b8860b] shadow-[0_0_8px_rgba(184,134,11,0.25)]'
                : 'bg-black/60 border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>GRIMÓRIO DE MAGIAS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 space-y-3">
          {activeTab === 'monsters' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monsters.map((monster) => (
                <div
                  key={monster.id}
                  className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col gap-2 relative shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-[10px] text-[#e8c76a] font-bold uppercase">{monster.name}</span>
                    <span className="text-[8px] font-pixel text-red-400 bg-red-950/40 px-1.5 py-0.5 border border-red-900/60">
                      {monster.hp} HP
                    </span>
                  </div>
                  <p className="font-retro text-xs text-gray-400 leading-normal text-left">
                    {monster.description}
                  </p>
                  <div className="flex justify-between text-[8px] font-mono text-[#e8c76a]/60 pt-1 border-t border-[#b8860b]/10">
                    <span>Dano: {monster.damage}</span>
                    <span>Velocidade: {monster.speed}</span>
                    <span>XP: {monster.xpDrop}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {spells.map((spell) => (
                <div
                  key={spell.id}
                  className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col gap-2 relative shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-[10px] text-[#93c5fd] font-bold uppercase">{spell.name}</span>
                    <span className="text-[8px] font-pixel text-blue-400 bg-blue-950/40 px-1.5 py-0.5 border border-blue-900/60">
                      {spell.manaCost} MP
                    </span>
                  </div>
                  <p className="font-retro text-xs text-gray-400 leading-normal text-left">
                    {spell.description}
                  </p>
                  <div className="flex justify-between text-[8px] font-mono text-[#e8c76a]/60 pt-1 border-t border-[#b8860b]/10">
                    <span>Dano Base: {spell.baseDamage}</span>
                    <span>Cooldown: {spell.cooldownMs / 1000}s</span>
                    <span>Atalho: {spell.hotkey}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
};
