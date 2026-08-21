import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check, Gift } from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../utils/soundEngine';
import achievementsData from '../data/achievements.json';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { achievements, redeemAchievement } = useGameStore();

  const handleRedeem = (id: string, rewardAmount: number) => {
    soundEngine.playContractComplete();
    redeemAchievement(id, rewardAmount);
  };

  return (
    <ModalBase onClose={onClose} title="TROFÉUS E CONQUISTAS">
      <div className="w-full h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {achievementsData.map((achievement) => {
          const state = achievements[achievement.id];
          const isUnlocked = state?.unlocked;
          const isRedeemed = state?.redeemed;
          const isReadyToRedeem = isUnlocked && !isRedeemed;

          return (
            <div
              key={achievement.id}
              className={`relative flex items-center justify-between p-4 border rounded-md transition-all ${
                isReadyToRedeem
                  ? 'border-[#8c1f22] bg-[#1a0a0a] shadow-[0_0_15px_rgba(140,31,34,0.3)] animate-pulse'
                  : isRedeemed
                  ? 'border-[#3a2d1d] bg-[#0b0a09] opacity-70'
                  : 'border-[#3a2d1d] bg-black/40'
              }`}
            >
              {/* Info */}
              <div className="flex flex-col gap-1">
                <div className={`font-gothic text-lg ${isReadyToRedeem ? 'text-[#ef4444]' : isRedeemed ? 'text-[#a88d5b]' : 'text-gray-500'}`}>
                  {achievement.title}
                </div>
                <div className="font-pixel text-[10px] text-gray-400 max-w-[280px] leading-relaxed">
                  {achievement.description}
                </div>
                
                {/* Progress bar (simplified for now, you can enhance this with actual metric tracking) */}
                {!isUnlocked && (
                    <div className="mt-2 w-full max-w-[200px] h-1.5 bg-black rounded-full overflow-hidden border border-[#2a1d12]">
                        <div className="h-full bg-gray-700" style={{ width: '0%' }}></div>
                    </div>
                )}
              </div>

              {/* Action / Status */}
              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="flex items-center gap-1 font-pixel text-xs text-[#ef4444]">
                  <Gift className="w-3 h-3" />
                  +{achievement.reward}
                </div>
                
                {isReadyToRedeem && (
                  <button
                    onClick={() => handleRedeem(achievement.id, achievement.reward)}
                    className="px-3 py-1.5 bg-[#8c1f22] hover:bg-[#ef4444] text-[#f0d8a8] border border-[#d4af37] font-pixel text-xs cursor-pointer transition-colors whitespace-nowrap"
                  >
                    RESGATAR
                  </button>
                )}
                
                {isRedeemed && (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-black/60 border border-[#3a2d1d] text-[#a88d5b] font-pixel text-[10px]">
                    <Check className="w-3 h-3 text-[#d4af37]" />
                    RESGATADO
                  </div>
                )}
                
                {!isUnlocked && (
                  <div className="px-3 py-1.5 bg-black/40 border border-[#1a1410] text-gray-600 font-pixel text-[10px]">
                    BLOQUEADO
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
};