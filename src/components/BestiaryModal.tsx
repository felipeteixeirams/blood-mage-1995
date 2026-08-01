import React, { useState } from 'react';
import monstersData from '../data/monsters.json';
import spellsData from '../data/spells.json';
import { MonsterConfig, SpellConfig } from '../types/game';
import { X, Skull, Flame } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface BestiaryModalProps {
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monsters' | 'spells'>('monsters');
  const monsters = Object.values(monstersData) as MonsterConfig[];
  const spells = Object.values(spellsData) as SpellConfig[];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#120a0e] border-4 border-red-900/80 rounded-xl p-5 md:p-6 shadow-[0_0_50px_rgba(185,28,28,0.5)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-red-900/60 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <Skull className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-gothic text-amber-200">CODEX DO SANGUE</h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 hover:bg-red-950 text-gray-400 hover:text-red-200 rounded border border-transparent hover:border-red-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-4 border-b border-red-900/40 pb-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveTab('monsters');
            }}
            className={`flex-1 py-2 font-pixel text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
            className={`flex-1 py-2 font-pixel text-xs rounded transition-colors flex items-center justify-center gap-2 cursor-pointer ${
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
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'monsters' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monsters.map((monster) => (
                <div
                  key={monster.id}
                  className="bg-black/80 border border-red-900/50 rounded p-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-xs text-amber-300">{monster.name}</span>
                    <span className="text-[10px] font-pixel text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900">
                      {monster.hp} HP
                    </span>
                  </div>
                  <p className="font-retro text-sm text-gray-300 leading-tight">
                    {monster.description}
                  </p>
                  <div className="flex justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-red-950">
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
                    <span className="font-pixel text-xs text-purple-300">{spell.name}</span>
                    <span className="text-[10px] font-pixel text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900">
                      {spell.manaCost} MP
                    </span>
                  </div>
                  <p className="font-retro text-sm text-gray-300 leading-tight">
                    {spell.description}
                  </p>
                  <div className="flex justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-purple-950">
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
    </div>
  );
};
