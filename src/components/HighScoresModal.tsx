import React from 'react';
import { HighScoreRecord } from '../types/game';
import { X, Trophy, Skull, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';

interface HighScoresModalProps {
  scores: HighScoreRecord[];
  onClose: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ scores, onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-xl bg-[#120a0e] border-4 border-amber-900/80 rounded-xl p-5 md:p-6 shadow-[0_0_50px_rgba(217,119,6,0.4)] flex flex-col space-y-4 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-900/60 pb-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-gothic text-amber-200">MAIS ALTAS PONTUAÇÕES</h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 hover:bg-amber-950 text-gray-400 hover:text-amber-200 rounded border border-transparent hover:border-amber-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scores Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {scores.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-retro text-base">
              Nenhum ritual registrado ainda. Sobreviva para entrar para a história!
            </div>
          ) : (
            scores.map((record, index) => (
              <div
                key={record.id}
                className={`p-3 rounded border flex items-center justify-between font-retro text-sm ${
                  index === 0
                    ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                    : index === 1
                    ? 'bg-gray-900/80 border-gray-500/80 text-gray-200'
                    : index === 2
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-300/90'
                    : 'bg-black/60 border-red-950 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-xs w-6 text-center text-amber-400">
                    #{index + 1}
                  </span>
                  <div>
                    <div className="font-pixel text-xs text-white flex items-center gap-2">
                      <span>{record.score.toLocaleString()} PTS</span>
                      <span className="text-[10px] text-amber-500 font-mono">
                        [HORDA {record.wave}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Skull className="w-3 h-3 text-red-500" /> {record.kills} Kills
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" /> Nível {record.levelReached}
                      </span>
                      <span>⏱️ {record.timeSurvived}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-gray-500">
                  {record.date}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
