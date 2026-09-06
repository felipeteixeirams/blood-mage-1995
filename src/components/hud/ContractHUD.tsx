import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ChevronDown, ChevronUp, Scroll } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

export const ContractHUD: React.FC = () => {
  const { activeContracts } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeContracts || activeContracts.length === 0) return null;

  const completedCount = activeContracts.filter((c) => c.completed || c.progress >= c.target).length;
  const totalCount = activeContracts.length;

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundEngine.playButtonClick();
    setIsOpen((prev) => !prev);
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent?.stopImmediatePropagation?.();
        }}
        title="Abrir Contratos de Sangue"
        className="w-[100px] sm:w-[120px] bg-[#0c0a09]/95 border border-[#b8860b]/50 hover:border-[#b8860b] px-1.5 py-1 text-[#e8c76a] hover:text-white shadow-[2px_2px_4px_rgba(0,0,0,0.8)] transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-between pointer-events-auto select-none font-pixel text-[8px]"
      >
        <div className="flex items-center gap-1 truncate">
          <Scroll size={9} className="text-[#e8c76a] shrink-0" />
          <span className="text-[7px] font-bold tracking-wider uppercase truncate">
            CONTRATOS ({completedCount}/{totalCount})
          </span>
        </div>
        <ChevronDown size={10} className="text-[#b8860b] shrink-0" />
      </button>
    );
  }

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
      className="bg-[#0f0b09]/95 border-2 border-[#b8860b]/50 p-2 shadow-[4px_4px_12px_rgba(0,0,0,0.85)] w-[180px] sm:w-[220px] transition-all duration-200 flex flex-col gap-1.5 relative pointer-events-auto text-left select-none font-pixel"
    >
      {/* Cantoneiras decorativas */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-[#b8860b]" />
      <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-[#b8860b]" />
      <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-[#b8860b]" />
      <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-[#b8860b]" />

      {/* Cabeçalho com botão para minimizar */}
      <div
        onClick={toggleOpen}
        className="flex justify-between items-center border-b border-[#b8860b]/30 pb-1 cursor-pointer hover:brightness-125"
        title="Clique para recolher/minimizar"
      >
        <div className="flex items-center gap-1 text-[8px] text-[#e8c76a] font-bold">
          <Scroll size={9} className="text-[#e8c76a]" />
          <span className="tracking-wider uppercase">CONTRATOS ({completedCount}/{totalCount})</span>
        </div>
        <button
          onClick={toggleOpen}
          className="text-[#e8c76a] hover:text-white p-0.5 transition cursor-pointer"
          title="Recolher painel"
        >
          <ChevronUp size={10} className="text-[#b8860b]" />
        </button>
      </div>

      {/* Lista de Contratos */}
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-0.5">
        {activeContracts.map((c) => {
          const isDone = c.completed || c.progress >= c.target;
          return (
            <div key={c.id} className="text-[8px] border-b border-[#b8860b]/20 pb-1 last:border-0 last:pb-0">
              <div className="flex justify-between items-start gap-1 font-bold">
                <span className={isDone ? 'text-emerald-400 uppercase line-through' : 'text-[#e8c76a]/90 uppercase'}>
                  {c.label}
                </span>
                <span className={isDone ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                  {isDone ? '✓ OK' : `${c.progress}/${c.target}`}
                </span>
              </div>
              <span className="text-[7px] text-gray-400 block font-pixel mt-0.5 leading-tight">
                {c.description}
              </span>
              {/* Barra de progresso */}
              <div className="w-full bg-black h-1 mt-1 overflow-hidden border border-[#b8860b]/30">
                <div
                  className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-600' : 'bg-[#e8c76a]'}`}
                  style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
