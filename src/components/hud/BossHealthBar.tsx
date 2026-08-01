import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const BossHealthBar: React.FC = () => {
  const { bossHealth, bossMaxHealth, bossActive, bossName } = useGameStore();

  if (!bossActive) return null;

  const healthPct = Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100));

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-80 md:w-[450px] bg-[#171309] border-2 border-[#b8860b] px-3 py-2 shadow-[4px_4px_0px_#000000] z-50 rounded-none pointer-events-none flex flex-col gap-1 select-none">
      <div className="flex justify-between items-center text-[10px] md:text-xs font-pixel tracking-wider">
        <span className="text-red-500 uppercase font-bold drop-shadow-[0_2px_0_#000000]">
          💀 {bossName || 'SENHOR DAS SOMBRAS'}
        </span>
        <span className="text-[#ebe2d0] font-mono drop-shadow-[0_2px_0_#000000]">
          {Math.round(bossHealth)} / {bossMaxHealth} HP
        </span>
      </div>

      {/* Segmented Gothic Health Bar */}
      <div className="w-full h-4 bg-[#110e05] border border-[#5b403c] p-0.5 relative overflow-hidden">
        {/* Underlay glow */}
        <div
          className="h-full bg-gradient-to-r from-red-950 via-[#990000] to-red-600 transition-all duration-100 ease-out"
          style={{ width: `${healthPct}%` }}
        />

        {/* Retro 16-bit scanlines overlay on bar */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[linear-gradient(rgba(0,0,0,0.4)_50%,transparent_50%)] bg-[length:100%_4px]" />
      </div>
    </div>
  );
};
