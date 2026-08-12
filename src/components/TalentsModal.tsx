import React from 'react';
import { motion } from 'motion/react';
import { Flame, Heart, Droplet, Zap, Shield, Sparkles, X, PlusCircle, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import talentsData from '../data/talents.json';
import { soundEngine } from '../utils/soundEngine';

interface ExtendedTalentNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'offense' | 'defense' | 'utility';
  maxLevel: number;
  costPerLevel: number;
  statKey: string;
  bonusPerLevel: number;
  exclusive_with?: string[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  heart: Heart,
  droplet: Droplet,
  zap: Zap,
  shield: Shield,
  sparkles: Sparkles,
};

export const TalentsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { bloodCrystals, talentLevels, upgradeTalent } = useGameStore();

  const isExclusiveBlocked = (node: ExtendedTalentNode): boolean => {
    if (!node.exclusive_with) return false;
    return node.exclusive_with.some((otherId: string) => {
      const otherLvl = talentLevels[otherId] || 0;
      return otherLvl > 0;
    });
  };

  const getBlockedByName = (node: ExtendedTalentNode): string => {
    if (!node.exclusive_with) return '';
    const otherId = node.exclusive_with[0];
    const otherNode = (talentsData as any[]).find(t => t.id === otherId);
    return otherNode ? otherNode.name : 'Outro Talento';
  };

  const handleUpgradeNode = (node: ExtendedTalentNode) => {
    if (isExclusiveBlocked(node)) {
      soundEngine.playButtonClick();
      return;
    }
    const currentLvl = talentLevels[node.id] || 0;
    if (currentLvl >= node.maxLevel) return;

    const cost = node.costPerLevel * (currentLvl + 1);
    const success = upgradeTalent(node.id, cost);
    if (success) {
      soundEngine.playLevelUp();
    } else {
      soundEngine.playButtonClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto select-none"
    >
      <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative flex flex-col gap-4 font-pixel">

        {/* Cantoneiras douradas simuladas nos quatro cantos */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#b8860b]/30 pb-3 mb-2">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#e8c76a] animate-pulse" />
            <div>
              <h2 className="text-xl font-cinzel text-[#e8c76a] font-bold uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">ÁRVORE DE TALENTOS</h2>
              <p className="text-[9px] text-[#e8c76a]/60 font-sans uppercase tracking-wide">Evolução permanente alimentada por Cristais de Sangue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/50 text-[#e8c76a] transition-colors cursor-pointer w-9 h-9 flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currency Display */}
        <div className="bg-[#120e0d] border border-[#b8860b]/30 p-3 mb-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-red-600 fill-red-600 animate-bounce" />
            <span className="text-[9px] font-pixel text-[#e8c76a]/80 uppercase">CRISTAIS DE SANGUE ACUMULADOS:</span>
          </div>
          <span className="text-base font-pixel text-rose-500 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            {bloodCrystals} 💎
          </span>
        </div>

        {/* Talent Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {(talentsData as ExtendedTalentNode[]).map((node) => {
            const currentLvl = talentLevels[node.id] || 0;
            const isMax = currentLvl >= node.maxLevel;
            const blocked = isExclusiveBlocked(node);
            const cost = node.costPerLevel * (currentLvl + 1);
            const canAfford = bloodCrystals >= cost && !isMax && !blocked;
            const IconComp = ICON_MAP[node.icon] || Sparkles;

            return (
              <div
                key={node.id}
                className={`p-4 border transition-all flex flex-col justify-between ${
                  isMax
                    ? 'bg-[#18130f] border-[#b8860b]'
                    : blocked
                    ? 'bg-black/10 border-gray-900 opacity-40'
                    : canAfford
                    ? 'bg-[#120e0d] border-[#b8860b]/40 hover:border-[#b8860b] shadow-md'
                    : 'bg-black/40 border-gray-900 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-black/60 border border-[#b8860b]/30 text-[#e8c76a]">
                        <IconComp className="w-4 h-4" />
                      </span>
                      <h3 className="text-xs font-pixel font-bold text-[#e8c76a] uppercase">{node.name}</h3>
                    </div>
                    <span className="text-[8px] font-pixel px-2 py-0.5 bg-black/80 border border-gray-800 text-[#e8c76a]/80">
                      NV {currentLvl}/{node.maxLevel}
                    </span>
                  </div>

                  <p className="text-[10px] font-retro text-gray-400 leading-normal mb-3 text-left">{node.description}</p>
                </div>

                {/* Level Bar & Upgrade Button */}
                <div className="space-y-2 pt-2 border-t border-gray-900">
                  <div className="w-full bg-black/85 h-2 overflow-hidden border border-gray-900">
                    <div
                      className={`h-full transition-all duration-300 ${blocked ? 'bg-gray-800' : 'bg-gradient-to-r from-[#7a5312] to-[#e8c76a]'}`}
                      style={{ width: `${(currentLvl / node.maxLevel) * 100}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleUpgradeNode(node)}
                    disabled={!canAfford || isMax || blocked}
                    className={`w-full py-2 px-3 font-pixel text-[9px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMax
                        ? 'bg-[#1c140e] border border-[#b8860b] text-[#e8c76a] opacity-90 cursor-default shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]'
                        : blocked
                        ? 'bg-black/20 border-gray-900 text-gray-600 cursor-not-allowed'
                        : canAfford
                        ? 'bg-gradient-to-r from-[#4d320b] to-[#1a1205] border border-[#b8860b] text-[#e8c76a] shadow-[0_0_8px_rgba(184,134,11,0.25)] hover:brightness-125'
                        : 'bg-black/30 border-gray-950 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      'NÍVEL MÁXIMO ALCANÇADO'
                    ) : blocked ? (
                      <span className="flex items-center gap-1 text-gray-500 font-sans text-[8px] uppercase font-bold">
                        <Lock className="w-3 h-3" /> BLOQUEADO POR {getBlockedByName(node)}
                      </span>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" /> EVOLUIR ({cost} 💎)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-[#b8860b]/20">
          <p className="text-[9px] font-retro text-gray-400 italic">
            * Dica: Derrote chefes e complete andares para ganhar mais Cristais de Sangue.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/60 text-[#e8c76a] font-pixel text-[9px] uppercase shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </motion.div>
  );
};
