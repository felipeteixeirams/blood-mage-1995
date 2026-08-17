import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/soundEngine';
import { GameSettings } from '../types/game';
import Phaser from 'phaser';
import { SettingsScene, BASE_W, BASE_H } from '../game/scenes/SettingsScene';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: BASE_W,
      height: BASE_H,
      backgroundColor: "#07080b",
      pixelArt: true,
      roundPixels: true,
      audio: {
        noAudio: true,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [SettingsScene],
    });

    game.registry.set("settings", settings);
    game.registry.set("onUpdateSettings", onUpdateSettings);
    game.registry.set("onClose", () => {
      soundEngine.playButtonClick();
      onClose();
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set("settings", settings);
      gameRef.current.registry.set("onUpdateSettings", onUpdateSettings);
      gameRef.current.registry.set("onClose", () => {
        soundEngine.playButtonClick();
        onClose();
      });
    }
  }, [settings, onUpdateSettings, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações do Bloodmage 1995"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-5xl h-[540px] max-h-[90vh] aspect-[16/9] flex items-center justify-center relative shadow-2xl"
      />
    </motion.div>
  );
};