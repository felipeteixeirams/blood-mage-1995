import React from 'react';
import { HighScoreRecord } from '../types/game';
import { Trophy, Skull, Flame } from 'lucide-react';
import { ModalBase } from './ui/ModalBase';
import { soundEngine } from '../utils/soundEngine';

interface HighScoresModalProps {
  scores: HighScoreRecord[];
  onClose: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ scores, onClose }) => {
  return (
    <ModalBase
      title="RITUAIS DE RECORDES"
      subtitle="Eternizados no livro das chagas e glória eterna"
      onClose={() => {
        soundEngine.playButtonClick();
        onClose();
      }}
    >
      <div className="flex flex-col gap-4 max-h-[60vh] font-pixel text-xs">
        {/* Scores Table */}
        <div className="overflow-y-auto space-y-2 pr-1">
          {scores.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-retro text-base text-left">
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
                  <span className="font-pixel text-[10px] w-6 text-center text-amber-400">
                    #{index + 1}
                  </span>
                  <div className="text-left">
                    <div className="font-pixel text-[9px] text-white flex items-center gap-2">
                      <span>{record.score.toLocaleString()} PTS</span>
                      <span className="text-[8px] text-amber-500 font-mono">
                        [NÍVEL {record.wave}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 pt-0.5 font-retro">
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

                <div className="text-[8px] font-mono text-gray-500">
                  {record.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalBase>
  );
};
