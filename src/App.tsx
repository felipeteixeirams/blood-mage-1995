import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { GameplayHUD } from './components/GameplayHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { BestiaryModal } from './components/BestiaryModal';
import { SettingsModal } from './components/SettingsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { GameOverModal } from './components/GameOverModal';
import { InventoryModal } from './components/InventoryModal';
import { TalentsModal } from './components/TalentsModal';
import { PhaserGame } from './game/PhaserGame';
import { GameScene } from './game/scenes/GameScene';
import { PlayerStats, UpgradeOption } from './types/game';
import { soundEngine } from './utils/soundEngine';
import { useGameStore } from './store/gameStore';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  const {
    gameState, setGameState,
    settings, updateSettings,
    highScores, addHighScore,
    isMuted, toggleMute,
    isBestiaryOpen, setBestiaryOpen,
    isSettingsOpen, setSettingsOpen,
    isHighScoresOpen, setHighScoresOpen,
    isInventoryOpen, setInventoryOpen,
    isTalentsOpen, setTalentsOpen,
    levelUpData, setLevelUpData,
    gameOverStats, setGameOverStats,
  } = useGameStore();

  const gameSceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    soundEngine.setVolumes(settings.sfxVolume, settings.bgmVolume);
  }, [settings]);

  // Keyboard hotkeys for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'i' || e.key === 'I') {
        soundEngine.playButtonClick();
        setInventoryOpen(!useGameStore.getState().isInventoryOpen);
      } else if (e.key === 't' || e.key === 'T') {
        soundEngine.playButtonClick();
        setTalentsOpen(!useGameStore.getState().isTalentsOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setInventoryOpen, setTalentsOpen]);

  const handleStartGame = () => {
    setGameOverStats(null);
    setLevelUpData(null);
    setGameState('playing');
  };

  const handleSelectUpgrade = (option: UpgradeOption) => {
    if (gameSceneRef.current) {
      gameSceneRef.current.applyUpgradeChoice(option);
    }
    setLevelUpData(null);
  };

  const handleGameOver = (stats: PlayerStats) => {
    setGameOverStats(stats);
    setGameState('menu'); // reset game canvas loop state

    // Format time
    const m = Math.floor(stats.timeSurvivedSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(stats.timeSurvivedSeconds % 60).toString().padStart(2, '0');

    // Save record to local storage via store
    addHighScore({
      score: stats.score,
      kills: stats.kills,
      wave: stats.wave,
      timeSurvived: `${m}:${s}`,
      levelReached: stats.level,
    });
  };

  const getCooldownRemaining = (spellId: string): number => {
    if (gameSceneRef.current?.player?.getCooldownRemaining) {
      return gameSceneRef.current.player.getCooldownRemaining(spellId);
    }
    return 0;
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Standalone CRT Scanline Overlay - pointer-events-none ensures touch & click pass through */}
      {settings.crtFilter && (
        <div className="fixed inset-0 pointer-events-none z-[120] crt-overlay" />
      )}

      {isBooting && <SplashScreen onComplete={() => setIsBooting(false)} />}
      
      {/* 1. Main Menu Overlay */}
      {!isBooting && gameState === 'menu' && !gameOverStats && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenBestiary={() => setBestiaryOpen(true)}
          onOpenHighScores={() => setHighScoresOpen(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. Active Game Phaser Canvas */}
      {gameState === 'playing' && (
        <>
          <PhaserGame
            gameSceneRef={gameSceneRef}
          />
          {/* Gameplay HUD */}
          <GameplayHUD
            getCooldownRemaining={getCooldownRemaining}
          />
        </>
      )}

      {/* 3. Pause Screen Overlay */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-[#120a0e] border-4 border-amber-900 rounded-xl p-8 max-w-sm w-full text-center space-y-6">
            <h2 className="text-3xl font-gothic text-amber-200">JOGO PAUSADO</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-100 font-pixel text-xs rounded transition-colors cursor-pointer"
              >
                CONTINUAR RITUAL
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="py-3 bg-black/80 hover:bg-gray-900 border border-gray-800 text-gray-300 font-retro text-base rounded transition-colors cursor-pointer"
              >
                CONFIGURAÇÕES
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="py-3 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 font-retro text-base rounded transition-colors cursor-pointer"
              >
                SAIR PARA O MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Level Up Upgrade Modal */}
      {levelUpData && (
        <LevelUpModal
          level={levelUpData.level}
          options={levelUpData.choices}
          onSelectOption={handleSelectUpgrade}
        />
      )}

      {/* 5. Game Over Modal */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          onRestart={handleStartGame}
          onGoHome={() => setGameOverStats(null)}
        />
      )}

      {/* 6. Aux Modals */}
      <AnimatePresence>
        {isBestiaryOpen && <BestiaryModal onClose={() => setBestiaryOpen(false)} />}
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={updateSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {isHighScoresOpen && (
          <HighScoresModal
            scores={highScores}
            onClose={() => setHighScoresOpen(false)}
          />
        )}
        {isInventoryOpen && (
          <InventoryModal onClose={() => setInventoryOpen(false)} />
        )}
        {isTalentsOpen && (
          <TalentsModal onClose={() => setTalentsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
