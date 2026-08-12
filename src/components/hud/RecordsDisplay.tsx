import React, { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';
import type { RecordEntry } from '../../game/scenes/RecordsScene';
import { soundEngine } from '../../utils/soundEngine';

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto select-none">
      <div className="bg-[#0c0a09] border-4 border-double border-[#b8860b] p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-[#E3DAC9] shadow-[0_0_35px_rgba(0,0,0,0.95)] relative flex flex-col gap-4 font-pixel">
        {/* Cantoneiras douradas nos quatro cantos */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#b8860b]/30 pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#e8c76a] animate-pulse" />
            <div>
              <h2 className="text-sm md:text-md font-pixel text-[#e8c76a] font-bold uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                SALÃO DOS RECORDES
              </h2>
              <span className="text-[8px] text-gray-500 font-sans block mt-0.5 uppercase tracking-wide">
                Eternizados no livro das chagas e glória eterna
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-1.5 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/50 text-[#e8c76a] transition-colors cursor-pointer w-8 h-8 flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] active:scale-95 animate-none"
            title="Fechar"
          >
            <X size={14} />
          </button>
        </div>

        {/* Table */}
        <div className="space-y-1.5">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-[#b8860b]/20 font-pixel text-[8px] text-[#e8c76a]/60">
            <div className="col-span-1 font-bold">#</div>
            <div className="col-span-5 font-bold">BRUXO</div>
            <div className="col-span-3 font-bold text-right">NÍVEL</div>
            <div className="col-span-3 font-bold text-right">PONTOS</div>
          </div>

          {/* Rows */}
          {records.map((record, i) => {
            const isTop3 = i < 3;
            const bgColor = isTop3 ? 'bg-[#1c140e]/90' : i % 2 ? 'bg-[#100d0c]/80' : 'bg-[#0a0808]/60';
            const textColor = isTop3 ? 'text-[#fca5a5]' : 'text-gray-300';
            const scoreColor = isTop3 ? 'text-amber-300 font-bold' : 'text-amber-100/80';
            const borderCls = isTop3 ? 'border-[#b8860b]/30' : 'border-[#1f1a17]';

            return (
              <div
                key={i}
                className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center ${bgColor} border ${borderCls} shadow-sm font-retro text-sm`}
              >
                <div className={`col-span-1 font-pixel text-[9px] font-bold ${isTop3 ? 'text-[#e8c76a]' : 'text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className={`col-span-5 font-pixel text-[9px] font-bold ${textColor} tracking-wider`}>
                  {record.name}
                </div>
                <div className="col-span-3 text-right text-xs text-gray-400">
                  {record.level}
                </div>
                <div className={`col-span-3 text-right text-xs ${scoreColor}`}>
                  {record.score.toLocaleString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onClose();
          }}
          className="w-full py-2 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/60 text-[#e8c76a] font-pixel text-[9px] uppercase tracking-wider transition-colors shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          RETORNAR AO ABISMO
        </button>
      </div>
    </div>
  );
};

export default RecordsDisplay;
