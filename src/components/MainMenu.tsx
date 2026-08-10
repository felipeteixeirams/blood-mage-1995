import React, { useEffect, useRef } from 'react';
import { Play, Settings, Trophy, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';
import Phaser from 'phaser';
import { useGameStore } from '../store/gameStore';

const MODIFIERS = [
  { id: 'blood_tide', name: 'Maré de Sangue', desc: '+40% monstros nas ondas, +30% chance de loot', color: 'border-red-800 bg-red-950/20 text-red-200' },
  { id: 'rune_famine', name: 'Penúria Rúnica', desc: 'Skills custam 2x Mana, Cristais recebidos +100%', color: 'border-purple-800 bg-purple-950/20 text-purple-200' },
  { id: 'fury_pit', name: 'Fúria do Fosso', desc: 'Inimigos nascem furiosos, XP concedida +50%', color: 'border-orange-800 bg-orange-950/20 text-orange-200' }
];
import { TitleScene, BASE_W, BASE_H } from '../game/scenes/TitleScene';

interface MainMenuProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onOpenSettings: () => void;
  onOpenHighScores: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onContinueGame,
  onOpenSettings,
  onOpenHighScores,
  isMuted,
  onToggleMute,
}) => {
  const { activeModifiers, toggleModifier } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

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

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onStartGame, onContinueGame, onOpenSettings, onOpenHighScores]);

  // Update registry callbacks if props change
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set("onStartGame", onStartGame);
      gameRef.current.registry.set("onContinueGame", onContinueGame);
      gameRef.current.registry.set("onOpenSettings", onOpenSettings);
      gameRef.current.registry.set("onOpenHighScores", onOpenHighScores);
    }
  }, [onStartGame, onContinueGame, onOpenSettings, onOpenHighScores]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full h-full min-h-screen bg-[#0b0a09] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* 1. Animated Phaser Title Scene Background & Frame */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center [&_canvas]:!max-w-full [&_canvas]:!max-h-full [&_canvas]:!w-auto [&_canvas]:!h-auto pointer-events-auto z-0"
      />

      {/* 2. Top Header Controls (Mute & PWA Version) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded border border-gray-800 shadow-black">
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-pixel text-gray-400">BLOODMAGE 1995</span>
          </div>
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
          className="p-3 stone-btn rounded cursor-pointer pointer-events-auto shadow-lg hover:scale-105 transition-transform"
          title="Alternar Áudio"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-[#d4af37]" />}
        </button>
      </div>
    </motion.div>
  );
};
