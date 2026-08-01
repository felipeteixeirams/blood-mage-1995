import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene, GameSceneCallbacks } from './scenes/GameScene';

interface PhaserGameProps extends GameSceneCallbacks {
  touchMoveInput: { x: number; y: number };
  touchAimInput: { x: number; y: number };
  activeSkillTrigger: 'nova' | 'syphon' | 'bone_shield' | null;
  onSkillTriggerProcessed: () => void;
  gameSceneRef: React.MutableRefObject<GameScene | null>;
}

export const PhaserGame: React.FC<PhaserGameProps> = ({
  onStatsUpdate,
  onLevelUp,
  onGameOver,
  touchMoveInput,
  touchAimInput,
  activeSkillTrigger,
  onSkillTriggerProcessed,
  gameSceneRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

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
      onSkillTriggerProcessed();
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
