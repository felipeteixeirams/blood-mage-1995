import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { RecordEntry } from '../../game/scenes/RecordsScene';
import { loadHighScores } from '../../utils/localStorage';

interface RecordsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

function getFormattedRecords(): RecordEntry[] {
  const highScores = loadHighScores();
  return highScores.map((item, idx) => ({
    name: `BRUXO #${idx + 1}`,
    score: item.score || 0,
    level: item.levelReached || item.wave || 1,
  })).sort((a, b) => b.score - a.score).slice(0, 8);
}

export const RecordsDisplay: React.FC<RecordsDisplayProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<RecordEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecords(getFormattedRecords());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-[#181211] border-4 border-[#5b403c] p-6 max-w-2xl w-full max-h-96 overflow-y-auto shadow-[8px_8px_0px_#000000] space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-[#ab8983] pb-4">
          <h2 className="text-lg font-pixel text-[#e8c25e] uppercase tracking-widest">
            SALÃO DOS RECORDES
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2f2827] text-[#ab8983] hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#524341]">
            <div className="col-span-1 text-[10px] text-gray-500 uppercase font-bold">#</div>
            <div className="col-span-5 text-[10px] text-gray-500 uppercase font-bold">BRUXO</div>
            <div className="col-span-3 text-[10px] text-gray-500 uppercase font-bold text-right">NÍVEL</div>
            <div className="col-span-3 text-[10px] text-gray-500 uppercase font-bold text-right">PONTOS</div>
          </div>

          {/* Rows */}
          {records.map((record, i) => {
            const isTop3 = i < 3;
            const bgColor = isTop3 ? 'bg-[#1c1218]' : i % 2 ? 'bg-[#101116]/90' : 'bg-[#0a0a0f]/60';
            const textColor = isTop3 ? '#f0d8a8' : '#b9b1a0';
            const rankColor = isTop3 ? '#e0b34a' : '#7f7a6c';
            const scoreColor = isTop3 ? '#ffdf9a' : '#c9a227';

            return (
              <div
                key={i}
                className={`grid grid-cols-12 gap-2 px-4 py-2 ${bgColor} rounded border border-[#524341]`}
              >
                <div className={`col-span-1 text-[11px] font-bold`} style={{ color: rankColor }}>
                  {i + 1}
                </div>
                <div
                  className={`col-span-5 text-[11px] font-bold font-mono`}
                  style={{ color: textColor }}
                >
                  {record.name}
                </div>
                <div className={`col-span-3 text-[11px] text-right`} style={{ color: textColor }}>
                  {record.level}
                </div>
                <div
                  className={`col-span-3 text-[11px] font-bold text-right font-mono`}
                  style={{ color: scoreColor }}
                >
                  {record.score.toLocaleString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-[#990000] border border-red-500 text-white text-[10px] uppercase font-bold hover:bg-red-800 transition"
        >
          FECHAR
        </button>
      </div>
    </div>
  );
};

export default RecordsDisplay;
