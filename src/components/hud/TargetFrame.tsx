import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';

export const TargetFrame: React.FC = () => {
  const currentTarget = useGameStore((state) => state.currentTarget);
  const clearStaleTarget = useGameStore((state) => state.clearStaleTarget);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentTarget && currentTarget.hp > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentTarget]);

  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleTarget(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [clearStaleTarget]);

  if (!currentTarget) return null;

  const hpPercent = Math.max(0, Math.min(100, (currentTarget.hp / currentTarget.maxHp) * 100));
  const isBoss = currentTarget.isBoss;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute top-11 md:top-12 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-40 max-w-[90vw]"
          style={{ width: isBoss ? '380px' : '260px' }}
        >
          {/* Level and Name */}
          <div className="flex items-center gap-1.5 mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
            {currentTarget.level && (
              <span className="font-pixel text-[#facc15] font-bold text-[9px] tracking-wider">
                NV {currentTarget.level}
              </span>
            )}
            <h2 
              className={`font-pixel tracking-wider uppercase text-center ${isBoss ? 'text-xs md:text-sm text-[#ef4444]' : 'text-[9px] text-gray-200'}`}
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
            >
              {currentTarget.name}
            </h2>
          </div>

          {/* Health Bar Container */}
          <div className="w-full relative">
            {/* Ornate border */}
            <div className={`w-full h-3 bg-[#0a0508] border ${isBoss ? 'border-[#b8860b]' : 'border-[#4a3b32]'} shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.8)] overflow-hidden relative`}>
              {/* HP Fill */}
              <motion.div
                className="h-full bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#ef4444]"
                initial={{ width: `${hpPercent}%` }}
                animate={{ width: `${hpPercent}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
              
              {/* HP Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center [text-shadow:0_1px_2px_#000,0_0_3px_#000]">
                <span className="text-[7.5px] font-pixel text-white font-bold tracking-wider">
                  {Math.ceil(currentTarget.hp).toLocaleString()} / {currentTarget.maxHp.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Decorators */}
            {isBoss && (
              <>
                <div className="absolute -left-2.5 -top-1.5 text-[#b8860b] text-sm drop-shadow-md">✧</div>
                <div className="absolute -right-2.5 -top-1.5 text-[#b8860b] text-sm drop-shadow-md">✧</div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
