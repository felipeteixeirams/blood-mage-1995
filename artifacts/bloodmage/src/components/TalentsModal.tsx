import React from 'react';
import { motion } from 'motion/react';
import { Flame, Heart, Droplet, Zap, Shield, Sparkles, X, PlusCircle, Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import talentsData from '../data/talents.json';
import { soundEngine } from '../utils/soundEngine';

interface TalentsModalProps {
  onClose: () => void;
}

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

export const TalentsModal: React.FC<TalentsModalProps> = ({ onClose }) => {
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none"
    >
      <div className="bg-[#120a0e] border-4 border-red-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-100 shadow-[0_0_35px_rgba(220,38,38,0.35)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-900/60 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-red-500 animate-pulse" />
            <div>
              <h2 className="text-2xl font-gothic text-red-300">ÁRVORE DE TALENTOS DO HEMOMANTE</h2>
              <p className="text-xs text-red-400/80 font-retro">Evolução permanente alimentada por Cristais de Sangue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency Display */}
        <div className="bg-red-950/40 border border-red-800/80 rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-6 h-6 text-red-500 fill-red-500 animate-bounce" />
            <span className="text-xs font-pixel text-red-200">CRISTAIS DE SANGUE:</span>
          </div>
          <span className="text-xl font-pixel text-red-400 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            {bloodCrystals} 💎
          </span>
        </div>

        {/* Talent Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                className={`p-4 rounded-lg border-2 transition-all flex flex-col justify-between ${
                  isMax
                    ? 'bg-amber-950/40 border-amber-600'
                    : blocked
                    ? 'bg-gray-950/20 border-gray-800 opacity-50'
                    : canAfford
                    ? 'bg-red-950/30 border-red-600 hover:border-red-400'
                    : 'bg-black/60 border-gray-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-black/60 rounded border border-red-900 text-red-400">
                        <IconComp className="w-5 h-5" />
                      </span>
                      <h3 className="text-sm font-gothic font-bold text-red-200">{node.name}</h3>
                    </div>
                    <span className="text-xs font-pixel px-2 py-0.5 bg-black/80 rounded border border-gray-700 text-amber-400">
                      Nível {currentLvl}/{node.maxLevel}
                    </span>
                  </div>

                  <p className="text-xs font-retro text-gray-300 leading-snug mb-3">{node.description}</p>
                </div>

                {/* Level Bar & Upgrade Button */}
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <div className="w-full bg-black/80 h-2 rounded-full overflow-hidden border border-gray-800">
                    <div
                      className={`h-full transition-all duration-300 ${blocked ? 'bg-gray-700' : 'bg-red-600'}`}
                      style={{ width: `${(currentLvl / node.maxLevel) * 100}%` }}
                    />
                  </div>

                  <button
                    onClick={() => handleUpgradeNode(node)}
                    disabled={!canAfford || isMax || blocked}
                    className={`w-full py-2 px-3 rounded font-pixel text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isMax
                        ? 'bg-amber-950/80 border border-amber-600 text-amber-300 opacity-90 cursor-default'
                        : blocked
                        ? 'bg-gray-900 border border-gray-850 text-gray-500 cursor-not-allowed'
                        : canAfford
                        ? 'bg-red-700 hover:bg-red-600 border border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                        : 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      'NÍVEL MÁXIMO ALCANÇADO'
                    ) : blocked ? (
                      <span className="flex items-center gap-1.5 text-gray-500 font-sans text-[10px] uppercase font-bold">
                        <Lock className="w-3.5 h-3.5" /> BLOQUEADO POR {getBlockedByName(node)}
                      </span>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" /> EVOLUIR ({cost} 💎)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-red-900/40">
          <p className="text-[11px] font-retro text-gray-400 italic">
            * Dica: Derrote chefes e complete andares para ganhar mais Cristais de Sangue.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 font-pixel text-xs rounded transition-all cursor-pointer"
          >
            FECHAR
          </button>
        </div>
      </div>
    </motion.div>
  );
};
