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
    playPlayerHurt: vi.fn(),
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

/**
 * Revisão de 28/08 (regressão introduzida por trabalho externo — Google AI
 * Studio): `takeDamage()` ganhou uma chamada `(this.scene as
 * any).screenShake.trigger(150, 4)` pro feedback de screen shake da Spec 14.
 * `ScreenShake` (src/game/systems/ScreenShake.ts) nunca teve um método
 * `trigger(duration, intensity)` — a API real é `shake(profile)` + presets
 * nomeados (`light`/`medium`/`heavy`/`continuous`), os mesmos já usados em
 * `CombatEffectsSystem.ts`/`CollisionHandlers.ts`. O cast `as any` escondeu
 * isso do typecheck; em runtime, `.trigger` é `undefined` e a chamada
 * lançava `TypeError: screenShake.trigger is not a function` a cada dano
 * recebido — e nenhum teste existente cobria `takeDamage()`, por isso nunca
 * foi pego. Corrigido pra usar `.medium()` (mesmo padrão do resto do
 * código); estes testes travam a API certa.
 */
function makeBareDamagePlayer() {
  const p: any = Object.create(Player.prototype);
  p.stats = {
    isUnconscious: false,
    isDefinitivelyDead: false,
    hp: 100,
    maxHp: 100,
    knockoutCount: 0,
    statusConditions: {},
  };
  p.isInvulnerable = false;
  p.isBoneShieldActive = false;
  p.invulnerableTimer = 0;
  return p as Player;
}

describe('Player.takeDamage — feedback de screen shake (regressão de 28/08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore.getState as any).mockReturnValue({
      setPlayerStats: vi.fn(),
      incrementRunStat: vi.fn(),
      setUnconscious: vi.fn(),
      setDefinitivelyDead: vi.fn(),
    });
  });

  it('chama screenShake.medium() em dano não-letal — NÃO screenShake.trigger (método que não existe)', () => {
    const shake = { medium: vi.fn(), light: vi.fn(), heavy: vi.fn() };
    const player = makeBareDamagePlayer();
    (player as any).scene = { screenShake: shake };

    const result = player.takeDamage(10);

    expect(result).toBe(false);
    expect(shake.medium).toHaveBeenCalledTimes(1);
    expect((shake as any).trigger).toBeUndefined();
    expect((player as any).stats.hp).toBe(90);
  });

  it('não quebra se scene.screenShake não existir (guard já previa isso)', () => {
    const player = makeBareDamagePlayer();
    (player as any).scene = {};

    expect(() => player.takeDamage(10)).not.toThrow();
  });
});
