import React from 'react';
import { PlayerStats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface PlayerStatusProps {
  stats: PlayerStats;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ stats }) => {
  const { settings } = useGameStore();
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100));

  // Determine how many blocks are active (0 to 10)
  const hpBlocks = Math.round(hpPercent / 10);
  const manaBlocks = Math.round(manaPercent / 10);

  return (
    <div className="pointer-events-auto bg-[#181211]/95 border-2 border-[#5b403c] p-2.5 rounded-none shadow-[4px_4px_0px_#000000] backdrop-blur flex items-center gap-3">
      {/* 1995 Gothic Character Portrait with Frame */}
      <div className="relative w-14 h-14 bg-black border-2 border-[#ab8983] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center">
        {/* Animated Portrait breathing glow if enabled */}
        <div
          className={`w-full h-full flex items-center justify-center relative bg-gradient-to-b from-[#110e05] to-[#241e1d] ${
            settings.animatedPortrait ? 'animate-pulse' : ''
          }`}
          style={{ animationDuration: '3s' }}
        >
          {/* Detailed pixelated Bloodmage Face (Inline SVG) */}
          <svg viewBox="0 0 32 32" className="w-12 h-12">
            {/* Hood Shadow */}
            <path d="M 6,32 L 26,32 L 21,12 L 16,6 L 11,12 Z" fill="#120d0c" />
            <path d="M 8,32 L 24,32 L 20,14 L 16,8 L 12,14 Z" fill="#241915" />
            {/* Cloak Trim / Collar */}
            <path d="M 12,28 L 20,28 L 22,32 L 10,32 Z" fill="#7a2a1e" />
            <path d="M 14,28 L 18,28 L 19,30 L 13,30 Z" fill="#990000" />
            {/* Face shadow */}
            <path d="M 12,14 L 20,14 L 18,24 L 14,24 Z" fill="#000000" />
            {/* Glowing Red Occult Eyes */}
            <rect x="13" y="16" width="2" height="2" fill="#ff2400" className={settings.animatedPortrait ? 'animate-ping' : ''} style={{ animationDuration: '1.5s' }} />
            <rect x="17" y="16" width="2" height="2" fill="#ff2400" className={settings.animatedPortrait ? 'animate-ping' : ''} style={{ animationDuration: '1.5s' }} />
            {/* Skeletal nose bridge */}
            <line x1="16" y1="18" x2="16" y2="20" stroke="#4a3728" strokeWidth="1" />
            {/* Mystic Runes in Background */}
            <circle cx="16" cy="16" r="14" stroke="#5b403c" strokeWidth="0.5" strokeDasharray="2, 4" fill="none" />
          </svg>

          {/* Gold Trim Corner accents */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#b8860b] border-r border-b border-black" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#b8860b] border-l border-b border-black" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[#b8860b] border-r border-t border-black" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#b8860b] border-l border-t border-black" />
        </div>
      </div>

      {/* HP/MP segmented bars column */}
      <div className="flex flex-col gap-1.5 min-w-[150px] md:min-w-[200px]">
        {/* Health Segmented Bar (HP) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] font-pixel text-[#e4beb8] tracking-wider uppercase font-bold">HP</span>
            <span className="text-[9px] font-pixel text-red-400 font-bold">{Math.ceil(stats.hp)} / {stats.maxHp}</span>
          </div>
          <div className="w-full h-3 bg-black border border-[#5b403c] p-[1.5px] rounded-none flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`hp-seg-${i}`}
                className={`flex-1 h-full transition-colors duration-150 ${
                  i < hpBlocks
                    ? 'bg-gradient-to-b from-[#ff3333] via-[#990000] to-[#660000] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                    : 'bg-[#1a0f0d]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mana Segmented Bar (MP) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] font-pixel text-[#e4beb8] tracking-wider uppercase font-bold">MP</span>
            <span className="text-[9px] font-pixel text-purple-400 font-bold">{Math.ceil(stats.mana)} / {stats.maxMana}</span>
          </div>
          <div className="w-full h-2.5 bg-black border border-[#5b403c] p-[1.5px] rounded-none flex gap-[2px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`mp-seg-${i}`}
                className={`flex-1 h-full transition-colors duration-150 ${
                  i < manaBlocks
                    ? 'bg-gradient-to-b from-[#b388ff] via-[#5a189a] to-[#3c096c] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                    : 'bg-[#0f0d14]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Level and XP progress bar */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Tarnished Gold Level Badge */}
          <span className="font-pixel text-[9px] text-[#e8c76a] bg-gradient-to-b from-[#241e1d] to-black px-1.5 py-0.5 border border-[#c9a227] shadow-[2px_2px_0px_#000000] font-bold">
            NV {stats.level}
          </span>
          {/* XP Bar */}
          <div className="flex-1 h-2 bg-black border border-[#5b403c] p-[1px] rounded-none relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-800 to-emerald-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Status Conditions & Curatives Bar */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#3a2825]/80">
          {/* Bleeding Indicator */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('use-curative', { detail: 'bandages' }))}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.bleeding
                ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'bg-black/40 border-[#3a2825] text-gray-400 hover:border-gray-600'
            }`}
            title="Sangramento: Pressione Z para usar Atadura"
          >
            <span>🩸</span>
            <span className="hidden sm:inline">[Z]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.bandages || 0}</span>
          </button>

          {/* Poison Indicator */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('use-curative', { detail: 'antidotes' }))}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.poison
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 animate-pulse font-bold shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : 'bg-black/40 border-[#3a2825] text-gray-400 hover:border-gray-600'
            }`}
            title="Veneno: Pressione X para usar Antídoto"
          >
            <span>🍇</span>
            <span className="hidden sm:inline">[X]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.antidotes || 0}</span>
          </button>

          {/* Infection Indicator */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('use-curative', { detail: 'antibiotics' }))}
            className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-pixel border cursor-pointer transition ${
              stats.statusConditions?.infection
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 animate-pulse font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                : 'bg-black/40 border-[#3a2825] text-gray-400 hover:border-gray-600'
            }`}
            title="Infecção: Pressione V para usar Antibiótico"
          >
            <span>🧪</span>
            <span className="hidden sm:inline">[V]</span>
            <span className="font-bold text-[#e8c76a]">{stats.curatives?.antibiotics || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
