import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { registerSW } from 'virtual:pwa-register';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { GameplayHUD } from './components/GameplayHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { BestiaryModal } from './components/BestiaryModal';
import { SettingsModal } from './components/SettingsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { GameOverModal } from './components/GameOverModal';
import { DeathScreen } from './components/DeathScreen';
import { InventoryModal } from './components/InventoryModal';
import { TalentsModal } from './components/TalentsModal';
import { ObservabilityModal } from './components/ObservabilityModal';
import { RotateDeviceOverlay } from './components/RotateDeviceOverlay';
import { PhaserGame } from './game/PhaserGame';
import { GameScene } from './game/scenes/GameScene';
import { PlayerStats, UpgradeOption } from './types/game';
import { soundEngine } from './utils/soundEngine';
import { useGameStore } from './store/gameStore';
import { telemetry } from './utils/telemetry';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Persistent death check on mount
  useEffect(() => {
    try {
      const isDeadPersisted = localStorage.getItem('bloodmage_1995_is_dead_persistent');
      const deadStatsRaw = localStorage.getItem('bloodmage_1995_dead_stats');
      if (isDeadPersisted === 'true' && deadStatsRaw) {
        const stats = JSON.parse(deadStatsRaw);
        setGameOverStats(stats);
      }
    } catch (e) {
      console.warn('Persistent death check failed', e);
    }
  }, []);

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
    isObservabilityOpen, setObservabilityOpen,
    levelUpData, setLevelUpData,
    gameOverStats, setGameOverStats,
  } = useGameStore();

  const gameSceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    soundEngine.setVolumes(settings.sfxVolume, settings.bgmVolume);
  }, [settings]);

  // Gamepad connection listeners
  useEffect(() => {
    const handleConnected = () => {
      useGameStore.getState().setGamepadConnected(true);
    };
    const handleDisconnected = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const anyConnected = Array.from(gps).some(g => g !== null);
      useGameStore.getState().setGamepadConnected(anyConnected);
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Initial check
    if (navigator.getGamepads) {
      const gps = navigator.getGamepads();
      if (Array.from(gps).some(g => g !== null)) {
        handleConnected();
      }
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, []);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setIsUpdateReady(true);
      },
      onOfflineReady() {
        console.log('PWA offline ready');
      },
    });
  }, []);

  // Keyboard hotkeys for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'o' || e.key === 'O') {
        soundEngine.playButtonClick();
        setObservabilityOpen(!useGameStore.getState().isObservabilityOpen);
      }

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
  }, [gameState, setInventoryOpen, setTalentsOpen, setObservabilityOpen]);

  const handleStartGame = () => {
    setGameOverStats(null);
    setLevelUpData(null);
    setGameState('playing');
    telemetry.trackEvent('game_start');
  };

  const handleContinueGame = () => {
    setGameState('playing');
    telemetry.trackEvent('game_continue');
  };

  const handleSelectUpgrade = (option: UpgradeOption) => {
    if (gameSceneRef.current) {
      gameSceneRef.current.applyUpgradeChoice(option);
    }
    setLevelUpData(null);
    telemetry.trackEvent('upgrade_selected', { upgradeId: option.id });
  };

  const handleRespawn = () => {
    if (gameOverStats) {
      const respawnStats: PlayerStats = {
        ...gameOverStats,
        hp: gameOverStats.maxHp, // fully healed back in safe town
        mana: gameOverStats.maxMana,
        currentXp: 0, // lost progress towards next level
        knockoutCount: 0, // reset desmaios
        isUnconscious: false,
        isDefinitivelyDead: false,
        statusConditions: { bleeding: false, poison: false, infection: false },
      };

      const dropped = {
        hasDroppedCorpse: true,
        zone: `floor_${gameOverStats.floorDepth}`,
        x: gameSceneRef.current?.player?.x || 400,
        y: gameSceneRef.current?.player?.y || 400,
        itemsInside: [] // drop inventory
      };
      useGameStore.getState().setDroppedCorpse(dropped);

      setGameOverStats(null);
      setGameState('playing');

      // Move them back to town or reset their position
      if (gameSceneRef.current) {
        (gameSceneRef.current as any).respawnInTown(respawnStats);
      }
    }
  };

  const handleGameOver = (stats: PlayerStats) => {
    setGameOverStats(stats);
    setGameState('menu'); // reset game canvas loop state
    telemetry.trackEvent('game_over', { wave: stats.wave, score: stats.score, kills: stats.kills });

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

  const handleUpdateApp = async () => {
    if (updateSWRef.current) {
      await updateSWRef.current(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Orientation lock overlay — forces landscape mode */}
      <RotateDeviceOverlay />

      {/* Standalone CRT Scanline Overlay - pointer-events-none ensures touch & click pass through */}
      {settings.crtFilter && (
        <div className="fixed inset-0 pointer-events-none z-[120] crt-overlay" />
      )}

      {isBooting && <SplashScreen onComplete={() => setIsBooting(false)} />}

      {isUpdateReady && (
        <div className="fixed inset-x-4 bottom-4 z-[130] rounded-xl border border-amber-700 bg-black/95 p-4 text-white shadow-[0_0_30px_rgba(255,190,0,0.25)] backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-pixel text-sm uppercase text-amber-200">Atualização disponível</p>
              <p className="text-xs text-gray-300">Uma nova versão do jogo está pronta. Atualize agora para carregar a versão mais recente.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdateApp}
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-pixel uppercase tracking-[0.18em] text-black shadow-lg hover:bg-amber-400 transition"
              >
                Atualizar agora
              </button>
              <button
                onClick={() => setIsUpdateReady(false)}
                className="rounded-full border border-gray-600 bg-black/90 px-4 py-2 text-xs font-pixel uppercase tracking-[0.18em] text-gray-200 hover:border-amber-500 hover:text-amber-200 transition"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Main Menu Overlay */}
      {!isBooting && gameState === 'menu' && !gameOverStats && (
        <MainMenu
          onStartGame={handleStartGame}
          onContinueGame={handleContinueGame}
          onOpenSettings={() => setSettingsOpen(true)}
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
            onGameOver={handleGameOver}
          />
          {/* Gameplay HUD */}
          <GameplayHUD
            getCooldownRemaining={getCooldownRemaining}
          />
        </>
      )}

      {/* 3. Pause Screen Overlay */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4">
          <div className="bg-[#120a0e] border-2 md:border-4 border-amber-900 rounded-xl p-4 md:p-8 max-w-sm w-full text-center space-y-3 md:space-y-6">
            <h2 className="text-xl md:text-3xl font-gothic text-amber-200">JOGO PAUSADO</h2>
            <div className="flex flex-row md:flex-col gap-2 md:gap-3">
              <button
                onClick={() => setGameState('playing')}
                className="flex-1 md:w-full py-2.5 md:py-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-100 font-pixel text-[10px] md:text-xs rounded transition-colors cursor-pointer touch-manipulation"
              >
                CONTINUAR
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex-1 md:w-full py-2.5 md:py-3 bg-black/80 hover:bg-gray-900 border border-gray-800 text-gray-300 font-retro text-sm md:text-base rounded transition-colors cursor-pointer touch-manipulation"
              >
                CONFIG
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 md:w-full py-2.5 md:py-3 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 font-retro text-sm md:text-base rounded transition-colors cursor-pointer touch-manipulation"
              >
                SAIR
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

      {/* 5. Game Over Modal / Death Screen */}
      {gameOverStats && (
        gameOverStats.isDefinitivelyDead ? (
          <DeathScreen
            stats={gameOverStats}
            onRespawn={handleRespawn}
            onGoHome={() => setGameOverStats(null)}
          />
        ) : (
          <GameOverModal
            stats={gameOverStats}
            onRestart={handleStartGame}
            onGoHome={() => setGameOverStats(null)}
          />
        )
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
        {isObservabilityOpen && (
          <ObservabilityModal onClose={() => setObservabilityOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
