import React from 'react';
import { UpgradeOption } from '../types/game';
import { Sparkles, Zap, Heart, Clock, ShieldPlus, Footprints, Droplet, Crown } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface LevelUpModalProps {
  level: number;
  options: UpgradeOption[];
  onSelectOption: (option: UpgradeOption) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, options, onSelectOption }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'zap': return <Zap className="w-6 h-6 text-amber-400" />;
      case 'heart': return <Heart className="w-6 h-6 text-red-500" />;
      case 'clock': return <Clock className="w-6 h-6 text-blue-400" />;
      case 'shield-plus': return <ShieldPlus className="w-6 h-6 text-red-400" />;
      case 'footprints': return <Footprints className="w-6 h-6 text-emerald-400" />;
      case 'droplet': return <Droplet className="w-6 h-6 text-blue-500" />;
      case 'crown': return <Crown className="w-6 h-6 text-yellow-400" />;
      default: return <Sparkles className="w-6 h-6 text-amber-400" />;
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <span className="text-[8px] font-pixel text-yellow-400 bg-yellow-950/80 px-2 py-0.5 border border-yellow-700">LENDÁRIO</span>;
      case 'rare':
        return <span className="text-[8px] font-pixel text-purple-400 bg-purple-950/80 px-2 py-0.5 border border-purple-700">RARO</span>;
      default:
        return <span className="text-[8px] font-pixel text-gray-300 bg-gray-900/80 px-2 py-0.5 border border-gray-700">COMUM</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-6 max-w-3xl w-full text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative flex flex-col items-center space-y-6 font-pixel">
        {/* Cantoneiras */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Title */}
        <div className="text-center space-y-2">
          <p className="font-pixel text-[9px] text-amber-500 tracking-widest uppercase">
            — NÍVEL {level} ALCANÇADO —
          </p>
          <h2 className="text-2xl md:text-3xl font-gothic text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-300 to-red-600 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            RITUAL DE EVOLUÇÃO
          </h2>
          <p className="text-[9px] font-retro text-gray-400 uppercase">
            Escolha uma dádiva de sangue para fortalecer suas artes necromânticas
          </p>
        </div>

        {/* 3 Upgrade Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                soundEngine.playButtonClick();
                onSelectOption(option);
              }}
              className="group relative bg-[#120e0d] hover:bg-[#1e1713] border-2 border-[#b8860b]/30 hover:border-amber-500 rounded-none p-5 flex flex-col items-center text-center transition-all duration-200 shadow-md hover:scale-105 cursor-pointer"
            >
              <div className="mb-3 p-3 rounded-full bg-[#0c0a09] border border-[#b8860b]/40 group-hover:border-amber-500 group-hover:scale-110 transition-transform">
                {getIcon(option.icon)}
              </div>

              <div className="mb-2.5">{getRarityBadge(option.rarity)}</div>

              <h3 className="font-pixel text-[10px] text-amber-200 group-hover:text-amber-300 mb-2 font-bold tracking-wide">
                {option.title}
              </h3>

              <p className="font-retro text-xs text-gray-400 group-hover:text-gray-200 leading-normal">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
