import React from 'react';
import { PlayerStats } from '../types/game';
import { RotateCcw, Home, Skull, Flame, Trophy, Clock, Heart } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onGoHome }) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-blood-pulse">
      <div className="w-full max-w-md bg-[#120a0e] border-4 border-red-900 rounded-xl p-6 shadow-[0_0_60px_rgba(220,38,38,0.7)] flex flex-col items-center space-y-6 text-center">
        {/* Title Header */}
        <div className="space-y-2">
          <div className="p-3 bg-red-950/80 rounded-full border border-red-700 mx-auto w-fit">
            <Skull className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-gothic text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-950">
            SEU SANGUE FOI DERRAMADO
          </h2>
          <p className="font-retro text-sm text-gray-400">
            O ritual chegou ao fim, mas sua alma permanece faminta por vingança.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full font-retro text-sm">
          <div className="bg-black/80 border border-red-900/60 p-3 rounded flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-400 font-pixel text-xs mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>PONTUAÇÃO</span>
            </div>
            <span className="text-xl font-bold text-white">{stats.score.toLocaleString()}</span>
          </div>

          <div className="bg-black/80 border border-red-900/60 p-3 rounded flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-red-400 font-pixel text-xs mb-1">
              <Skull className="w-4 h-4 text-red-500" />
              <span>ABATES</span>
            </div>
            <span className="text-xl font-bold text-white">{stats.kills}</span>
          </div>

          <div className="bg-black/80 border border-red-900/60 p-3 rounded flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-500 font-pixel text-xs mb-1">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>ALCANÇADO</span>
            </div>
            <span className="text-base text-white">CALABOUÇO NIVEL {stats.floorDepth || 1} (NV {stats.level})</span>
          </div>

          <div className="bg-black/80 border border-red-900/60 p-3 rounded flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-blue-400 font-pixel text-xs mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>TEMPO</span>
            </div>
            <span className="text-base text-white">{formatTime(stats.timeSurvivedSeconds)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-4 bg-gradient-to-r from-red-950 via-red-800 to-red-950 hover:from-red-900 hover:to-red-700 text-red-100 font-pixel text-sm rounded border border-red-600/80 shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RENASCER (RETRY)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onGoHome();
            }}
            className="w-full py-3 bg-black/80 hover:bg-gray-900 border border-gray-800 rounded text-gray-300 font-retro text-base flex items-center justify-center gap-2 hover:border-gray-600 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
