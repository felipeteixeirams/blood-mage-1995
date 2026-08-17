import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';
import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';
import { TitleScene, BASE_W, BASE_H } from '../game/scenes/TitleScene';

interface MainMenuProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onOpenSettings: () => void;
  onOpenHighScores: () => void;
  onOpenAchievements: () => void;
  onOpenBestiary?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onContinueGame,
  onOpenSettings,
  onOpenHighScores,
  onOpenAchievements,
  onOpenBestiary,
  isMuted,
  onToggleMute,
}) => {
  const { setBestiaryOpen } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  const handleOpenBestiary = onOpenBestiary || (() => setBestiaryOpen(true));

  useEffect(() => {
    if (!containerRef.current) return;

    // Create animated Phaser title scene canvas
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: BASE_W,
      height: BASE_H,
      backgroundColor: "#0b0a09",
      pixelArt: true,
      roundPixels: true,
      audio: {
        noAudio: true,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [TitleScene],
    });

    game.registry.set("onStartGame", onStartGame);
    game.registry.set("onContinueGame", onContinueGame);
    game.registry.set("onOpenSettings", onOpenSettings);
    game.registry.set("onOpenHighScores", onOpenHighScores);
    game.registry.set("onOpenAchievements", onOpenAchievements);
    game.registry.set("onOpenBestiary", handleOpenBestiary);

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Update registry callbacks if props change
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set("onStartGame", onStartGame);
      gameRef.current.registry.set("onContinueGame", onContinueGame);
      gameRef.current.registry.set("onOpenSettings", onOpenSettings);
      gameRef.current.registry.set("onOpenHighScores", onOpenHighScores);
      gameRef.current.registry.set("onOpenAchievements", onOpenAchievements);
      gameRef.current.registry.set("onOpenBestiary", handleOpenBestiary);
    }
  }, [onStartGame, onContinueGame, onOpenSettings, onOpenHighScores, onOpenAchievements, handleOpenBestiary]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full h-full min-h-screen bg-[#0b0a09] flex items-center justify-center overflow-hidden select-none"
    >
      {/* 1. Animated Phaser Title Scene Canvas (Original Lovable Title Screen & HUD) */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-auto z-0"
      />

      {/* 2. Ambient Header Overlay (Discreet Mute & Version Tag) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-[#3a2d1d] shadow-sm pointer-events-auto">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-xs font-pixel text-[#a88d5b]">BLOODMAGE 1995</span>
        </div>

        <button
          onClick={() => {
            soundEngine.playButtonClick();
            onToggleMute();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          className="p-2.5 bg-black/85 hover:bg-black border border-[#6b5a3a] hover:border-[#a88d5b] rounded cursor-pointer pointer-events-auto shadow-md transition-colors"
          title="Alternar Áudio"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
        </button>
      </div>
    </motion.div>
  );
};
