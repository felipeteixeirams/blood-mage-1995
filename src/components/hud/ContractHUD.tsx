import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ChevronDown, ChevronUp, Scroll } from 'lucide-react';

export const ContractHUD: React.FC = () => {
  const { activeContracts } = useGameStore();
  const [isOpen, setIsOpen] = useState(false); // Colapsado por padrão no mobile-first!

  if (activeContracts.length === 0) return null;

  return (
    <div className="bg-[#0c0a09]/95 border border-[#b8860b]/40 p-1.5 shadow-[4px_4px_10px_rgba(0,0,0,0.85)] w-10 hover:w-48 md:w-48 transition-all duration-300 flex flex-col gap-1.5 relative pointer-events-auto text-left select-none overflow-hidden group">
      {/* Clique na aba do pergaminho para expandir */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center px-0.5 border-b border-[#b8860b]/20 pb-1 text-[8px] text-[#e8c76a] cursor-pointer hover:text-white"
      >
        <div className="flex items-center gap-1">
          <Scroll size={10} className="text-[#e8c76a]" />
          <span className="hidden group-hover:inline md:inline tracking-wider font-bold">CONTRATOS</span>
        </div>
        <div className="hidden group-hover:block md:block">
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      </div>

      {/* Exibe se expandido */}
      {(isOpen || window.innerWidth > 768) && (
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pt-0.5 hidden group-hover:flex md:flex">
          {activeContracts.map((c) => {
            const isDone = c.completed || c.progress >= c.target;
            return (
              <div key={c.id} className="text-[8px] border-b border-gray-900 pb-1.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-1 font-bold">
                  <span className={isDone ? 'text-emerald-400 uppercase line-through' : 'text-[#e8c76a]/90 uppercase'}>
                    {c.label}
                  </span>
                  <span className={isDone ? 'text-emerald-400' : 'text-gray-400'}>
                    {isDone ? 'OK!' : `${c.progress}/${c.target}`}
                  </span>
                </div>
                <span className="text-[7px] text-gray-400 block font-sans mt-0.5 leading-tight">
                  {c.description}
                </span>
                {/* Progress bar rústica */}
                <div className="w-full bg-black h-1 mt-1 overflow-hidden border border-gray-900">
                  <div
                    className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-600' : 'bg-amber-600'}`}
                    style={{ width: `${(c.progress / c.target) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
