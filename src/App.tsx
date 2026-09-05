import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { registerSW } from 'virtual:pwa-register';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { ModalBase } from './components/ui/ModalBase';
import type { GameScene } from './game/scenes/GameScene';
import { PlayerStats, UpgradeOption } from './types/game';
import { tryLockLandscape, initOrientationGestureHandler } from './utils/orientation';

// Lazy-loaded: Phaser + all game systems, the gameplay HUD, and every modal
// only render after the splash/menu, so none of that code (nor its
// transitive imports — Phaser itself, GameScene and everything it pulls in)
// needs to be in the initial bundle. Each becomes its own chunk, fetched on
// first use. See docs/critical/02_PERFORMANCE_OPTIMIZATION.md.
const PhaserGame = lazy(() => import('./game/PhaserGame').then((m) => ({ default: m.PhaserGame })));
const GameplayHUD = lazy(() => import('./components/GameplayHUD').then((m) => ({ default: m.GameplayHUD })));
const LevelUpModal = lazy(() => import('./components/LevelUpModal').then((m) => ({ default: m.LevelUpModal })));
const CodexModal = lazy(() => import('./components/CodexModal').then((m) => ({ default: m.CodexModal })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })));
const HighScoresModal = lazy(() => import('./components/HighScoresModal').then((m) => ({ default: m.HighScoresModal })));
const GameOverModal = lazy(() => import('./components/GameOverModal').then((m) => ({ default: m.GameOverModal })));
const InventoryModal = lazy(() => import('./components/InventoryModal').then((m) => ({ default: m.InventoryModal })));
const TalentsModal = lazy(() => import('./components/TalentsModal').then((m) => ({ default: m.TalentsModal })));
const AchievementsModal = lazy(() => import('./components/AchievementsModal').then((m) => ({ default: m.AchievementsModal })));
const ObservabilityModal = lazy(() => import('./components/ObservabilityModal').then((m) => ({ default: m.ObservabilityModal })));
const SoundTestModal = lazy(() => import('./components/SoundTestModal').then((m) => ({ default: m.SoundTestModal })));
import { soundEngine } from './utils/soundEngine';
import { useGameStore } from './store/gameStore';
import { telemetry } from './utils/telemetry';
import { logger } from './utils/logger';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [showCampaignConfirm, setShowCampaignConfirm] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).useGameStore = useGameStore;
    }
  }, []);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  const {
    gameState, setGameState,
    settings, updateSettings,
    highScores, addHighScore,
    isMuted, toggleMute,
    isBestiaryOpen, setBestiaryOpen,
    isSettingsOpen, setSettingsOpen,
    isHighScoresOpen, setHighScoresOpen,
    isAchievementsOpen, setAchievementsOpen,
    isInventoryOpen, setInventoryOpen,
    isTalentsOpen, setTalentsOpen,
    isObservabilityOpen, setObservabilityOpen,
    isSoundTestOpen, setSoundTestOpen,
    levelUpData, setLevelUpData,
    gameOverStats, setGameOverStats,
  } = useGameStore();

  const gameSceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    soundEngine.setVolumes(settings.sfxVolume, settings.bgmVolume);
  }, [settings]);

  // Dynamic BGM low-pass muffle effect when UI menus / modals are open
  useEffect(() => {
    const isAnyModalOpen =
      isBestiaryOpen ||
      isSettingsOpen ||
      isHighScoresOpen ||
      isAchievementsOpen ||
      isInventoryOpen ||
      isTalentsOpen ||
      isObservabilityOpen ||
      isSoundTestOpen ||
      levelUpData !== null ||
      gameOverStats !== null;

    soundEngine.setBGMMuffled(isAnyModalOpen);
  }, [
    isBestiaryOpen,
    isSettingsOpen,
    isHighScoresOpen,
    isAchievementsOpen,
    isInventoryOpen,
    isTalentsOpen,
    isObservabilityOpen,
    isSoundTestOpen,
    levelUpData,
    gameOverStats,
  ]);

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
    try {
      updateSWRef.current = registerSW({
        onNeedRefresh() {
          setIsUpdateReady(true);
        },
        onOfflineReady() {
          logger.info('PWA', 'PWA offline ready');
        },
        onRegisterError(error: any) {
          logger.warn('PWA', 'Service worker registration failed or ignored', { error });
        },
      });
    } catch (e) {
      logger.warn('PWA', 'Failed to register service worker', { error: e });
    }
  }, []);

  // Keyboard hotkeys for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'o' || e.key === 'O') {
        soundEngine.playButtonClick();
        setObservabilityOpen(!useGameStore.getState().isObservabilityOpen);
      } else if (e.key === 'm' || e.key === 'M') {
        soundEngine.playButtonClick();
        setSoundTestOpen(!useGameStore.getState().isSoundTestOpen);
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
  }, [gameState, setInventoryOpen, setTalentsOpen, setObservabilityOpen, setSoundTestOpen]);

  // Auto-attempt landscape orientation lock on user gesture without blocking
  useEffect(() => {
    const cleanup = initOrientationGestureHandler();
    return cleanup;
  }, []);

  const executeStartCampaign = () => {
    tryLockLandscape();
    setGameOverStats(null);
    setLevelUpData(null);
    const store = useGameStore.getState();
    store.resetCampaignProgress();
    store.setGameMode('campaign');
    store.setCampaignZone('safe_house');
    setGameState('playing');
    setShowCampaignConfirm(false);
    telemetry.trackEvent('campaign_start');
  };

  const handleStartCampaign = () => {
    const store = useGameStore.getState();
    const hasExistingProgress =
      store.campaignState.currentZone !== 'safe_house' ||
      Object.keys(store.campaignState.quests).length > 0 ||
      store.campaignState.unlockedSpellIds.length > 0;
    if (hasExistingProgress) {
      setShowCampaignConfirm(true);
    } else {
      executeStartCampaign();
    }
  };

  const handleStartArcade = () => {
    tryLockLandscape();
    setGameOverStats(null);
    setLevelUpData(null);
    useGameStore.getState().setGameMode('arcade');
    setGameState('playing');
    telemetry.trackEvent('arcade_start');
  };

  const handleContinueGame = () => {
    tryLockLandscape();
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
          onStartCampaign={handleStartCampaign}
          onStartArcade={handleStartArcade}
          onContinueGame={handleContinueGame}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHighScores={() => setHighScoresOpen(true)}
          onOpenAchievements={() => setAchievementsOpen(true)}
          onOpenTalents={() => setTalentsOpen(true)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 2. Active Game Phaser Canvas
          BUG FIX (2026-08-25): antes, esse bloco só montava com
          gameState === 'playing'. Pausar mudava o gameState para 'paused',
          o que desmontava <PhaserGame> — e o cleanup do PhaserGame chama
          currentGame.destroy(true), destruindo o Phaser.Game inteiro
          (GameScene, masmorra, posição do jogador, tudo). Ao continuar, um
          Phaser.Game NOVO era criado do zero, reiniciando o jogador no
          spawn — exatamente o bug relatado ("volta pro ponto inicial como
          se resetasse"). Agora o Phaser.Game permanece montado durante a
          pausa; quem efetivamente congela a simulação é GameScene.isPaused
          (setado logo abaixo, em PhaserGame.tsx), que já existia e já era
          respeitado em update() — só nunca tinha sido ligado a nada. */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <Suspense fallback={null}>
          <PhaserGame
            gameSceneRef={gameSceneRef}
            onGameOver={handleGameOver}
          />
          {/* Gameplay HUD */}
          <GameplayHUD
            getCooldownRemaining={getCooldownRemaining}
          />
        </Suspense>
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
        <Suspense fallback={null}>
          <LevelUpModal
            level={levelUpData.level}
            options={levelUpData.choices}
            onSelectOption={handleSelectUpgrade}
          />
        </Suspense>
      )}

      {/* 5. Game Over Modal */}
      {gameOverStats && (
        <Suspense fallback={null}>
          <GameOverModal
            stats={gameOverStats}
            onRestart={useGameStore.getState().gameMode === 'campaign' ? handleStartCampaign : handleStartArcade}
            onGoHome={() => setGameOverStats(null)}
          />
        </Suspense>
      )}

      {/* 6. Aux Modals */}
      <AnimatePresence>
        {isBestiaryOpen && (
          <Suspense fallback={null}>
            <CodexModal onClose={() => setBestiaryOpen(false)} />
          </Suspense>
        )}
        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsModal
              settings={settings}
              onUpdateSettings={updateSettings}
              onClose={() => setSettingsOpen(false)}
            />
          </Suspense>
        )}
        {isHighScoresOpen && (
          <Suspense fallback={null}>
            <HighScoresModal
              scores={highScores}
              onClose={() => setHighScoresOpen(false)}
            />
          </Suspense>
        )}
        {isAchievementsOpen && (
          <Suspense fallback={null}>
            <AchievementsModal onClose={() => setAchievementsOpen(false)} />
          </Suspense>
        )}
        {isInventoryOpen && (
          <Suspense fallback={null}>
            <InventoryModal onClose={() => setInventoryOpen(false)} />
          </Suspense>
        )}
        {isTalentsOpen && (
          <Suspense fallback={null}>
            <TalentsModal onClose={() => setTalentsOpen(false)} />
          </Suspense>
        )}
        {isObservabilityOpen && (
          <Suspense fallback={null}>
            <ObservabilityModal onClose={() => setObservabilityOpen(false)} />
          </Suspense>
        )}
        {isSoundTestOpen && (
          <Suspense fallback={null}>
            <SoundTestModal isOpen={isSoundTestOpen} onClose={() => setSoundTestOpen(false)} />
          </Suspense>
        )}
        {showCampaignConfirm && (
          <ModalBase
            title="Recomeçar Campanha"
            subtitle="Atenção, Viajante"
            onClose={() => setShowCampaignConfirm(false)}
          >
            <div className="space-y-4 text-sm text-[#d4c5a9]">
              <p>
                Isso vai apagar seu progresso salvo na Campanha (missões, magias desbloqueadas e zona atual) e recomeçar do zero na Safe House. Deseja continuar?
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#b8860b]/30">
                <button
                  onClick={() => setShowCampaignConfirm(false)}
                  className="px-4 py-2 bg-black/80 hover:bg-[#201a12] border border-[#6b5a3a] text-gray-300 font-pixel text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeStartCampaign}
                  className="px-4 py-2 bg-[#8c1f22] hover:bg-[#a82529] border border-[#d4af37] text-amber-100 font-pixel text-xs tracking-wider uppercase shadow-md transition-colors cursor-pointer"
                >
                  Apagar e Recomeçar
                </button>
              </div>
            </div>
          </ModalBase>
        )}
      </AnimatePresence>
    </div>
  );
}
