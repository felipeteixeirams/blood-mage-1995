import React from 'react';
import { PlayerStats } from '../../types/game';

interface PlayerStatusProps {
  stats: PlayerStats;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ stats }) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100));

  return (
    <div className="pointer-events-auto bg-black/85 border-2 border-[#4a2e35] p-3 rounded-lg shadow-2xl backdrop-blur flex items-center gap-3">
      {/* Blood Life Globe */}
      <div className="relative w-12 h-12 rounded-full bg-black border-2 border-red-900 overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.9)]">
        <div
          className="absolute bottom-0 w-full bg-gradient-to-t from-red-950 via-red-600 to-red-500 transition-all duration-200"
          style={{ height: `${hpPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-pixel text-[10px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
          {Math.ceil(stats.hp)}
        </div>
      </div>

      {/* Bars Column */}
      <div className="flex flex-col gap-1.5 min-w-[130px] md:min-w-[180px]">
        {/* Health Bar */}
        <div className="w-full h-3 bg-gray-950 border border-red-900/80 rounded-sm overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-200"
            style={{ width: `${hpPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-red-100 font-bold">
            HP {Math.ceil(stats.hp)} / {stats.maxHp}
          </span>
        </div>

        {/* Mana Bar */}
        <div className="w-full h-2.5 bg-gray-950 border border-blue-900/80 rounded-sm overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-blue-800 to-blue-500 transition-all duration-200"
            style={{ width: `${manaPercent}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-blue-100">
            MP {Math.ceil(stats.mana)} / {stats.maxMana}
          </span>
        </div>

        {/* XP Bar & Level Badge */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-pixel text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">
            NV {stats.level}
          </span>
          <div className="flex-1 h-2 bg-gray-950 border border-emerald-900/80 rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
