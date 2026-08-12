import React from 'react';
import { PlayerStats } from '../types/game';
import { RotateCcw, Home, Skull, Flame, Trophy, Clock } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-blood-pulse">
      {/* Dark vignette border representing tunneling vision */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black pointer-events-none z-10" />

      <div className="w-full max-w-md bg-[#0c0a09] border-4 border-double border-[#b8860b] p-6 shadow-[0_0_60px_rgba(153,0,0,0.85)] flex flex-col items-center space-y-5 text-center relative z-20 font-pixel">
        {/* Cantoneiras */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#b8860b]" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#b8860b]" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#b8860b]" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#b8860b]" />

        {/* Title Header */}
        <div className="space-y-2">
          <div className="p-3 bg-red-950/40 border border-red-900/60 mx-auto w-fit">
            <Skull className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <h2 className="text-xl md:text-2xl font-gothic text-red-600 font-bold uppercase tracking-wider">
            VOCÊ ESTÁ MORTO
          </h2>
          <p className="font-retro text-xs text-gray-400 uppercase">
            A terra consome seus restos mortais... Olhos carniceiros espreitam seus pertences no cadáver.
          </p>
        </div>

        {/* Cause of Death & Items Lost Card */}
        <div className="w-full bg-red-950/20 border border-red-900/40 p-3 text-left space-y-1.5 font-retro text-xs text-red-200">
          <div className="flex items-center gap-1.5 text-red-400 font-bold font-pixel text-[8px]">
            <Skull className="w-3.5 h-3.5" />
            <span>GOLPE FATAL:</span>
          </div>
          <p className="text-gray-300 leading-normal">
            Sucumbiu a lesões violentas em combate direto no calabouço.
          </p>
          <div className="pt-1.5 border-t border-red-900/30 flex items-center justify-between text-[8px] text-amber-300 font-pixel font-bold">
            <span>PERDIDO NO CADÁVER:</span>
            <span className="text-white font-bold">{stats.curatives?.bandages || 0} ATAD., {stats.curatives?.antidotes || 0} ANTID.</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full font-retro text-sm">
          <div className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 font-pixel text-[8px] mb-1 font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>PONTUAÇÃO</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.score.toLocaleString()}</span>
          </div>

          <div className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-red-400 font-pixel text-[8px] mb-1 font-bold">
              <Skull className="w-3.5 h-3.5 text-red-500" />
              <span>ABATES</span>
            </div>
            <span className="text-lg font-bold text-white">{stats.kills}</span>
          </div>

          <div className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col items-center col-span-2">
            <div className="flex items-center gap-1 text-amber-500 font-pixel text-[8px] mb-1 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>ALCANÇADO</span>
            </div>
            <span className="text-xs text-white uppercase font-bold">CALABOUÇO NIVEL {stats.floorDepth || 1} (NV {stats.level})</span>
          </div>

          <div className="bg-[#120e0d] border border-[#b8860b]/20 p-3 flex flex-col items-center col-span-2">
            <div className="flex items-center gap-1 text-blue-400 font-pixel text-[8px] mb-1 font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>TEMPO SOBREVIVIDO</span>
            </div>
            <span className="text-sm text-white font-bold">{formatTime(stats.timeSurvivedSeconds)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              // Dispatch CustomEvent to let Phaser handle respawn
              window.dispatchEvent(new CustomEvent('respawn-player'));
            }}
            className="w-full py-3.5 bg-[#990000] hover:bg-red-900 text-red-100 font-pixel text-[9px] border border-red-600 shadow-[0_0_15px_rgba(153,0,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RENASCER NA VILA (PERDA DE XP)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onGoHome();
            }}
            className="w-full py-2 bg-[#171309] hover:bg-[#282216] border border-[#b8860b]/60 text-[#e8c76a] font-pixel text-[9px] uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]"
          >
            <Home className="w-4 h-4" />
            <span>RETORNAR AO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
