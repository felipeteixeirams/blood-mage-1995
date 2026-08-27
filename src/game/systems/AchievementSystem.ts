/**
 * Achievement System (Fase 5)
 * Sistema de conquistas, badges e desafios
 * Persiste em localStorage e exibe notificações
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji ou nome de sprite
  hidden: boolean; // se true, só mostra quando desbloqueada
  reward: {
    bloodCrystals: number;
    talentPoints: number;
  };
}

export interface AchievementProgress {
  id: string;
  unlockedAt: number | null; // timestamp ou null
  progress: number; // 0-100 para achievements com progresso
  complete: boolean;
}

import { logger } from '../../utils/logger';
import { loadAchievementProgress, saveAchievementProgress, AchievementProgressRecord } from '../../utils/localStorage';

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private unlockedCallbacks: Set<(ach: Achievement) => void> = new Set();

  constructor() {
    this.initDefaultAchievements();
    this.loadProgress();
  }

  /**
   * Definir achievements padrão
   */
  private initDefaultAchievements(): void {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_blood',
        name: 'Primeiro Sangue',
        description: 'Mate seu primeiro inimigo',
        icon: '⚔️',
        hidden: false,
        reward: { bloodCrystals: 50, talentPoints: 1 },
      },
      {
        id: 'slayer_10',
        name: 'Matador de 10',
        description: 'Mate 10 inimigos em uma única sessão',
        icon: '💀',
        hidden: false,
        reward: { bloodCrystals: 100, talentPoints: 2 },
      },
      {
        id: 'slayer_50',
        name: 'Matador de 50',
        description: 'Mate 50 inimigos em uma única sessão',
        icon: '💀💀',
        hidden: false,
        reward: { bloodCrystals: 250, talentPoints: 5 },
      },
      {
        id: 'wealth_1000',
        name: 'Alquimista Rico',
        description: 'Acumule 1000 Cristais de Sangue',
        icon: '💎',
        hidden: false,
        reward: { bloodCrystals: 200, talentPoints: 3 },
      },
      {
        id: 'no_damage',
        name: 'Intocável',
        description: 'Complete um andar sem receber dano',
        icon: '🛡️',
        hidden: false,
        reward: { bloodCrystals: 150, talentPoints: 2 },
      },
      {
        id: 'five_knockouts',
        name: 'Ressurreição',
        description: 'Desmaia e acorda 5 vezes em uma sessão',
        icon: '👻',
        hidden: true,
        reward: { bloodCrystals: 300, talentPoints: 5 },
      },
      {
        id: 'depth_10',
        name: 'Descida Profunda',
        description: 'Alcance o andar 10',
        icon: '🕳️',
        hidden: false,
        reward: { bloodCrystals: 500, talentPoints: 10 },
      },
      {
        id: 'depth_25',
        name: 'Abismo Eterno',
        description: 'Alcance o andar 25',
        icon: '🌑',
        hidden: true,
        reward: { bloodCrystals: 1000, talentPoints: 25 },
      },
      {
        id: 'all_spells',
        name: 'Mago Completo',
        description: 'Desbloqueie todos os 5 spells',
        icon: '🔮',
        hidden: false,
        reward: { bloodCrystals: 400, talentPoints: 8 },
      },
      {
        id: 'speedrun',
        name: 'Velocidade Sombria',
        description: 'Alcance o andar 5 em menos de 5 minutos',
        icon: '⚡',
        hidden: true,
        reward: { bloodCrystals: 350, talentPoints: 7 },
      },
    ];

    defaultAchievements.forEach((ach) => {
      this.achievements.set(ach.id, ach);
      if (!this.progress.has(ach.id)) {
        this.progress.set(ach.id, {
          id: ach.id,
          unlockedAt: null,
          progress: 0,
          complete: false,
        });
      }
    });
  }

  /**
   * Carregar progresso de achievements do localStorage (via utils/localStorage.ts,
   * validado com Zod e namespaceado — docs/product/ROADMAP.md, Fase 0, auditoria 27/08).
   */
  private loadProgress(): void {
    try {
      const data = loadAchievementProgress();
      Object.entries(data).forEach(([id, prog]) => {
        this.progress.set(id, prog);
      });
    } catch (e) {
      logger.error('ACHIEVEMENT', 'Erro ao carregar achievements', { error: e });
    }
  }

  /**
   * Salvar progresso no localStorage (via utils/localStorage.ts, validado com Zod).
   */
  private saveProgress(): void {
    try {
      const data: Record<string, AchievementProgressRecord> = {};
      this.progress.forEach((prog, id) => {
        data[id] = prog;
      });
      saveAchievementProgress(data);
    } catch (e) {
      logger.error('ACHIEVEMENT', 'Erro ao salvar achievements', { error: e });
    }
  }

  /**
   * Desbloquear achievement
   */
  public unlock(achievementId: string): Achievement | null {
    const ach = this.achievements.get(achievementId);
    const prog = this.progress.get(achievementId);

    if (!ach || !prog) return null;
    if (prog.complete) return null; // Já desbloqueada

    prog.complete = true;
    prog.unlockedAt = Date.now();
    this.saveProgress();

    // Disparar callbacks
    this.unlockedCallbacks.forEach((cb) => cb(ach));

    return ach;
  }

  /**
   * Atualizar progresso de achievement (ex: kill counter)
   */
  public updateProgress(achievementId: string, progress: number): void {
    const prog = this.progress.get(achievementId);
    if (!prog) return;

    prog.progress = Math.min(progress, 100);

    // Auto-unlock se atingiu 100%
    if (prog.progress >= 100 && !prog.complete) {
      this.unlock(achievementId);
    }

    this.saveProgress();
  }

  /**
   * Incrementar progresso
   */
  public incrementProgress(achievementId: string, amount: number = 1): void {
    const prog = this.progress.get(achievementId);
    if (!prog) return;
    this.updateProgress(achievementId, prog.progress + amount);
  }

  /**
   * Obter achievement por ID
   */
  public getAchievement(id: string): Achievement | null {
    return this.achievements.get(id) || null;
  }

  /**
   * Obter progresso de achievement
   */
  public getProgress(id: string): AchievementProgress | null {
    return this.progress.get(id) || null;
  }

  /**
   * Listar todos os achievements
   */
  public getAll(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Listar achievements desbloqueados
   */
  public getUnlocked(): Achievement[] {
    return Array.from(this.achievements.values()).filter(
      (ach) => this.progress.get(ach.id)?.complete
    );
  }

  /**
   * Contar achievements desbloqueados
   */
  public getUnlockedCount(): number {
    return this.getUnlocked().length;
  }

  /**
   * Obter total de achievements
   */
  public getTotalCount(): number {
    return this.achievements.size;
  }

  /**
   * Registrar callback ao desbloquear
   */
  public onUnlock(callback: (ach: Achievement) => void): void {
    this.unlockedCallbacks.add(callback);
  }

  /**
   * Resetar todos os achievements (dev/testing)
   */
  public resetAll(): void {
    this.progress.forEach((prog) => {
      prog.complete = false;
      prog.unlockedAt = null;
      prog.progress = 0;
    });
    this.saveProgress();
  }
}

export default AchievementSystem;
