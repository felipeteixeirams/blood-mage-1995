import Phaser from 'phaser';
import { PlayerStats, SpellConfig, LootItem } from '../../types/game';
import spellsData from '../../data/spells.json';
import talentsData from '../../data/talents.json';
import { soundEngine } from '../../utils/soundEngine';
import { useGameStore } from '../../store/gameStore';
import { safePlayAnimation } from '../animations/animationManager';
import { getEquipmentRarityTint, shouldEmitLegendarySparks } from '../../utils/equipmentPalette';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public stats: PlayerStats;
  private moveVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private aimVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  private manualAimTimer: number = 0;
  private lastAutoShootTime: number = 0;
  // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
  // ataque físico de adaga — curto alcance, sem custo de HP/mana, usado no
  // lugar do blood_bolt enquanto o feitiço ainda não foi descoberto no modo
  // campanha. `pendingMeleeHitTarget` é consumido por GameScene.update() logo
  // depois de updatePlayer(), no mesmo espírito do delta de mana que já
  // sinaliza quando um blood_bolt foi disparado.
  private lastMeleeAttackTime: number = 0;
  private readonly MELEE_COOLDOWN_MS = 500;
  public readonly MELEE_RANGE = 50;
  public pendingMeleeHitTarget: any | null = null;
  // Duração fixa da pose de conjuração (6 frames @ 10fps = 600ms), disparada uma
  // única vez por tiro em vez de reavaliada a cada frame — evita que a animação
  // reinicie/"dance" a cada frame por causa de auto-fire contínuo ou do alvo se
  // mover (ver relato: "personagem parado parece que ele fica dançando").
  private castAnimTimer: number = 0;
  private castAnimDir: string = 'south';
  // Última direção usada para a pose idle/parado, para não recalcular (e
  // "tremer") a cada frame quando o aimVector oscila sutilmente.
  private lastIdleDir: string = 'south';
  private skillCooldowns: Record<string, number> = {};
  public isInvulnerable: boolean = false;
  // Frente 7 (spec 11, 27/08): emissor lazy de faíscas pra equipamento
  // lendário — ver `updateLegendarySparks()`.
  private legendarySparkEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private invulnerableTimer: number = 0;
  public equippedLoot: LootItem[] = [];

  // Status condition DoT timers
  private bleedTimer: number = 0;
  private poisonTimer: number = 0;
  private infectionTimer: number = 0;

  // Dash mechanics
  public isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashCooldownTimer: number = 0;
  private dashVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private readonly DASH_DURATION = 150; // ms
  private readonly DASH_INVULNERABILITY = 200; // ms
  private readonly DASH_COOLDOWN = 3000; // ms
  public isBoneShieldActive: boolean = false;

  // Movement acceleration (Dungeon Siege feel)
  private currentVx: number = 0;
  private currentVy: number = 0;
  private readonly ACCELERATION = 1400;
  private readonly DECELERATION = 1000;

  // Directional Indicator Ground Reticle
  private directionReticleGraphics?: Phaser.GameObjects.Graphics;
  private currentFacingAngle: number = Math.PI / 2; // Default facing south
  private currentLockedTarget: any = null;
  private targetLockGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'spr_bloodmage');
    if ((scene as any).lightingSystem) { (scene as any).lightingSystem.applyLightPipeline(this); }
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(22, 28);
    this.setOffset(13, 14);

    const typedSpellsData = spellsData as Record<string, SpellConfig>;


    const { talentLevels } = useGameStore.getState();
    
    let baseMaxHp = 100;
    let baseMoveSpeed = 160;
    let baseDmgMult = 1.0;
    let baseLifesteal = 0.0;
    let baseCooldownRed = 0.0;
    let baseSacrificeDiscount = 0.0;

    talentsData.forEach((t) => {
      const lvl = talentLevels[t.id] || 0;
      if (lvl > 0) {
        const bonus = t.bonusPerLevel * lvl;
        if (t.statKey === 'maxHp') baseMaxHp += bonus;
        if (t.statKey === 'moveSpeed') baseMoveSpeed += bonus;
        if (t.statKey === 'damage') baseDmgMult += bonus;
        if (t.statKey === 'lifesteal') baseLifesteal += bonus;
        if (t.statKey === 'cooldown') baseCooldownRed += bonus;
        if (t.statKey === 'sacrificeDiscount') baseSacrificeDiscount += bonus;
      }
    });

    this.stats = {
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      mana: 100,
      maxMana: 100,
      level: 1,
      currentXp: 0,
      nextLevelXp: 50,
      moveSpeed: baseMoveSpeed,
      damageMultiplier: baseDmgMult,
      cooldownReduction: baseCooldownRed,
      vampirism: baseLifesteal,
      sacrificeDiscount: baseSacrificeDiscount,
      projectileBonus: 0,

      kills: 0,
      souls: 0,
      wave: 1,
      floorDepth: 1,
      score: 0,
      timeSurvivedSeconds: 0,
      unlockedSpells: ['blood_bolt', 'hellfire_nova', 'syphon_soul', 'bone_shield', 'crimson_scythe', 'blood_ritual_circle', 'hemomancy_beam'],
      pendingStatPoints: 0,
      knockoutCount: 0,
      isUnconscious: false,
      isDefinitivelyDead: false,
      statusConditions: {
        bleeding: false,
        poison: false,
        infection: false,
      },
      curatives: {
        bandages: 1,
        antidotes: 1,
        antibiotics: 0,
      },
      droppedCorpse: {
        hasDroppedCorpse: false,
        zone: '',
        x: 0,
        y: 0,
        droppedTimestamp: 0,
        equipment: { weapon: null, armor: null, relics: [] },
        curatives: { bandages: 0, antidotes: 0, antibiotics: 0 },
      },
    };

    // Init skill cooldowns
    Object.keys(typedSpellsData).forEach((id) => {
      this.skillCooldowns[id] = 0;
    });

    this.applyCosmeticTint();
  }

  public applyCosmeticTint() {
    // Frente 7 (spec 11, 27/08) — Palette Swap procedural: raridade do
    // equipamento (arma/armadura) tem precedência sobre a paleta cosmética
    // escolhida manualmente em Configurações quando rare+, sinalizando de
    // longe "esse jogador está bem equipado". Ver `utils/equipmentPalette.ts`.
    const equipmentTint = getEquipmentRarityTint(useGameStore.getState().equipment);
    if (equipmentTint !== null) {
      this.setTint(equipmentTint);
      return;
    }

    const activeId = useGameStore.getState().settings.activePaletteId || 'crimson';
    const palettes = [
      { id: "crimson", color: "#ffffff" },
      { id: "corrupted", color: "#d8b4fe" },
      { id: "golden", color: "#fef08a" },
      { id: "shadow", color: "#ffffff" }
    ];
    const match = palettes.find(p => p.id === activeId);
    if (match && match.color !== '#ffffff') {
      const tintHex = parseInt(match.color.replace('#', '0x'), 16);
      this.setTint(tintHex);
    } else {
      this.clearTint();
    }
  }

  /**
   * Frente 7 (spec 11, 27/08): alias de `applyCosmeticTint()` pro contrato
   * genérico `StatusTarget.applyBaseTint` que `StatusEffectSystem.ts` já
   * chama pra restaurar o tint "de base" quando um status (burning/frozen/
   * cursed) expira — `Enemy.ts` já implementa isso, o Player nunca tinha
   * (o `typeof target.applyBaseTint === 'function'` falhava silenciosamente
   * pra ele, então o restore caía no `clearTint()` genérico, perdendo o tint
   * de equipamento/paleta cosmética depois de um status desses expirar).
   */
  public applyBaseTint() {
    this.applyCosmeticTint();
  }

  /**
   * Frente 7 (spec 11, 27/08): emissor de partículas afixado (faíscas) só
   * pra equipamento lendário — mesmo padrão de `StatusEffectSystem`'s
   * `emberEmitter.emitParticleAt(...)` probabilístico por frame, em vez de
   * um emissor contínuo com `.startFollow()`/`.start()`/`.stop()` (sem
   * precedente nesta base de código).
   */
  private updateLegendarySparks(): void {
    if (!this.scene || !this.scene.add || typeof (this.scene.add as any).particles !== 'function') return;
    if (!shouldEmitLegendarySparks(useGameStore.getState().equipment)) return;

    if (!this.legendarySparkEmitter) {
      if (!this.scene.textures?.exists?.('particle_ember_spark')) return;
      this.legendarySparkEmitter = this.scene.add.particles(0, 0, 'particle_ember_spark', {
        speedY: { min: -55, max: -95 },
        speedX: { min: -20, max: 20 },
        scale: { start: 0.9, end: 0.15 },
        alpha: { start: 0.85, end: 0 },
        lifespan: 500,
        emitting: false,
      }).setDepth(1850);
    }

    if (Math.random() < 0.25) {
      this.legendarySparkEmitter.emitParticleAt(
        this.x + (Math.random() - 0.5) * 14,
        this.y + 4 + (Math.random() - 0.5) * 10
      );
    }
  }

  public setMoveInput(x: number, y: number) {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) {
      this.moveVector.set(0, 0);
      return;
    }
    this.moveVector.set(x, y);
    if (this.moveVector.length() > 1) {
      this.moveVector.normalize();
    }
  }

  public setAimInput(x: number, y: number) {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) {
      return;
    }
    if (x !== 0 || y !== 0) {
      this.aimVector.set(x, y).normalize();
      this.manualAimTimer = 350; // User explicitly aimed, grant manual priority for 350ms
    }
  }

  public getEffectiveDamageMultiplier(): number {
    const relicMods = useGameStore.getState().getRelicModifiers();
    const prestigeMods = useGameStore.getState().getPrestigeModifiers?.() || { damageMult: 1, bonusMaxHp: 0, cdrBonus: 0, vampBonus: 0, dropMult: 1 };
    return (this.stats.damageMultiplier + (relicMods.damageMultiplier || 0)) * prestigeMods.damageMult;
  }

  public getEffectiveVampirism(): number {
    const relicMods = useGameStore.getState().getRelicModifiers();
    const prestigeMods = useGameStore.getState().getPrestigeModifiers?.() || { damageMult: 1, bonusMaxHp: 0, cdrBonus: 0, vampBonus: 0, dropMult: 1 };
    return this.stats.vampirism + (relicMods.lifestealBonus || 0) + prestigeMods.vampBonus;
  }

  public getEffectiveMoveSpeed(): number {
    const relicMods = useGameStore.getState().getRelicModifiers();
    const base = this.stats.moveSpeed + (relicMods.speedBonus || 0);
    return Math.max(40, base * (this.stats.statusConditions?.bleeding ? 0.8 : 1.0));
  }

  public getEffectiveMaxHp(): number {
    const relicMods = useGameStore.getState().getRelicModifiers();
    const prestigeMods = useGameStore.getState().getPrestigeModifiers?.() || { damageMult: 1, bonusMaxHp: 0, cdrBonus: 0, vampBonus: 0, dropMult: 1 };
    return Math.max(10, this.stats.maxHp + (relicMods.maxHpBonus || 0) + prestigeMods.bonusMaxHp);
  }

  public getEffectiveCooldownReduction(): number {
    const relicMods = useGameStore.getState().getRelicModifiers();
    const prestigeMods = useGameStore.getState().getPrestigeModifiers?.() || { damageMult: 1, bonusMaxHp: 0, cdrBonus: 0, vampBonus: 0, dropMult: 1 };
    return Math.min(0.75, Math.max(0, this.stats.cooldownReduction + (relicMods.cooldownReductionBonus || 0) + prestigeMods.cdrBonus));
  }

  public updatePlayer(time: number, delta: number) {
    // Manual aim timer countdown
    if (this.manualAimTimer > 0) {
      this.manualAimTimer -= delta;
    }

    // Cast animation pulse countdown (fixo, definido no momento do tiro)
    if (this.castAnimTimer > 0) {
      this.castAnimTimer -= delta;
    }

    // Cooldown timers
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
    }

    if (this.stats.isUnconscious) {
      this.setVelocity(0, 0);
      this.currentVx = 0;
      this.currentVy = 0;
      this.setAlpha(0.6);
      this.setTint(0x550000);
      this.setAngle(90); // Lying down fallen sprite posture

      // Regenerate passive HP while unconscious (2% of Max HP per second)
      // Infection blocks natural regeneration (Discovery Seção 2.4)
      if (!this.stats.statusConditions.infection) {
        const regenAmount = (0.02 * this.getEffectiveMaxHp() * delta) / 1000;
        this.stats.hp = Math.min(this.getEffectiveMaxHp(), this.stats.hp + regenAmount);
      }

      const threshold = 0.05 * this.getEffectiveMaxHp();
      if (this.stats.hp >= threshold) {
        this.stats.isUnconscious = false;
        this.stats.hp = Math.ceil(threshold);
        this.isInvulnerable = true;
        this.invulnerableTimer = 1500; // 1.5s wake-up invulnerability
        this.setAlpha(1.0);
        this.setAngle(0); // Stand back up
        this.clearTint();

        useGameStore.getState().setUnconscious(false);
        useGameStore.getState().setPlayerStats({ ...this.stats });
      } else {
        useGameStore.getState().setPlayerStats({ ...this.stats });
      }

      // Update skill cooldowns
      Object.keys(this.skillCooldowns).forEach((key) => {
        if (this.skillCooldowns[key] > 0) {
          this.skillCooldowns[key] -= delta;
        }
      });
      return;
    }

    // Fase 3: Survival Status Conditions tick
    this.updateStatusConditions(delta);

    // Relic Passive HP Regen Bonus / Penalty (e.g. Cálice Amaldiçoado -0.5 HP/s)
    if (!this.stats.isUnconscious && !this.stats.isDefinitivelyDead) {
      const relicMods = useGameStore.getState().getRelicModifiers();
      if (relicMods.hpRegenBonus && relicMods.hpRegenBonus !== 0) {
        const effMaxHp = this.getEffectiveMaxHp();
        const regenAmount = (relicMods.hpRegenBonus * delta) / 1000;
        if (regenAmount < 0) {
          this.stats.hp = Math.max(1, this.stats.hp + regenAmount);
        } else {
          this.stats.hp = Math.min(effMaxHp, this.stats.hp + regenAmount);
        }
      }
    }

    if (this.isDashing) {
      this.dashTimer -= delta;

      const dashSpeed = 800; // 120px in 150ms is ~800px/s
      this.setVelocity(this.dashVector.x * dashSpeed, this.dashVector.y * dashSpeed);

      // Spawn ghost trail (simple throttle)
      if (Math.floor(time / 20) % 2 === 0) {
        if (this.scene && this.scene.add && this.scene.tweens) {
          const trail = this.scene.add.image(this.x, this.y, this.texture.key);
          trail.setTint(0xef4444);
          trail.setAlpha(0.5);
          trail.setScale(this.scaleX, this.scaleY);
          trail.setDepth(this.depth - 1);
          this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 200,
            onComplete: () => {
              if (trail && trail.active) trail.destroy();
            }
          });
        }
        if ((this.scene as any).advancedParticles) {
          (this.scene as any).advancedParticles.emitDashTrail(this.x, this.y);
        }
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;
      }
    } else {
      // Movement Physics — acceleration-based for smooth start/stop
      const speed = this.getEffectiveMoveSpeed();
      const dt = delta / 1000;
      const targetVx = this.moveVector.x * speed;
      const targetVy = this.moveVector.y * speed;

      // Accelerate toward target (instant if target is zero = friction)
      if (this.moveVector.x !== 0 || this.moveVector.y !== 0) {
        this.currentVx = this.moveToward(this.currentVx, targetVx, this.ACCELERATION * dt);
        this.currentVy = this.moveToward(this.currentVy, targetVy, this.ACCELERATION * dt);
      } else {
        this.currentVx = this.moveToward(this.currentVx, 0, this.DECELERATION * dt);
        this.currentVy = this.moveToward(this.currentVy, 0, this.DECELERATION * dt);
      }
      this.setVelocity(this.currentVx, this.currentVy);
    }

    // Play directional walk or idle animation based on movement and aim.
    const isMoving = this.moveVector.x !== 0 || this.moveVector.y !== 0;

    // A pose de conjuração usa direção e duração FIXAS, travadas no instante do
    // tiro (ver castBloodBolt). Isso evita reiniciar a animação a cada frame
    // por causa de auto-fire contínuo ou do alvo se mover — que era a causa da
    // "dança" relatada quando o personagem estava parado.
    const isCasting = this.castAnimTimer > 0 && !isMoving;

    let dir: string;
    if (isCasting) {
      dir = this.castAnimDir;
    } else if (isMoving) {
      dir = this.get8Direction(this.moveVector.x, this.moveVector.y);
    } else if (this.manualAimTimer > 0) {
      // Mira manual ativa: acompanha o vetor de mira em tempo real.
      dir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    } else {
      // Parado, sem mira manual e sem conjurar: fica no asset estático,
      // usando a última direção conhecida em vez de recalcular a cada frame
      // (o aimVector pode oscilar sutilmente ao seguir um alvo distante,
      // o que fazia o idle "tremer" entre poses vizinhas).
      dir = this.lastIdleDir;
    }
    this.lastIdleDir = dir;

    this.setFlipX(false);

    const animState = isCasting ? 'cast' : isMoving ? 'walk' : 'idle';
    const animKey = `bloodmage_${animState}_${dir}`;

    if (this.scene && this.scene.anims && this.scene.anims.exists(animKey)) {
      // ignoreIfPlaying=true (default): não reinicia o cast enquanto ele ainda
      // está tocando, mas como repeat:0 termina e marca isPlaying=false, o
      // próximo tiro na mesma direção reinicia normalmente.
      safePlayAnimation(this, animKey);
    } else {
      safePlayAnimation(this, isMoving ? 'bloodmage_walk_south' : 'bloodmage_idle_south');
    }

    // Sync status conditions & curatives from Zustand store
    const storeStats = useGameStore.getState().playerStats;
    if (storeStats) {
      this.stats.statusConditions = storeStats.statusConditions || this.stats.statusConditions;
      this.stats.curatives = storeStats.curatives || this.stats.curatives;
    }

    // Process Status Conditions DoT (Bleeding, Poison, Infection)
    if (!this.stats.isUnconscious && !this.stats.isDefinitivelyDead) {
      this.bleedTimer += delta;
      this.poisonTimer += delta;
      this.infectionTimer += delta;

      if (this.stats.statusConditions?.bleeding) {
        if (this.bleedTimer >= 1500) {
          this.bleedTimer = 0;
          this.takeDamage(3);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-3 SANGRAMENTO', '#ef4444', false);
          }
          import('../systems/CombatFeel').then(m => m.CombatFeel.triggerVibration('bleeding_tick'));
        }

        // Leave blood droplets on the floor while walking with bleeding status
        if ((this.moveVector.x !== 0 || this.moveVector.y !== 0) && Math.floor(time / 250) % 2 === 0) {
          if (this.scene && this.scene.add && this.scene.tweens) {
            const drop = this.scene.add.image(this.x + (Math.random() - 0.5) * 8, this.y + 8, 'particle_blood_red');
            drop.setTint(0x990000);
            drop.setDepth(3);
            drop.setScale(0.7);
            this.scene.tweens.add({
              targets: drop,
              alpha: 0,
              duration: 1800,
              onComplete: () => {
                if (drop && drop.active) drop.destroy();
              }
            });
          }
        }
      }

      if (this.stats.statusConditions?.poison) {
        if (this.poisonTimer >= 2000) {
          this.poisonTimer = 0;
          this.takeDamage(4);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-4 VENENO', '#22c55e', false);
          }
        }
      }

      if (this.stats.statusConditions?.infection) {
        if (this.infectionTimer >= 3000) {
          this.infectionTimer = 0;
          this.takeDamage(2);
          if (this.scene && 'spawnFloatingText' in this.scene) {
            (this.scene as any).spawnFloatingText(this.x, this.y - 12, '-2 INFECÇÃO', '#a855f7', false);
          }
        }
      }

      // Visual Status Tints
      if (!this.isInvulnerable) {
        if (this.stats.statusConditions?.poison) {
          this.setTint(0x4ade80); // Green
        } else if (this.stats.statusConditions?.infection) {
          this.setTint(0xc084fc); // Purple
        } else if (this.stats.statusConditions?.bleeding) {
          this.setTint(0xf87171); // Deep Red
        } else {
          this.applyCosmeticTint();
        }
      }

      this.updateLegendarySparks();
    }

    // Mana Regeneration (+4 MP/sec, reduced by 50% if poisoned)
    const manaRegenRate = this.stats.statusConditions?.poison ? 2 : 4;
    if (this.stats.mana < this.stats.maxMana) {
      this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + (manaRegenRate * delta) / 1000);
    }

    // Invulnerability Flashing
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      this.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.3 : 1.0);
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.setAlpha(1.0);
      }
    }

    // Update cooldown timers
    Object.keys(this.skillCooldowns).forEach((key) => {
      if (this.skillCooldowns[key] > 0) {
        this.skillCooldowns[key] -= delta;
      }
    });

    // Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
    // no modo campanha, antes do blood_bolt ser descoberto (Altar Ancestral),
    // o "ataque automático" primário é a adaga — curto alcance, sem projétil,
    // sem custo. Fora da campanha (ou já com blood_bolt desbloqueado) o
    // comportamento de sempre continua idêntico.
    const isMeleePhase = !useGameStore.getState().isCampaignSpellUnlocked('blood_bolt');
    // Fechamento do gap descrito na "Observação de escopo" da Frente 3 (27/08):
    // o corpo a corpo só deve funcionar se a Adaga de Aço já estiver
    // FISICAMENTE equipada (`equipItem` roda no pickup do baú de suprimentos —
    // ver `CollisionHandlers.handleCollectLoot`), não só porque blood_bolt
    // ainda está trancado. Sem a adaga (jogador ainda não abriu o baú), o
    // personagem fica sem ataque automático algum nessa fase — fiel ao texto
    // do critério de aceite #5 ("adaga fisicamente equipada como
    // pré-requisito do corpo a corpo"), e ao fluxo real da campanha (Safe
    // House → abrir baú → só então floresta com inimigos).
    const hasMeleeWeaponEquipped = useGameStore.getState().equipment.weapon !== null;
    const canMelee = isMeleePhase && hasMeleeWeaponEquipped;

    // Auto Shoot Primary (Blood Bolt) with Intelligent Directional Cone Aiming
    const bloodBoltConfig = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    const autoCd = bloodBoltConfig.cooldownMs * (1 - this.getEffectiveCooldownReduction());

    const pointer = this.scene && this.scene.input && this.scene.input.activePointer;
    const isPointerDown = pointer && pointer.isDown;

    const targetEnemy = this.findBestTarget(isMeleePhase ? this.MELEE_RANGE : 380);
    const hasEnemyInRange = targetEnemy !== null;

    // If an enemy is found and user is not manually aiming with right stick/pointer,
    // align aimVector towards the chosen target
    if (this.manualAimTimer <= 0) {
      if (targetEnemy) {
        this.aimVector.set(targetEnemy.x - this.x, targetEnemy.y - this.y).normalize();
      } else if (this.moveVector.lengthSq() > 0.01) {
        // Face movement path
        this.aimVector.set(this.moveVector.x, this.moveVector.y).normalize();
      }
    }

    if (isMeleePhase) {
      if (canMelee && targetEnemy && time > this.lastMeleeAttackTime + this.MELEE_COOLDOWN_MS) {
        this.castDaggerStrike(time, targetEnemy);
      }
      // Sem a adaga equipada e sem blood_bolt desbloqueado: nenhum
      // ataque automático dispara (ver comentário de `canMelee` acima).
    } else if ((isPointerDown || hasEnemyInRange) && time > this.lastAutoShootTime + autoCd) {
      this.castBloodBolt(time);
    }

    // Directional indicator rendering
    this.renderDirectionReticle();
    this.renderTargetLockReticle(time);
  }

  /**
   * Renders a high-contrast, polished gothic ground reticle under the player's feet
   * indicating exact movement / facing / aim angle.
   */
  private renderDirectionReticle(): void {
    if (!this.scene || !this.scene.add || this.stats.isUnconscious || this.stats.isDefinitivelyDead) {
      if (this.directionReticleGraphics) {
        this.directionReticleGraphics.clear();
      }
      return;
    }

    if (!this.directionReticleGraphics) {
      this.directionReticleGraphics = this.scene.add.graphics();
      this.directionReticleGraphics.setDepth(this.depth - 1);
    }

    const g = this.directionReticleGraphics;
    g.clear();

    const isMoving = this.moveVector.x !== 0 || this.moveVector.y !== 0;
    const isAiming = this.manualAimTimer > 0;

    // Determine target angle
    let targetAngle = this.currentFacingAngle;
    if (isAiming) {
      targetAngle = Math.atan2(this.aimVector.y, this.aimVector.x);
    } else if (isMoving) {
      targetAngle = Math.atan2(this.moveVector.y, this.moveVector.x);
    } else if (this.aimVector.x !== 0 || this.aimVector.y !== 0) {
      targetAngle = Math.atan2(this.aimVector.y, this.aimVector.x);
    }

    // Smooth angle lerp (prevent sharp snapping)
    const diff = Phaser.Math.Angle.Wrap(targetAngle - this.currentFacingAngle);
    this.currentFacingAngle += diff * 0.25;

    const angle = this.currentFacingAngle;
    const alpha = isMoving || isAiming ? 0.9 : 0.45;
    const px = this.x;
    const py = this.y + 7; // Anchored at feet

    // 1. Subtle Runic Ground Circle
    g.lineStyle(1.5, 0x881337, alpha * 0.4);
    g.strokeCircle(px, py, 14);

    // 2. High-Contrast Golden Directional Arc
    g.lineStyle(2.5, 0xffd700, alpha * 0.85);
    g.beginPath();
    g.arc(px, py, 14, angle - Math.PI / 4, angle + Math.PI / 4, false);
    g.strokePath();

    // 3. Directional Forward Pointer (Chevron)
    const tipDist = 23;
    const tipX = px + Math.cos(angle) * tipDist;
    const tipY = py + Math.sin(angle) * tipDist;
    const leftAngle = angle + 2.35;
    const rightAngle = angle - 2.35;
    const wingLen = 8;

    g.lineStyle(2.5, 0xffffff, alpha * 0.95);
    g.beginPath();
    g.moveTo(tipX + Math.cos(leftAngle) * wingLen, tipY + Math.sin(leftAngle) * wingLen);
    g.lineTo(tipX, tipY);
    g.lineTo(tipX + Math.cos(rightAngle) * wingLen, tipY + Math.sin(rightAngle) * wingLen);
    g.strokePath();

    // Golden / Ruby Pointer Core
    g.fillStyle(0xffd700, alpha);
    g.fillTriangle(
      tipX,
      tipY,
      tipX + Math.cos(leftAngle) * wingLen * 0.7,
      tipY + Math.sin(leftAngle) * wingLen * 0.7,
      tipX + Math.cos(rightAngle) * wingLen * 0.7,
      tipY + Math.sin(rightAngle) * wingLen * 0.7
    );

    // Glowing tip bead
    g.fillStyle(0xef4444, alpha);
    g.fillCircle(tipX, tipY, 2.5);
  }

    public destroy(fromScene?: boolean): void {
    if (this.directionReticleGraphics) {
      this.directionReticleGraphics.destroy();
      this.directionReticleGraphics = undefined;
    }
    if (this.targetLockGraphics) {
      this.targetLockGraphics.destroy();
      this.targetLockGraphics = undefined;
    }
    super.destroy(fromScene);
  }

  /**
   * Intelligently selects the best target based on directional cone (forward path) and proximity.
   * If moving, strongly weights enemies in the forward direction.
   * If stationary, selects closest radial enemy.
   */
    /**
   * Renders a pulsing runic reticle under the currently locked target.
   */
  private renderTargetLockReticle(time: number): void {
    if (!this.scene || !this.scene.add || !this.currentLockedTarget || !this.currentLockedTarget.active || this.currentLockedTarget.hp <= 0) {
      if (this.targetLockGraphics) {
        this.targetLockGraphics.clear();
      }
      return;
    }

    if (!this.targetLockGraphics) {
      this.targetLockGraphics = this.scene.add.graphics();
    }
    
    // Make sure it's drawn under the target (usually depth 0 or depth - 1)
    this.targetLockGraphics.setDepth(this.currentLockedTarget.depth - 0.1 || 0);

    const g = this.targetLockGraphics;
    g.clear();

    const target = this.currentLockedTarget;
    const tx = target.x;
    const ty = target.y + (target.height * 0.4 || 10); // slightly offset to feet

    // Pulse effect
    const pulse = Math.sin(time / 200) * 0.15 + 0.85;
    const radius = (target.width * 0.6 || 16) * pulse;
    
    // Outer dashed/runic ring
    g.lineStyle(1.5, 0xef4444, 0.7 * pulse);
    const dashCount = 8;
    const dashAngle = (Math.PI * 2) / dashCount;
    const rotation = time / 1000; // slow rotation
    
    for (let i = 0; i < dashCount; i++) {
        g.beginPath();
        g.arc(tx, ty, radius, rotation + i * dashAngle, rotation + i * dashAngle + dashAngle * 0.6, false);
        g.strokePath();
    }
    
    // Inner solid ring
    g.lineStyle(1, 0x991b1b, 0.5 * pulse);
    g.strokeCircle(tx, ty, radius * 0.7);
    
    // Small inner dots/runes
    g.fillStyle(0xef4444, 0.8 * pulse);
    for (let i = 0; i < 4; i++) {
        const ax = tx + Math.cos(-rotation * 2 + i * Math.PI/2) * (radius * 0.4);
        const ay = ty + Math.sin(-rotation * 2 + i * Math.PI/2) * (radius * 0.4);
        g.fillCircle(ax, ay, 1.5);
    }
  }

  public findBestTarget(maxRange: number = 380): any | null {
    if (!this.scene || !('enemiesGroup' in this.scene)) return null;
    const enemiesGroup = (this.scene as any).enemiesGroup;
    if (!enemiesGroup || !enemiesGroup.getChildren) return null;

    // Hysteresis check: keep locked target if still valid and within slightly extended range
    if (this.currentLockedTarget && this.currentLockedTarget.active && this.currentLockedTarget.hp > 0) {
      const lockDist = Math.hypot(this.currentLockedTarget.x - this.x, this.currentLockedTarget.y - this.y);
      if (lockDist <= maxRange * 1.2) {
        return this.currentLockedTarget;
      }
    }

    const isMoving = this.moveVector.lengthSq() > 0.01;
    // Reference vector for forward cone
    const refX = isMoving ? this.moveVector.x : this.aimVector.x;
    const refY = isMoving ? this.moveVector.y : this.aimVector.y;
    const refLen = Math.hypot(refX, refY) || 1;
    const normRefX = refX / refLen;
    const normRefY = refY / refLen;

    let bestTarget: any = null;
    let highestScore = -Infinity;

    enemiesGroup.getChildren().forEach((enemy: any) => {
      if (!enemy || !enemy.active || enemy.hp <= 0) return;

      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRange) return;

      const normDx = dx / (dist || 1);
      const normDy = dy / (dist || 1);

      // Dot product: 1 = directly in front, 0 = 90 deg sideways, -1 = behind
      const dot = normRefX * normDx + normRefY * normDy;

      let dirMultiplier = 1.0;
      if (isMoving) {
        if (dot > 0.5) {
          // Inside 120-degree frontal cone: strong bonus
          dirMultiplier = 1.0 + dot * 2.2;
        } else if (dot > 0) {
          // Flanking (45-90 degrees)
          dirMultiplier = 0.9 + dot * 0.5;
        } else {
          // Behind player: penalized unless in emergency melee range (< 140px)
          dirMultiplier = dist < 140 ? 0.7 : 0.25;
        }
      } else {
        // Stationary: slight preference for facing direction, mostly radial proximity
        dirMultiplier = 1.0 + Math.max(0, dot) * 0.4;
      }

      // Proximity score: closer is higher
      const distScore = 1000 / (dist + 40);

      // Spec 16 (Cap. 2.4 - Target Lock Assistance Formula):
      // Score(E) = w1 * (1 / Dist) + w2 * (1 - HP_e / HP_max) + w3 * ThreatTier
      const missingHpPct = enemy.maxHp ? Math.max(0, 1 - enemy.hp / enemy.maxHp) : 0;
      const isBoss = enemy.config?.behavior === 'boss' || enemy.config?.id?.includes('boss');
      const isElite = enemy.eliteAffix && enemy.eliteAffix !== 'none';
      const threatTierWeight = isBoss ? 3.0 : isElite ? 2.0 : 1.0;

      const priorityScore = (distScore * 0.5) + (missingHpPct * 120) + (threatTierWeight * 150);
      const totalScore = priorityScore * dirMultiplier;

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestTarget = enemy;
      }
    });

    this.currentLockedTarget = bestTarget;
    return bestTarget;
  }

  private get8Direction(vx: number, vy: number): string {
    const angle = Math.atan2(vy, vx) * (180 / Math.PI);
    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'south_east';
    if (angle >= 67.5 && angle < 112.5) return 'south';
    if (angle >= 112.5 && angle < 157.5) return 'south_west';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'north_west';
    if (angle >= -112.5 && angle < -67.5) return 'north';
    if (angle >= -67.5 && angle < -22.5) return 'north_east';
    return 'south';
  }

  public getAimAngle(): number {
    return Math.atan2(this.aimVector.y, this.aimVector.x);
  }

  public getAimVector(): Phaser.Math.Vector2 {
    return this.aimVector;
  }

  public getCooldownRemaining(spellId: string): number {
    return Math.max(0, this.skillCooldowns[spellId] || 0);
  }

  public getDashCooldownRemaining(): number {
    return Math.max(0, this.dashCooldownTimer);
  }

  public triggerDash(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    if (this.isDashing || this.dashCooldownTimer > 0) return false;

    this.isDashing = true;
    this.dashTimer = this.DASH_DURATION;

    // Set invulnerability frames: 200ms
    this.isInvulnerable = true;
    this.invulnerableTimer = this.DASH_INVULNERABILITY;

    // Direction: if moving, dash in movement direction. Otherwise, in aim direction.
    if (this.moveVector.x !== 0 || this.moveVector.y !== 0) {
      this.dashVector.copy(this.moveVector).normalize();
    } else {
      this.dashVector.copy(this.aimVector).normalize();
    }

    // Cooldown reducible by CDR (talent and stats)
    const cd = this.DASH_COOLDOWN * (1 - this.getEffectiveCooldownReduction());
    this.dashCooldownTimer = cd;

    soundEngine.playDash();

    // Spec 16 Onboarding trigger: first dash executed
    const store = useGameStore.getState();
    store.triggerOnboardingEvent('firstDashDone');
    if (store.activeTip?.includes('ESQUIVE')) {
      store.setActiveTip(null);
    }

    return true;
  }

  public castBloodBolt(time: number): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['blood_bolt'];
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    this.lastAutoShootTime = time;
    // Dispara a pose de conjuração UMA vez, com direção e duração fixas
    // (600ms = 6 frames @ 10fps), em vez de recalcular a cada frame — assim o
    // personagem completa a animação de forma limpa mesmo com auto-fire.
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    soundEngine.playBloodBolt();
    return true;
  }

  /**
   * Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero):
   * ataque físico de adaga — sem custo de HP/mana, curto alcance, sem
   * projétil. Não aplica dano diretamente (Player não deve conhecer
   * gore/blood-splatter/dismemberment); só valida elegibilidade, marca o
   * cooldown/animação e deixa o alvo em `pendingMeleeHitTarget` pra
   * GameScene.update() aplicar o dano via CollisionHandlers, no mesmo
   * espírito de como o blood_bolt sinaliza disparo via delta de mana.
   */
  public castDaggerStrike(time: number, target: any): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    if (!target || !target.active) return false;
    // Defesa em profundidade (27/08, fechamento do gap da Frente 3): mesmo
    // se algum caller futuro pular o guard de `updatePlayer()`, o golpe de
    // adaga não deve disparar sem a arma fisicamente equipada.
    if (useGameStore.getState().equipment.weapon === null) return false;

    this.lastMeleeAttackTime = time;
    this.pendingMeleeHitTarget = target;
    this.castAnimTimer = 300; // golpe curto — mais rápido que a pose de conjuração
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    soundEngine.playSwing();
    return true;
  }

  public castNova(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['hellfire_nova'];
    if (this.getCooldownRemaining('hellfire_nova') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    // Fase de merge com origin/main (24/08): outras skills também disparam a
    // pose de conjuração, não só o blood bolt — mesma trava fixa de 600ms.
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['hellfire_nova'] = cd;
    soundEngine.playNova();
    return true;
  }

  public castSyphon(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['syphon_soul'];
    if (this.getCooldownRemaining('syphon_soul') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['syphon_soul'] = cd;
    soundEngine.playSyphonSoul();
    return true;
  }

  public castBoneShield(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['bone_shield'];
    if (this.getCooldownRemaining('bone_shield') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    if (this.stats.mana < cost) return false;

    this.stats.mana -= cost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['bone_shield'] = cd;
    soundEngine.playBoneShield();
    return true;
  }

  public castCrimsonScythe(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['crimson_scythe'];
    if (this.getCooldownRemaining('crimson_scythe') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    const hpCost = Math.max(0, Math.round((spell.hpCost || 0) * (1 - discount)));
    if (this.stats.mana < cost) return false;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['crimson_scythe'] = cd;
    soundEngine.playScytheSlash();
    return true;
  }

  public castRitualCircle(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['blood_ritual_circle'];
    if (this.getCooldownRemaining('blood_ritual_circle') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    const hpCost = Math.max(0, Math.round((spell.hpCost || 0) * (1 - discount)));
    if (this.stats.mana < cost) return false;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['blood_ritual_circle'] = cd;
    soundEngine.playRitualCircle();
    return true;
  }

  public castHemomancyBeam(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['hemomancy_beam'];
    if (this.getCooldownRemaining('hemomancy_beam') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    const hpCost = Math.max(0, Math.round((spell.hpCost || 0) * (1 - discount)));
    if (this.stats.mana < cost) return false;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['hemomancy_beam'] = cd;
    soundEngine.playHemomancyBeam();
    return true;
  }

  public castBloodTendrils(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['blood_tendrils'];
    if (this.getCooldownRemaining('blood_tendrils') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    const hpCost = Math.max(0, Math.round((spell.hpCost || 0) * (1 - discount)));
    if (this.stats.mana < cost) return false;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['blood_tendrils'] = cd;
    soundEngine.playScytheSlash();
    return true;
  }

  public castCorpseBurst(): boolean {
    if (this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;
    const spell = (spellsData as Record<string, SpellConfig>)['corpse_burst'];
    if (this.getCooldownRemaining('corpse_burst') > 0) return false;
    const hasRuneFamine = useGameStore.getState().activeModifiers.includes('rune_famine');
    const relicMods = useGameStore.getState().getRelicModifiers();
    const discount = relicMods.spellCostDiscount || 0;
    const cost = Math.max(0, Math.round((hasRuneFamine ? spell.manaCost * 2 : spell.manaCost) * (1 - discount)));
    const hpCost = Math.max(0, Math.round((spell.hpCost || 0) * (1 - discount)));
    if (this.stats.mana < cost) return false;
    if (this.stats.hp <= hpCost) return false;

    this.stats.mana -= cost;
    this.stats.hp -= hpCost;
    this.castAnimTimer = 600;
    this.castAnimDir = this.get8Direction(this.aimVector.x, this.aimVector.y);
    const cd = spell.cooldownMs * (1 - this.getEffectiveCooldownReduction());
    this.skillCooldowns['corpse_burst'] = cd;
    soundEngine.playNova();
    return true;
  }

  /**
   * Fase 3: Survival Status Conditions (Dead Frontier 2 style).
   * Non-brutal, gradual tension damage. Never triggers invulnerability frames
   * (status DoT should not shield the player from a real enemy hit landing
   * in the same instant), but DOES respect the same knockout/death flow as
   * takeDamage() so it never creates a second, inconsistent death path.
   */
  private updateStatusConditions(delta: number) {
    const sc = this.stats.statusConditions;
    if (!sc.bleeding && !sc.poison && !sc.infection) return;

    // Bleeding: drains HP only while actively moving. Standing still stops it.
    if (sc.bleeding && this.moveVector.length() > 0.05) {
      const bleedDmg = (0.02 * this.stats.maxHp * delta) / 1000; // 2%/s while moving
      this.applyStatusDamage(bleedDmg);
    }

    // Poison: continuous drain regardless of movement.
    if (sc.poison) {
      const poisonDmg = (0.015 * this.stats.maxHp * delta) / 1000; // 1.5%/s always
      this.applyStatusDamage(poisonDmg);
    }

    // Infection: temporarily caps effective Max HP (does not mutate base maxHp,
    // so curing it lets HP recover back up naturally / via potions).
    if (sc.infection) {
      const effectiveCap = this.stats.maxHp * 0.8;
      if (this.stats.hp > effectiveCap) {
        this.stats.hp = effectiveCap;
        useGameStore.getState().setPlayerStats({ ...this.stats });
      }
    }
  }

  private applyStatusDamage(amount: number) {
    if (amount <= 0 || this.stats.isUnconscious || this.stats.isDefinitivelyDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    useGameStore.getState().setPlayerStats({ ...this.stats });

    if (this.stats.hp <= 0) {
      if (this.stats.knockoutCount < 2) {
        this.stats.isUnconscious = true;
        this.stats.knockoutCount += 1;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;

        useGameStore.getState().incrementRunStat('knockouts_total', 1);
        useGameStore.getState().setUnconscious(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
      } else {
        this.stats.isDefinitivelyDead = true;
        useGameStore.getState().incrementRunStat('deaths_total', 1);
        useGameStore.getState().setDefinitivelyDead(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.stats.isUnconscious || this.stats.isDefinitivelyDead) return false;

    // Bone Shield active defense: 30% damage reduction
    if (this.isBoneShieldActive) {
      amount *= 0.7;
    }

    // Infection increases damage taken by 20%
    if (this.stats.statusConditions?.infection) {
      amount *= 1.2;
    }

this.stats.hp = Math.max(0, this.stats.hp - amount);
    // Sync HP immediately to state
    useGameStore.getState().setPlayerStats({ ...this.stats });
    
    // Screenshake and Haptics for taking damage
    // Correção (28/08, achado nesta revisão): `ScreenShake` não expõe um
    // método `trigger(duration, intensity)` — a API real é `shake(profile)`
    // + presets nomeados (`light`/`medium`/`heavy`/`continuous`, ver
    // ScreenShake.ts), os mesmos já usados em CombatEffectsSystem.ts e
    // CollisionHandlers.ts. A chamada original usava `(this.scene as any)`,
    // o que escondeu do typecheck que `.trigger` não existe — em runtime
    // isso lançava `TypeError: screenShake.trigger is not a function` a
    // cada vez que o jogador tomava QUALQUER dano (nenhum teste existente
    // cobre `takeDamage()`, por isso passou despercebido). `medium()` (150ms,
    // intensidade 6) é o preset mais próximo da intenção original ("intense
    // short shake", 150ms/intensidade 4).
    if (this.scene && (this.scene as any).screenShake) {
        (this.scene as any).screenShake.medium();
    }
    import('../systems/CombatFeel').then(m => m.CombatFeel.triggerVibration('damage_taken'));

    if (this.stats.hp <= 0) {
      if (this.stats.knockoutCount < 2) {
        // Enter Unconscious state!
        this.stats.isUnconscious = true;
        this.stats.knockoutCount += 1;
        this.setVelocity(0, 0);
        this.currentVx = 0;
        this.currentVy = 0;

        useGameStore.getState().incrementRunStat('knockouts_total', 1);
        useGameStore.getState().setUnconscious(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });

        soundEngine.playPlayerHurt();
        return false; // Not definitively dead yet
      } else {
        // 3rd knock down -> Definitive Death!
        this.stats.isDefinitivelyDead = true;
        useGameStore.getState().incrementRunStat('deaths_total', 1);
        useGameStore.getState().setDefinitivelyDead(true);
        useGameStore.getState().setPlayerStats({ ...this.stats });
        soundEngine.playPlayerHurt();
        return true; // Definitive Death triggered!
      }
    }

    this.isInvulnerable = true;
    this.invulnerableTimer = 800; // 0.8s invulnerability frame
    soundEngine.playPlayerHurt();

    return false;
  }

  public heal(amount: number) {
    const oldHp = this.stats.hp;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
    const actualHealed = this.stats.hp - oldHp;
    if (actualHealed > 0) {
      useGameStore.getState().incrementRunStat('hp_healed_magic', Math.round(actualHealed));
    }
  }

  public addMana(amount: number) {
    this.stats.mana = Math.min(this.stats.maxMana, this.stats.mana + amount);
  }

  public addXp(amount: number): boolean {
    this.stats.currentXp += amount;
    this.stats.souls += Math.floor(amount / 2);
    if (this.stats.currentXp >= this.stats.nextLevelXp) {
      this.stats.level += 1;
      this.stats.currentXp -= this.stats.nextLevelXp;
      this.stats.nextLevelXp = Math.floor(this.stats.nextLevelXp * 1.4);
      this.stats.pendingStatPoints = (this.stats.pendingStatPoints || 0) + 1;
      soundEngine.playLevelUp();
      return true; // Triggered level up!
    }
    return false;
  }

  /** Move a value toward target by at most maxDelta (for acceleration) */
  private moveToward(current: number, target: number, maxDelta: number): number {
    const diff = target - current;
    if (Math.abs(diff) <= maxDelta) return target;
    return current + Math.sign(diff) * maxDelta;
  }

  public equipLoot(item: LootItem) {
    this.equippedLoot.push(item);

    // Onboarding trigger
    useGameStore.getState().triggerOnboardingEvent('firstEquipDone', 'DICA: Abra seu Inventário (I) para gerenciar e comparar equipamentos!');
    
    if (item.stats.maxHpBonus) {
      this.stats.maxHp += item.stats.maxHpBonus;
      this.stats.hp += item.stats.maxHpBonus; // Heal by bonus amount
    }
    if (item.stats.damageMultiplier) {
      this.stats.damageMultiplier += item.stats.damageMultiplier;
    }
    if (item.stats.lifestealBonus) {
      this.stats.vampirism += item.stats.lifestealBonus;
    }

    soundEngine.playEquipLoot(); // Play sound for loot

    // Notify React UI — comando tipado via store, ver
    // docs/architecture/06_PHASER_REACT_BRIDGE_MIGRATION.md
    useGameStore.getState().notifyLootPickup(item);
  }
}
