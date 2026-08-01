import React from 'react';
import { PlayerStats } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

interface GameStatsProps {
  stats: PlayerStats;
}

const BIOME_NAMES: Record<string, string> = {
  fosso_chagas: 'Fosso das Chagas',
  catacumbas_martires: 'Catacumbas dos Mártires',
  santuario_sangue: 'Santuário de Sangue',
};

export const GameStats: React.FC<GameStatsProps> = ({ stats }) => {
  const { currentBiome, bloodCrystals } = useGameStore();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-black/85 border-2 border-amber-900/80 px-4 py-2 rounded-lg text-center backdrop-blur shadow-xl flex flex-col items-center">
      <div className="font-pixel text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <span>🏰 {BIOME_NAMES[currentBiome] || 'Calabouço'} - ANDAR {stats.floorDepth || 1}</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] font-retro text-gray-300 pt-0.5">
        <span className="text-red-400">ABATES: <strong className="text-white">{stats.kills}</strong></span>
        <span>•</span>
        <span className="text-emerald-400">PONTOS: <strong className="text-white">{stats.score}</strong></span>
        <span>•</span>
        <span className="text-rose-400">💎 <strong className="text-rose-300">{bloodCrystals}</strong></span>
        <span>•</span>
        <span className="text-blue-300">{formatTime(stats.timeSurvivedSeconds)}</span>
      </div>
    </div>
  );
};
