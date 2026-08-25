import React, { useRef } from 'react';
import { PlayerStats } from '../types/game';
import { RotateCcw, Home, Skull, Flame, Trophy, Clock } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { useGamepadUINavigation } from '../hooks/useGamepadUINavigation';
import { useGameStore } from '../store/gameStore';

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onGoHome }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Suporte a Gamepad (D-pad Up/Down, Botão A confirma)
  useGamepadUINavigation({
    containerRef,
    isActive: true,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-blood-pulse">
      {/* Dark vignette border representing tunneling vision */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black pointer-events-none z-10" />

      <div
        ref={containerRef}
        className="w-full max-w-md bg-[#171309] border-4 border-[#B8860B] rounded-none p-6 shadow-[0_0_60px_rgba(153,0,0,0.85)] flex flex-col items-center space-y-6 text-center relative z-20"
      >
        {/* Title Header */}
        <div className="space-y-2">
          <div className="p-3 bg-red-950/40 rounded-none border border-[#B8860B]/60 mx-auto w-fit">
            <Skull className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <h2 className="text-4xl font-gothic text-red-600 font-bold uppercase tracking-wide">
            VOCÊ ESTÁ MORTO
          </h2>
          <p className="font-retro text-xs text-gray-400">
            A terra consome seus restos mortais... Olhos carniceiros espreitam seus pertences no cadáver.
          </p>
        </div>

        {/* Cause of Death & Items Lost Card */}
        <div className="w-full bg-red-950/40 border border-red-900/80 p-3 text-left space-y-1 font-retro text-xs text-red-200">
          <div className="flex items-center gap-1.5 text-red-400 font-bold font-pixel text-[10px]">
            <Skull className="w-3.5 h-3.5" />
            <span>GOLPE FATAL:</span>
          </div>
          <p className="text-gray-300">
            Sucumbiu a lesões violentas em combate direto no calabouço.
          </p>
          <div className="pt-1.5 border-t border-red-900/50 flex items-center justify-between text-[10px] text-amber-300 font-pixel">
            <span>PERTENCES PERDIDOS NO CADÁVER:</span>
            <span className="text-white font-bold">{stats.curatives?.bandages || 0} Ataduras, {stats.curatives?.antidotes || 0} Antídotos</span>
          </div>
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
              <span>TEMPO SOBREVIVIDO</span>
            </div>
            <span className="text-base text-white">{formatTime(stats.timeSurvivedSeconds)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full pt-2">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              // Comando tipado via store — ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md
              useGameStore.getState().setRespawnRequested(true);
            }}
            className="w-full py-4 bg-gradient-to-r from-red-950 via-red-900 to-red-950 hover:from-red-900 hover:to-red-800 focus:from-red-900 focus:to-red-800 text-red-100 font-pixel text-xs rounded-none border border-red-600 shadow-[0_0_20px_rgba(153,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RENASCER NA VILA (PERDA DE XP)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onGoHome();
            }}
            className="w-full py-3 bg-black/80 hover:bg-gray-950 focus:bg-gray-900 border border-gray-800 focus:border-gray-500 rounded-none text-gray-400 font-retro text-sm flex items-center justify-center gap-2 hover:border-gray-600 transition-colors cursor-pointer outline-none"
          >
            <Home className="w-4 h-4" />
            <span>RETORNAR AO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
