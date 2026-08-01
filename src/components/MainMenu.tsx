import React from 'react';
import { Play, Settings, BookOpen, Trophy, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenBestiary: () => void;
  onOpenHighScores: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenBestiary,
  onOpenHighScores,
  isMuted,
  onToggleMute,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative w-full h-full min-h-screen bg-[#0d0709] flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden select-none"
    >
      {/* Background Animated Graveyard & Fog Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-[#0a0508] to-black pointer-events-none" />

      {/* Floating Blood Embers */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none animate-pulse" />

      {/* Top Header Controls */}
      <div className="relative z-10 w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded border border-red-900/50">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-pixel text-red-400">PWA 1.0.0 • 1995 RETRO EDITION</span>
        </div>

        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onToggleMute();
          }}
          className="p-2.5 bg-black/80 hover:bg-red-950 border border-red-900/60 rounded text-red-400 hover:text-red-200 transition-colors shadow-lg cursor-pointer"
          title="Alternar Áudio"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-red-500" />}
        </button>
      </div>

      {/* Center Hero Area */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center my-auto space-y-6 max-w-2xl"
      >
        {/* Title Logo */}
        <div className="space-y-2">
          <p className="text-xs md:text-sm font-pixel text-red-600 tracking-widest uppercase">
            — NECROARCADE ISOMÉTRICO 2.5D —
          </p>
          <h1 className="text-5xl md:text-7xl font-gothic text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-600 to-red-950 drop-shadow-[0_5px_15px_rgba(185,28,28,0.8)] tracking-wide">
            BLOODMAGE 1995
          </h1>
          <p className="text-sm md:text-base font-retro text-amber-200/80 max-w-md mx-auto">
            Canalize magia proibida e extermine hordas necromânticas em combate visceral
          </p>
        </div>

        {/* Action Buttons Stack */}
        <div className="flex flex-col gap-3.5 w-full max-w-xs pt-4">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onStartGame();
            }}
            className="w-full group relative py-4 px-6 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-emerald-700 text-emerald-100 font-pixel text-sm rounded gothic-border border-emerald-600/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-emerald-300 text-emerald-300 group-hover:scale-110 transition-transform" />
            <span>INICIAR RITUAL</span>
          </button>

          <div className="grid grid-cols-3 gap-2.5 w-full">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenBestiary();
              }}
              className="py-3 px-2 bg-black/80 hover:bg-red-950/80 border border-red-900/60 rounded text-red-300 font-retro text-base flex flex-col items-center justify-center gap-1 hover:border-red-600 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>BESTIÁRIO</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenHighScores();
              }}
              className="py-3 px-2 bg-black/80 hover:bg-amber-950/80 border border-amber-900/60 rounded text-amber-300 font-retro text-base flex flex-col items-center justify-center gap-1 hover:border-amber-500 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>RECORDES</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenSettings();
              }}
              className="py-3 px-2 bg-black/80 hover:bg-gray-900 border border-gray-800 rounded text-gray-300 font-retro text-base flex flex-col items-center justify-center gap-1 hover:border-gray-600 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>OPÇÕES</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Instructions */}
      <div className="relative z-10 text-center text-xs text-gray-500 font-mono space-y-1 pb-2">
        <p>Controles: [WASD / Joysticks Virtuais Mobile] • [Mouse / Touch Para Mirar] • [1, 2, 3 Magias]</p>
        <p className="text-gray-600">Desenvolvido com Phaser 3 + React • PWA Suportado</p>
      </div>
    </motion.div>
  );
};
