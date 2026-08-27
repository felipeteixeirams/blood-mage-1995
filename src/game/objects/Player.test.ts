import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from './Player';
import { useGameStore } from '../../store/gameStore';

/**
 * Frente 3 de docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md (Zero-to-Hero) —
 * fechamento do gap descrito na "Observação de escopo" (27/08): antes desta
 * correção, `castDaggerStrike` disparava sempre que `blood_bolt` estivesse
 * trancado em modo Campanha, mesmo que o jogador nunca tivesse aberto o baú
 * de suprimentos e portanto nunca tivesse a Adaga de Aço equipada
 * (`equipment.weapon`). Este arquivo não instancia `Player` via `new`
 * (construtor real exige `Phaser.Physics.Arcade.Sprite`/cena de verdade,
 * que o resto da suíte evita mockar) — em vez disso, testa `castDaggerStrike`
 * isoladamente via `Object.create(Player.prototype)`, preenchendo só os
 * campos que o método de fato lê.
 *
 * Mesmo sem chamar `new Player(...)`, a própria DECLARAÇÃO da classe
 * (`export class Player extends Phaser.Physics.Arcade.Sprite`) roda no
 * carregamento do módulo e precisa que `Phaser.Physics.Arcade.Sprite`
 * resolva pra um construtor válido — o default global de `tests/setup.ts`
 * (quick win #1 de docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md,
 * 27/08) é só `{ default: {} }`, que quebraria esse `extends` com "Class
 * extends value undefined is not a constructor or null". Por isso este
 * arquivo precisa do próprio override local (documentado em
 * tests/setup.ts como um dos 5 casos que continuam com mock próprio de
 * propósito) — uma classe fake mínima só pra satisfazer o `extends`,
 * nunca de fato instanciada por nenhum teste aqui.
 */

vi.mock('phaser', () => ({
  default: {
    Physics: {
      Arcade: {
        Sprite: class {},
      },
    },
  },
}));

vi.mock('../../utils/soundEngine', () => ({
  soundEngine: {
    playSwing: vi.fn(),
    playBloodBolt: vi.fn(),
  },
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(),
  },
}));

function makeBareDagger(target: any) {
  const p: any = Object.create(Player.prototype);
  p.stats = { isUnconscious: false, isDefinitivelyDead: false };
  p.aimVector = { x: 1, y: 0 };
  p.lastMeleeAttackTime = 0;
  p.pendingMeleeHitTarget = null;
  p.castAnimTimer = 0;
  p.castAnimDir = 'south';
  return p as Player;
}

describe('Player.castDaggerStrike — Frente 3 (spec 13): adaga fisicamente equipada como pré-requisito', () => {
  const target = { active: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não dispara o golpe se equipment.weapon estiver null (adaga nunca pega no baú)', () => {
    (useGameStore.getState as any).mockReturnValue({ equipment: { weapon: null, armor: null, relics: [] } });
    const player = makeBareDagger(target);

    const result = player.castDaggerStrike(1000, target);

    expect(result).toBe(false);
    expect((player as any).pendingMeleeHitTarget).toBeNull();
    expect((player as any).lastMeleeAttackTime).toBe(0);
  });

  it('dispara normalmente com a Adaga de Aço equipada', () => {
    (useGameStore.getState as any).mockReturnValue({
      equipment: { weapon: { id: 'starter_dagger', type: 'weapon' }, armor: null, relics: [] },
    });
    const player = makeBareDagger(target);

    const result = player.castDaggerStrike(1000, target);

    expect(result).toBe(true);
    expect((player as any).pendingMeleeHitTarget).toBe(target);
    expect((player as any).lastMeleeAttackTime).toBe(1000);
  });

  it('continua recusando o golpe se o jogador estiver inconsciente/morto, mesmo com a adaga equipada', () => {
    (useGameStore.getState as any).mockReturnValue({
      equipment: { weapon: { id: 'starter_dagger', type: 'weapon' }, armor: null, relics: [] },
    });
    const player = makeBareDagger(target);
    (player as any).stats.isUnconscious = true;

    expect(player.castDaggerStrike(1000, target)).toBe(false);
  });

  it('continua recusando o golpe sem alvo ativo, mesmo com a adaga equipada', () => {
    (useGameStore.getState as any).mockReturnValue({
      equipment: { weapon: { id: 'starter_dagger', type: 'weapon' }, armor: null, relics: [] },
    });
    const player = makeBareDagger(target);

    expect(player.castDaggerStrike(1000, { active: false })).toBe(false);
    expect(player.castDaggerStrike(1000, null)).toBe(false);
  });
});
