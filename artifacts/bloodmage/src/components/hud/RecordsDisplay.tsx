import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { RecordEntry } from '../../game/scenes/RecordsScene';

interface RecordsDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORE_KEY = 'bloodmage.records';

const DEMO: RecordEntry[] = [
  { name: 'VORTHAK', score: 98450, level: 12 },
  { name: 'MORWENNA', score: 87120, level: 11 },
  { name: 'GRIMHOLD', score: 74300, level: 10 },
  { name: 'SELVARA', score: 61980, level: 8 },
  { name: 'DRAKKEN', score: 53040, level: 7 },
  { name: 'ISOLDE', score: 41220, level: 6 },
  { name: 'KHARN', score: 32770, level: 5 },
  { name: 'NYX', score: 21050, level: 4 },
];

function loadRecords(): RecordEntry[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as RecordEntry[];
      if (Array.isArray(list) && list.length) {
        return [...list].sort((a, b) => b.score - a.score).slice(0, 8);
      }
    }
  } catch {
    // ignore
  }
  return DEMO;
}

export const RecordsDisplay: React.FC<RecordsDisplayProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<RecordEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecords(loadRecords());
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
