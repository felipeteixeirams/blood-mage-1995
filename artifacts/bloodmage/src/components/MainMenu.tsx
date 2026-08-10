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


      {/* 4. Challenge Modifiers Widget */}
      <div className="absolute left-8 bottom-24 z-20 w-64 md:w-72 bg-[#171309]/95 border-2 border-[#b8860b]/40 shadow-[4px_4px_12px_rgba(0,0,0,0.9)] p-4 flex flex-col gap-2.5 pointer-events-auto text-left rounded-xl select-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        <span className="text-[10px] text-[#e3dac9] font-bold tracking-widest border-b border-[#b8860b]/20 pb-1.5 uppercase flex items-center gap-1.5">
          💀 Modificadores de Desafio
        </span>
        <div className="flex flex-col gap-2">
          {MODIFIERS.map((m) => {
            const active = activeModifiers.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => {
                  soundEngine.playButtonClick();
                  toggleModifier(m.id);
                }}
                className={`p-2 border rounded cursor-pointer transition-all duration-200 flex flex-col gap-0.5 ${
                  active
                    ? `${m.color} border-[#b8860b] shadow-[0_0_10px_rgba(184,134,11,0.25)] scale-[1.02]`
                    : 'border-gray-800/80 bg-black/45 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] uppercase font-bold ${active ? 'text-amber-300' : 'text-gray-300'}`}>
                    {m.name}
                  </span>
                  <span className="text-[8px] font-sans">
                    {active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>
                <span className="text-[7px] font-sans text-gray-500 leading-snug">
                  {m.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
