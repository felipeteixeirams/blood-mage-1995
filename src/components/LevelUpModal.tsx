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
        return <span className="text-[10px] font-pixel text-yellow-400 bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-700">LENDÁRIO</span>;
      case 'rare':
        return <span className="text-[10px] font-pixel text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700">RARO</span>;
      default:
        return <span className="text-[10px] font-pixel text-gray-300 bg-gray-900 px-2 py-0.5 rounded border border-gray-700">COMUM</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-3xl bg-[#120a0e] border-4 border-red-900/80 rounded-xl p-6 shadow-[0_0_50px_rgba(185,28,28,0.5)] flex flex-col items-center space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <p className="font-pixel text-xs text-amber-500 tracking-widest uppercase">
            — NÍVEL {level} ALCANÇADO —
          </p>
          <h2 className="text-3xl md:text-4xl font-gothic text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-500">
            RITUAL DE EVOLUÇÃO
          </h2>
          <p className="text-xs font-retro text-gray-400">
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
              className="group relative bg-black/90 hover:bg-red-950/60 border-2 border-red-900/60 hover:border-amber-500/80 rounded-lg p-5 flex flex-col items-center text-center transition-all duration-200 shadow-lg hover:scale-105 cursor-pointer"
            >
              <div className="mb-3 p-3 rounded-full bg-red-950/80 border border-red-800/60 group-hover:border-amber-500 group-hover:scale-110 transition-transform">
                {getIcon(option.icon)}
              </div>

              <div className="mb-2">{getRarityBadge(option.rarity)}</div>

              <h3 className="font-pixel text-xs text-amber-200 group-hover:text-amber-300 mb-2">
                {option.title}
              </h3>

              <p className="font-retro text-sm text-gray-300/90 leading-relaxed">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
