import React from 'react';
import { PlayerStats } from '../../types/game';

interface GameStatsProps {
  stats: PlayerStats;
}

export const GameStats: React.FC<GameStatsProps> = ({ stats }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-black/80 border-2 border-amber-900/80 px-4 py-2 rounded-lg text-center backdrop-blur shadow-xl flex flex-col items-center">
      <div className="font-pixel text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
        <span>🏰 CALABOUÇO NIVEL {stats.floorDepth || 1}</span>
      </div>
      <div className="flex items-center gap-3 text-xs font-retro text-gray-300 pt-0.5">
        <span className="text-red-400">ABATES: <strong className="text-white">{stats.kills}</strong></span>
        <span>•</span>
        <span className="text-emerald-400">PONTOS: <strong className="text-white">{stats.score}</strong></span>
        <span>•</span>
        <span className="text-blue-300">{formatTime(stats.timeSurvivedSeconds)}</span>
      </div>
    </div>
  );
};
