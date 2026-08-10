import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ChevronDown, ChevronUp, Scroll } from 'lucide-react';

export const ContractHUD: React.FC = () => {
  const { activeContracts } = useGameStore();
  const [isOpen, setIsOpen] = useState(true);

  if (activeContracts.length === 0) return null;

  return (
    <div className="bg-[#181211]/95 border-2 border-[#5b403c] p-1.5 shadow-[4px_4px_0px_#000000] w-48 flex flex-col gap-1.5 relative pointer-events-auto text-left select-none">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center px-0.5 border-b border-[#524341] pb-1 text-[8px] text-[#e4beb8] cursor-pointer hover:text-amber-400"
      >
        <div className="flex items-center gap-1">
          <Scroll size={10} className="text-amber-500" />
          <span>CONTRATOS DA RUN</span>
        </div>
        {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pt-0.5">
          {activeContracts.map((c) => {
            const isDone = c.completed || c.progress >= c.target;
            return (
              <div key={c.id} className="text-[8px] border-b border-[#524341]/40 pb-1.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-1 font-bold">
                  <span className={isDone ? 'text-emerald-400 uppercase line-through' : 'text-amber-200 uppercase'}>
                    {c.label}
                  </span>
                  <span className={isDone ? 'text-emerald-400' : 'text-gray-400'}>
                    {isDone ? 'OK!' : `${c.progress}/${c.target}`}
                  </span>
                </div>
                <span className="text-[7px] text-gray-400 block font-sans mt-0.5 leading-normal">
                  {c.description}
                </span>
                {/* Progress bar */}
                <div className="w-full bg-black h-1 mt-1 overflow-hidden border border-[#524341]/50">
                  <div
                    className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-amber-600'}`}
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
