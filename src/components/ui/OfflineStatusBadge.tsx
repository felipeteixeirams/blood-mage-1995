import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineStatusBadgeProps {
  isOnline: boolean;
  showReconnectedToast: boolean;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({
  isOnline,
  showReconnectedToast,
}) => {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[140] pointer-events-none select-none">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="flex items-center gap-2 px-3 py-1 bg-[#1a0f12]/95 border border-[#8b2635] rounded-full shadow-[0_0_15px_rgba(139,38,53,0.6)] backdrop-blur-md"
          >
            <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-[10px] font-pixel text-[#fca5a5] uppercase tracking-wider">
              Modo Offline Ativo (Salvo Localmente)
            </span>
          </motion.div>
        )}

        {isOnline && showReconnectedToast && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="flex items-center gap-2 px-3 py-1 bg-[#0b1a10]/95 border border-[#166534] rounded-full shadow-[0_0_15px_rgba(22,101,52,0.6)] backdrop-blur-md"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-pixel text-emerald-300 uppercase tracking-wider">
              Conexão Online Restaurada
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
