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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center z-50"
          style={{ width: isBoss ? '400px' : '280px' }}
        >
          {/* Level and Name */}
          <div className="flex items-center gap-2 mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
            {currentTarget.level && (
              <span className="text-[#facc15] font-bold text-sm tracking-wider">
                {currentTarget.level}
              </span>
            )}
            <h2 
              className={`font-serif tracking-widest uppercase text-center ${isBoss ? 'text-2xl text-[#ef4444]' : 'text-base text-gray-200'}`}
              style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
            >
              {currentTarget.name}
            </h2>
          </div>

          {/* Health Bar Container */}
          <div className="w-full relative">
            {/* Ornate border (simulated with layered shadows/borders) */}
            <div className={`w-full h-4 bg-[#0a0508] border-2 ${isBoss ? 'border-[#b8860b]' : 'border-gray-600'} rounded shadow-[0_0_10px_rgba(0,0,0,0.8)] overflow-hidden relative`}>
              {/* HP Fill */}
              <motion.div
                className="h-full bg-gradient-to-r from-[#7f1d1d] to-[#ef4444]"
                initial={{ width: `${hpPercent}%` }}
                animate={{ width: `${hpPercent}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
              
              {/* HP Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-white font-bold tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                  {Math.ceil(currentTarget.hp).toLocaleString()} / {currentTarget.maxHp.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Decorators */}
            {isBoss && (
              <>
                <div className="absolute -left-3 -top-2 text-[#b8860b] text-xl drop-shadow-md">✧</div>
                <div className="absolute -right-3 -top-2 text-[#b8860b] text-xl drop-shadow-md">✧</div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
