import React from 'react';
import { PlayerStats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface GameStatsProps {
  stats: PlayerStats;
}

const BIOME_NAMES: Record<string, string> = {
  fosso_chagas: 'FOSSO DAS CHAGAS',
  catacumbas_martires: 'CATACUMBAS DOS MÁRTIRES',
  santuario_sangue: 'SANTUÁRIO DE SANGUE',
};

export const GameStats: React.FC<GameStatsProps> = ({ stats }) => {
  const { currentBiome, bloodCrystals } = useGameStore();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-[#0c0a09]/80 border border-[#b8860b]/30 px-3 py-1 text-center backdrop-blur shadow-[2px_2px_8px_rgba(0,0,0,0.85)] flex flex-row items-center justify-center gap-3 max-w-full overflow-hidden whitespace-nowrap">
      <span className="font-pixel text-[8px] text-[#e8c76a] font-bold tracking-wider">
        🏰 {BIOME_NAMES[currentBiome] || 'CALABOUÇO'} (ANDAR {stats.floorDepth || 1})
      </span>
      <span className="text-gray-600 text-[8px]">•</span>
      <div className="flex items-center gap-2.5 text-[8px] font-pixel text-gray-300">
        <span className="text-red-400">ABATES: <strong className="text-white">{stats.kills}</strong></span>
        <span className="text-emerald-400">PONTOS: <strong className="text-white">{stats.score}</strong></span>
        <span className="text-rose-400">💎 <strong className="text-rose-300">{bloodCrystals}</strong></span>
        <span className="text-blue-300">{formatTime(stats.timeSurvivedSeconds)}</span>
      </div>
    </div>
  );
};
