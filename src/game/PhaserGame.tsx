import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { useGameStore } from '../store/gameStore';
import { PlayerStats, UpgradeOption } from '../types/game';
import { saveHighScore } from '../utils/localStorage';

interface PhaserGameProps {
  gameSceneRef: React.MutableRefObject<GameScene | null>;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  gameSceneRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  const {
    setPlayerStats: onStatsUpdate,
    setLevelUpData,
    setGameOverStats,
    setGameState,
    addHighScore,
    touchMoveInput,
    touchAimInput,
    activeSkillTrigger,
    setActiveSkillTrigger: onSkillTriggerProcessed,
  } = useGameStore();

  const onLevelUp = (level: number, choices: UpgradeOption[]) => {
    setLevelUpData({ level, choices });
  };

  const onGameOver = (stats: PlayerStats) => {
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

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || window.innerWidth,
      height: containerRef.current.clientHeight || window.innerHeight,
      backgroundColor: '#0a0508',
      pixelArt: true,
      input: {
        activePointers: 3,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [BootScene, GameScene],
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Listen for GameScene boot
    game.events.on('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene) {
        scene.init({ callbacks: { onStatsUpdate, onLevelUp, onGameOver } });
        gameSceneRef.current = scene;
      }
    });

    return () => {
      gameSceneRef.current = null;
      game.destroy(true);
    };
  }, []);

  // Update touch vectors inside GameScene
  useEffect(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.setTouchInputs(
        touchMoveInput.x,
        touchMoveInput.y,
        touchAimInput.x,
        touchAimInput.y
      );
    }
  }, [touchMoveInput, touchAimInput]);

  // Handle skill hotkey / button trigger
  useEffect(() => {
    if (activeSkillTrigger && gameSceneRef.current) {
      gameSceneRef.current.triggerSkill(activeSkillTrigger);
      onSkillTriggerProcessed(null);
    }
  }, [activeSkillTrigger]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      className="w-full h-full absolute inset-0 overflow-hidden rendering-pixelated"
    />
  );
};
