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
    respawnRequested,
    setRespawnRequested: onRespawnProcessed,
    cosmeticTintVersion,
    activeCurativeTrigger,
    setActiveCurativeTrigger: onCurativeProcessed,
    dragAim,
    gameState,
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

  // Handle player respawn command (ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md)
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
    if (respawnRequested && gameSceneRef.current) {
      gameSceneRef.current.respawnPlayer();
      onRespawnProcessed(false);
    }
  }, [respawnRequested]);

  // Handle cosmetic palette change (ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md).
  // cosmeticTintVersion é só um contador — o valor em si não importa, só a mudança.
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
    if (cosmeticTintVersion > 0 && gameSceneRef.current) {
      gameSceneRef.current.applyCosmeticTint();
    }
  }, [cosmeticTintVersion]);

  // Handle curative UI clicks (ver docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md)
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
    if (activeCurativeTrigger && gameSceneRef.current) {
      gameSceneRef.current.useCurativeItem(activeCurativeTrigger);
      onCurativeProcessed(null);
    }
  }, [activeCurativeTrigger]);

  // Handle drag-to-aim gesture (start/move/end) — a única ponte de alta
  // frequência; mesmo padrão de touchMoveInput/touchAimInput, já validado
  // para rodar a cada pointermove sem lag perceptível. Ver
  // docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md.
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
    if (!dragAim.spellId || !dragAim.phase || !gameSceneRef.current) return;

    const payload = { spellId: dragAim.spellId, dx: dragAim.dx, dy: dragAim.dy, isDrag: dragAim.isDrag };
    if (dragAim.phase === 'start') {
      gameSceneRef.current.handleDragAimStart(payload);
    } else if (dragAim.phase === 'move') {
      gameSceneRef.current.handleDragAimMove(payload);
    } else if (dragAim.phase === 'end') {
      gameSceneRef.current.handleDragAimEnd(payload);
    }
  }, [dragAim]);

  // BUG FIX (2026-08-25): congela/descongela a simulação com base no
  // gameState, em vez de deixar o pause destruir e recriar o Phaser.Game
  // (ver comentário em App.tsx). GameScene.update() já checava this.isPaused
  // em 3 pontos — só nunca era setado por ninguém. Isso fecha o circuito.
  useEffect(() => {
    if (!gameSceneRef.current && phaserGameRef.current?.scene) {
      const scene = phaserGameRef.current.scene.getScene('GameScene') as GameScene;
      if (scene) {
        gameSceneRef.current = scene;
      }
    }
    if (gameSceneRef.current) {
      gameSceneRef.current.isPaused = gameState === 'paused';
    }
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      className="w-full h-full absolute inset-0 overflow-hidden rendering-pixelated"
    />
  );
};
