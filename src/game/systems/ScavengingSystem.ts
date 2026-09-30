import { GameScene } from '../scenes/GameScene';
import { Scavengeable } from '../objects/Scavengeable';
import { LootSprite } from '../objects/Loot';
import { LootSystem } from './LootSystem';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';

/**
 * Interações de scavenging (corpses/skeletons/player_corpse) e uso rápido de
 * curativos (ataduras/antídotos/antibióticos). Extraído de GameScene.ts (item 1
 * do roadmap de refatoração, continuação da extração dos demais systems/).
 * O tick de progresso (update por delta, cancelamento ao mover) permanece em
 * GameScene.update(), pois já opera diretamente sobre os campos que aqui
 * também lemos/escrevemos (scene.isScavenging, scene.currentScavengeable,
 * scene.scavengeTimeElapsed) — mover apenas os métodos evita duplicar estado.
 */
export class ScavengingSystem {
  constructor(private scene: GameScene) {}

  startScavenging(scav: Scavengeable) {
    const scene = this.scene;
    if (scene.isScavenging) return;
    scene.isScavenging = true;
    scene.currentScavengeable = scav;
    scene.scavengeTimeElapsed = 0;
    useGameStore.getState().setScavengeProgress(0);
    soundEngine.playDash();
  }

  cancelScavenging() {
    const scene = this.scene;
    scene.isScavenging = false;
    scene.currentScavengeable = null;
    scene.scavengeTimeElapsed = 0;
    useGameStore.getState().setScavengeProgress(0);
  }

  completeScavenging() {
    const scene = this.scene;
    if (!scene.isScavenging || !scene.currentScavengeable) return;
    const scav = scene.currentScavengeable;
    scav.isScavenged = true;
    scav.setTint(0x333333);

    soundEngine.playChestOpen();

    if (scav.scavengeType === 'player_corpse') {
      useGameStore.getState().retrieveCorpseLoot();
      scene.spawnFloatingText(scav.x, scav.y - 12, `EQUIPAMENTOS RECUPERADOS!`, '#f59e0b', true);
      this.cancelScavenging();
      return;
    }

    const isCorpse = scav.scavengeType === 'corpse';
    const isSkeleton = scav.scavengeType === 'skeleton';

    const xpReward = isCorpse ? 25 : (isSkeleton ? 15 : 10);
    scene.player.addXp(xpReward);
    scene.spawnFloatingText(scav.x, scav.y - 12, `+${xpReward} XP`, '#3b82f6', false);

    const crystals = Math.floor(10 + Math.random() * (isCorpse ? 30 : 15));
    useGameStore.getState().addBloodCrystals(crystals);
    scene.spawnFloatingText(scav.x, scav.y - 25, `+${crystals} CRISTAIS 💎`, '#f43f5e', true);

    const equipChance = isCorpse ? 0.25 : 0.10;
    if (Math.random() < equipChance) {
      const lootItem = LootSystem.generateLoot(scene.currentFloorDepth, false);
      const lootSprite = new LootSprite(scene, scav.x + (Math.random() - 0.5) * 20, scav.y + (Math.random() - 0.5) * 20, lootItem);
      scene.lootGroup.add(lootSprite);
      scene.depthGroup.add(lootSprite);
      scene.lightingPolish?.addItemGlow(lootSprite, lootItem.rarity);
    }

    // Chance to scavenge curatives (Atadura, Antídoto, Antibiótico)
    if (Math.random() < 0.35) {
      const types: Array<'bandages' | 'antidotes' | 'antibiotics'> = ['bandages', 'antidotes', 'antibiotics'];
      const picked = types[Math.floor(Math.random() * types.length)];
      const names = { bandages: 'Atadura 🩸', antidotes: 'Antídoto 🍇', antibiotics: 'Antibiótico 🧪' };
      const store = useGameStore.getState();
      const currentCuratives = store.playerStats.curatives || { bandages: 0, antidotes: 0, antibiotics: 0 };
      useGameStore.setState((state) => ({
        playerStats: {
          ...state.playerStats,
          curatives: {
            ...currentCuratives,
            [picked]: currentCuratives[picked] + 1
          }
        }
      }));
      scene.player.stats.curatives = useGameStore.getState().playerStats.curatives;
      scene.spawnFloatingText(scav.x, scav.y - 38, `+1 ${names[picked]}`, '#38bdf8', true);
      store.addLootLog(`Saqueou curativo: ${names[picked]}`);
    }

    this.cancelScavenging();
  }

  useCurativeItem(type: 'bandages' | 'antidotes' | 'antibiotics') {
    const scene = this.scene;
    const store = useGameStore.getState();
    const success = store.useCurative(type);
    if (success) {
      scene.player.stats.statusConditions = store.playerStats.statusConditions;
      scene.player.stats.curatives = store.playerStats.curatives;
      const msgs = {
        bandages: 'FERIDA ESTANCADA!',
        antidotes: 'VENENO PURIFICADO!',
        antibiotics: 'INFECÇÃO ERRADICADA!'
      };
      const colors = {
        bandages: '#ef4444',
        antidotes: '#22c55e',
        antibiotics: '#a855f7'
      };
      scene.spawnFloatingText(scene.player.x, scene.player.y - 18, msgs[type], colors[type], true);
      store.addLootLog(`Atalho: Usou ${type}`);
    } else {
      if (store.playerStats.curatives[type] < 1) {
        scene.spawnFloatingText(scene.player.x, scene.player.y - 15, 'SEM CURATIVOS!', '#94a3b8', false);
      }
    }
  }
}
