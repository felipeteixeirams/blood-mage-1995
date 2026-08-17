import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { RecordsScene } from './scenes/RecordsScene';
import { useGameStore } from '../store/gameStore';
import { PlayerStats, UpgradeOption } from '../types/game';

interface PhaserGameProps {
  gameSceneRef: React.MutableRefObject<GameScene | null>;
  /** Owned by App — called once when the game ends. Handles score persistence,
   *  telemetry, and state transition. PhaserGame does not duplicate this logic. */
  onGameOver: (stats: PlayerStats) => void;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  gameSceneRef,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  const {
    setPlayerStats: onStatsUpdate,
    setLevelUpData,
    touchMoveInput,
    touchAimInput,
    activeSkillTrigger,
    setActiveSkillTrigger: onSkillTriggerProcessed,
  } = useGameStore();

  const onLevelUp = (level: number, choices: UpgradeOption[]) => {
    setLevelUpData({ level, choices });
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
      audio: {
        noAudio: true,
      },
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

    // Store callbacks in the Phaser registry synchronously right after creation —
    // before BootScene or GameScene runs — so GameScene.init() always finds them.
    game.registry.set('reactCallbacks', { onStatsUpdate, onLevelUp, onGameOver });

    // Keep the scene ref for touch/skill passthrough once scenes are running.
    const updateGameSceneRef = () => {
      if (game.scene) {
        const scene = game.scene.getScene('GameScene') as GameScene;
        if (scene) {
          gameSceneRef.current = scene;
        }
      }
    };

    game.events.on('ready', updateGameSceneRef);
    game.events.on('step', () => {
      if (!gameSceneRef.current) {
        updateGameSceneRef();
      }
    });

    return () => {
      gameSceneRef.current = null;
      if (phaserGameRef.current) {
        const currentGame = phaserGameRef.current;
        phaserGameRef.current = null;
        try {
          if (currentGame.loop) {
            currentGame.loop.stop();
          }
          if (currentGame.scale) {
            currentGame.scale.removeAllListeners();
          }
          currentGame.destroy(true);
        } catch (e) {
          // Ignore destroy errors on fast unmounts
        }
      }
    };
  }, []);

  // Update touch vectors inside GameScene
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
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
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
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
