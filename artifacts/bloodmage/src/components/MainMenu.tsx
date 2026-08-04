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
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Background Portal Swirl */}
      <div className="portal-swirl" />
      
      {/* Stone Arch Frame */}
      <div className="stone-arch-frame hidden md:block" />

      {/* Floating Blood Embers */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none animate-pulse z-0" />

      {/* Top Header Controls (Mute / Info) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-gray-800 shadow-black">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-pixel text-gray-400">PWA 1.0.0</span>
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onToggleMute();
          }}
          className="p-3 stone-btn rounded cursor-pointer pointer-events-auto"
          title="Toggle Audio"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#d4af37]" />}
        </button>
      </div>

      {/* Center Hero Area */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-3xl w-full px-4 mt-8 md:mt-0"
      >
        {/* Title Logo */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-8xl font-gothic text-red-700 tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,1)] text-shadow-sm shadow-black relative inline-block">
            <span className="absolute inset-0 text-red-900 translate-y-1 z-[-1] blur-[2px]">BLOODMAGE</span>
            BLOODMAGE<br/>
            <span className="text-4xl md:text-6xl text-red-800">1995</span>
          </h1>
        </div>

        {/* Action Buttons Altar Area */}
        <div className="w-full flex flex-col items-center gap-4 bg-black/40 p-6 md:p-8 rounded-xl border border-gray-900/50 backdrop-blur-sm max-w-md mx-auto">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onStartGame();
            }}
            className="w-full py-4 stone-btn font-pixel text-sm md:text-base cursor-pointer pointer-events-auto flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-900/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Play className="w-5 h-5 text-red-500" />
            <span>START GAME</span>
          </button>

          <div className="flex w-full gap-3">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenBestiary();
              }}
              className="flex-1 py-3 stone-btn font-pixel text-[10px] md:text-xs cursor-pointer pointer-events-auto flex flex-col items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>LORE</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenHighScores();
              }}
              className="flex-1 py-3 stone-btn font-pixel text-[10px] md:text-xs cursor-pointer pointer-events-auto flex flex-col items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-[#d4af37]" />
              <span>SCORES</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenSettings();
              }}
              className="flex-1 py-3 stone-btn font-pixel text-[10px] md:text-xs cursor-pointer pointer-events-auto flex flex-col items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>OPTIONS</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Footer Instructions */}
      <div className="absolute bottom-4 z-10 w-full text-center px-4">
        <p className="text-[10px] md:text-xs font-retro text-gray-500 tracking-widest uppercase">
          L CLICK - ATTACK &nbsp;|&nbsp; WASD - MOVE &nbsp;|&nbsp; ESC - MENU
        </p>
      </div>
    </motion.div>
  );
};
