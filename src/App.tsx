import React, { useState, useRef, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameplayHUD } from './components/GameplayHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { BestiaryModal } from './components/BestiaryModal';
import { SettingsModal } from './components/SettingsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { GameOverModal } from './components/GameOverModal';
import { PhaserGame } from './game/PhaserGame';
import { GameScene } from './game/scenes/GameScene';
import { PlayerStats, UpgradeOption, GameSettings, HighScoreRecord } from './types/game';
import { loadSettings, saveSettings, loadHighScores, saveHighScore } from './utils/localStorage';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused'>('menu');
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(loadHighScores);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals state
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHighScoresOpen, setIsHighScoresOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; choices: UpgradeOption[] } | null>(null);
  const [gameOverStats, setGameOverStats] = useState<PlayerStats | null>(null);

  // Real-time gameplay player stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    level: 1,
    currentXp: 0,
    nextLevelXp: 50,
    moveSpeed: 160,
    damageMultiplier: 1.0,
    cooldownReduction: 0,
    vampirism: 0,
    projectileBonus: 0,
    kills: 0,
    souls: 0,
    wave: 1,
    floorDepth: 1,
    score: 0,
    timeSurvivedSeconds: 0,
    unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield'],
  });

  // Touch Joysticks & Skill triggers
  const [touchMoveInput, setTouchMoveInput] = useState({ x: 0, y: 0 });
  const [touchAimInput, setTouchAimInput] = useState({ x: 0, y: 0 });
  const [activeSkillTrigger, setActiveSkillTrigger] = useState<'nova' | 'syphon' | 'bone_shield' | null>(null);

  const gameSceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    soundEngine.setVolumes(settings.sfxVolume, settings.bgmVolume);
  }, [settings]);

  const handleStartGame = () => {
    setGameOverStats(null);
    setLevelUpData(null);
    setGameState('playing');
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
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

    // Save record to local storage
    const updated = saveHighScore({
      score: stats.score,
      kills: stats.kills,
      wave: stats.wave,
      timeSurvived: `${m}:${s}`,
      levelReached: stats.level,
    });
    setHighScores(updated);
  };

  const getCooldownRemaining = (spellId: string): number => {
    if (gameSceneRef.current) {
      return gameSceneRef.current.player.getCooldownRemaining(spellId);
    }
    return 0;
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-black ${settings.crtFilter ? 'crt-overlay' : ''}`}>
      {/* 1. Main Menu Overlay */}
      {gameState === 'menu' && !gameOverStats && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenBestiary={() => setIsBestiaryOpen(true)}
          onOpenHighScores={() => setIsHighScoresOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. Active Game Phaser Canvas */}
      {gameState === 'playing' && (
        <>
          <PhaserGame
            onStatsUpdate={(stats) => setPlayerStats(stats)}
            onLevelUp={(level, choices) => setLevelUpData({ level, choices })}
            onGameOver={handleGameOver}
            touchMoveInput={touchMoveInput}
            touchAimInput={touchAimInput}
            activeSkillTrigger={activeSkillTrigger}
            onSkillTriggerProcessed={() => setActiveSkillTrigger(null)}
            gameSceneRef={gameSceneRef}
          />

          {/* Gameplay HUD */}
          <GameplayHUD
            stats={playerStats}
            onSkillClick={(skillKey) => setActiveSkillTrigger(skillKey)}
            getCooldownRemaining={getCooldownRemaining}
            onMoveJoystickUpdate={(x, y) => setTouchMoveInput({ x, y })}
            onAimJoystickUpdate={(x, y) => setTouchAimInput({ x, y })}
            onPauseToggle={() => setGameState('paused')}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            virtualControlsOpacity={settings.virtualControlsOpacity}
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
                onClick={() => setIsSettingsOpen(true)}
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
      {isBestiaryOpen && <BestiaryModal onClose={() => setIsBestiaryOpen(false)} />}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      {isHighScoresOpen && (
        <HighScoresModal
          scores={highScores}
          onClose={() => setIsHighScoresOpen(false)}
        />
      )}
    </div>
  );
}
