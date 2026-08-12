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
            <div className="text-center py-8 text-[#e8c76a]/60 font-retro text-sm text-left uppercase">
              Nenhum ritual registrado ainda. Sobreviva para entrar para a história!
            </div>
          ) : (
            scores.map((record, index) => (
              <div
                key={record.id}
                className={`p-3 border flex items-center justify-between font-retro text-sm ${
                  index === 0
                    ? 'bg-[#1c140e] border-[#b8860b] text-[#e8c76a] shadow-[0_0_8px_rgba(184,134,11,0.2)]'
                    : index === 1
                    ? 'bg-[#121111]/80 border-gray-650 text-gray-200'
                    : index === 2
                    ? 'bg-[#12100d]/60 border-[#b8860b]/40 text-[#e8c76a]/80'
                    : 'bg-black/40 border-gray-900/60 text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-[9px] w-6 text-center text-[#e8c76a]">
                    #{index + 1}
                  </span>
                  <div className="text-left">
                    <div className="font-pixel text-[9px] text-white flex items-center gap-2">
                      <span>{record.score.toLocaleString()} PTS</span>
                      <span className="text-[8px] text-[#e8c76a] font-mono">
                        [NÍVEL {record.wave}]
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 pt-0.5 font-retro">
                      <span className="flex items-center gap-1">
                        <Skull className="w-3.5 h-3.5 text-red-600" /> {record.kills} Kills
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-[#e8c76a]" /> Nível {record.levelReached}
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
