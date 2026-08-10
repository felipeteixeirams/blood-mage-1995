import React, { useState } from 'react';
import monstersData from '../data/monsters.json';
import spellsData from '../data/spells.json';
import { MonsterConfig, SpellConfig } from '../types/game';
import { Skull, Flame } from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { soundEngine } from '../utils/soundEngine';

interface BestiaryModalProps {
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose }) => {
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
        <div className="flex gap-2 border-b border-red-900/40 pb-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('monsters');
            }}
            className={`flex-1 py-2 font-pixel text-[10px] rounded transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'monsters'
                ? 'bg-red-950 text-amber-300 border border-red-700'
                : 'bg-black/60 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Skull className="w-4 h-4" />
            <span>BESTIÁRIO DO INFERNO</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('spells');
            }}
            className={`flex-1 py-2 font-pixel text-[10px] rounded transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'spells'
                ? 'bg-red-950 text-amber-300 border border-red-700'
                : 'bg-black/60 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flame className="w-4 h-4" />
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
                  className="bg-black/80 border border-red-900/50 rounded p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-[10px] text-amber-300">{monster.name}</span>
                    <span className="text-[8px] font-pixel text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900">
                      {monster.hp} HP
                    </span>
                  </div>
                  <p className="font-retro text-sm text-gray-300 leading-tight text-left">
                    {monster.description}
                  </p>
                  <div className="flex justify-between text-[8px] font-mono text-gray-400 pt-1 border-t border-red-950/40">
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
                  className="bg-black/80 border border-purple-900/50 rounded p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-[10px] text-purple-300">{spell.name}</span>
                    <span className="text-[8px] font-pixel text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">
                      {spell.manaCost} MP
                    </span>
                  </div>
                  <p className="font-retro text-sm text-gray-300 leading-tight text-left">
                    {spell.description}
                  </p>
                  <div className="flex justify-between text-[8px] font-mono text-gray-400 pt-1 border-t border-purple-950/40">
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
