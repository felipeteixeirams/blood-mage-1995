import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gift } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const AchievementToast: React.FC = () => {
  const lastUnlockedAchievement = useGameStore((s) => s.lastUnlockedAchievement);
  const [visibleItem, setVisibleItem] = useState<typeof lastUnlockedAchievement>(null);

  useEffect(() => {
    if (!lastUnlockedAchievement) return;
    setVisibleItem(lastUnlockedAchievement);

    const timer = setTimeout(() => {
      setVisibleItem((current) => (current?.id === lastUnlockedAchievement.id ? null : current));
    }, 4500);

    return () => clearTimeout(timer);
  }, [lastUnlockedAchievement]);

  if (!visibleItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={visibleItem.id}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0d0908]/95 border-2 border-[#d4af37] shadow-[0_0_25px_rgba(212,175,55,0.35)] rounded-lg min-w-[300px] max-w-[420px]">
          {/* Trophy Icon Frame */}
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#8c1f22] to-[#3a0a0a] border border-[#d4af37] flex items-center justify-center shrink-0 shadow-inner">
            <Trophy className="w-5 h-5 text-[#f59e0b] drop-shadow-[0_0_6px_#f59e0b]" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-pixel text-[9px] text-[#d4af37] tracking-wider uppercase">
              ★ Conquista Desbloqueada! ★
            </span>
            <span className="font-gothic text-sm text-[#f0d8a8] truncate font-bold">
              {visibleItem.title}
            </span>
            <span className="font-pixel text-[8px] text-gray-400 leading-tight line-clamp-1">
              {visibleItem.description}
            </span>
          </div>

          {/* Reward Badge */}
          {visibleItem.reward > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#1a0a0a] border border-[#8c1f22] rounded shrink-0">
              <Gift className="w-3 h-3 text-[#ef4444]" />
              <span className="font-pixel text-[9px] text-[#ef4444]">
                +{visibleItem.reward}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
