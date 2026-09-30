import { vi } from 'vitest';

/**
 * Setup global do Vitest (quick win #1 de `docs/reviews/AUDIT_REPORT_QUALIDADE_CODIGO_2026.md`,
 * seção 6.1 — "Configuração Global de Mock Phaser no Vitest"), registrado
 * via `vitest.config.ts`'s `test.setupFiles`.
 *
 * O que isto resolve: `Phaser` (v4) toca `canvas.getContext('2d')` internamente
 * assim que qualquer submódulo do namespace (`Phaser.Math`, `Phaser.Geom`,
 * `new Phaser.Physics.Arcade.Sprite`, etc.) é acessado em RUNTIME — não só
 * como tipo TypeScript — o que quebra em jsdom sem o pacote opcional
 * `canvas` instalado (achado real, 27/08, rodando `pnpm test` de verdade —
 * ver changelog de `docs/specs/11_VISUAL_POLISH_FRONTS.md`, Frente 1/8, e
 * `docs/specs/13_ARPG_CAMPAIGN_AND_SAFE_HOUSE.md`). Isso força TODO arquivo
 * de teste que importa (direta ou transitivamente) algo que faz `import
 * Phaser from 'phaser'` a mockar o módulo, mesmo quando o teste em si nunca
 * chama nada do Phaser — cada suíte reinventava o mesmo stub mínimo
 * `vi.mock('phaser', () => ({ default: {} }))`.
 *
 * O que este arquivo FAZ: registra esse stub mínimo como o mock PADRÃO de
 * `phaser` pra toda a suíte, uma vez só.
 *
 * O que este arquivo NÃO faz (de propósito): não tenta unificar os mocks de
 * `phaser` mais elaborados que várias suítes já mantêm (`Enemy.test.ts`,
 * `Projectile.test.ts`, `VirtualJoystickSystem.test.ts`,
 * `EnemyTelegraphSystem.test.ts`, `DungeonGenerator.test.ts`,
 * `Player.test.ts`) — cada um mocka uma classe/namespace Phaser diferente,
 * com estado inicial e comportamento específicos do que a classe sob teste
 * precisa (ex.: o `Sprite` fake de `Enemy.test.ts` começa `active = true`, o
 * de `Projectile.test.ts` começa `active = false` — comportamentos
 * incompatíveis entre si; já `Player.test.ts` precisa só de uma classe fake
 * mínima porque `export class Player extends Phaser.Physics.Arcade.Sprite`
 * roda no carregamento do módulo, mesmo sem nenhum teste chamar `new
 * Player(...)` — o stub `{ default: {} }` deste arquivo quebraria esse
 * `extends` com "Class extends value undefined is not a constructor or
 * null"). Um único mock "genérico o bastante pra todo mundo" viraria um
 * monstro difícil de auditar, ou obrigaria testes efetivos a mudar de
 * comportamento pra caber num molde comum. Testes de arquivo que chamam
 * `vi.mock('phaser', outraFactory)` continuam funcionando sem nenhuma
 * mudança: o `vi.mock` local (içado — "hoisted" — pro topo daquele arquivo
 * de teste) roda DEPOIS deste setup global e sobrescreve o registro do mock
 * só para aquele arquivo — é o comportamento documentado do Vitest pra
 * "mock global + override local", não um hack. Nenhum desses 6 arquivos foi
 * tocado nesta leva (além de `Player.test.ts` já ter sido criado, na leva
 * anterior, sem mock de `phaser` — ganhou o override aqui, junto com esta
 * mudança, pra não regredir com o novo default global).
 *
 * Suítes que hoje têm só o stub mínimo (`DismembermentSystem.test.ts`,
 * `ContractSystem.test.ts`) tiveram a linha local removida — cobertas por
 * este default. Qualquer suíte NOVA que só precise "não deixar o import do
 * Phaser quebrar" não precisa mais adicionar `vi.mock('phaser', ...)`
 * nenhum — já herda este default.
 */
vi.mock('phaser', () => ({ default: {} }));
