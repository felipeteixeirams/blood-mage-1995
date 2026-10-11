# Convenções de Código

**Mestre:** [engineering](README.md)
**Status:** verificado
**Verificado em:** 2026-10-10
**Método:** estático
**Fonte:** `.husky/pre-commit`, `../`, `.husky/`, `src/data/`

Verificado por listagens de diretórios, `grep` e leitura de `.husky/` e `package.json`. Nenhum script foi executado.

## Convenções de código em uso

| Tema | Observado |
|---|---|
| Nomes de arquivo | PascalCase para classes, componentes e modais (`GameScene.ts`, `InventoryModal.tsx`); camelCase para utilitários e hooks (`soundEngine.ts`, `useJoystick.ts`); `components/ui/` é majoritariamente kebab-case (shadcn), com exceções PascalCase (`ModalBase.tsx`, `OfflineStatusBadge.tsx`, `PWAInstallBanner.tsx`) |
| Testes | Ao lado do código, `*.test.ts(x)`, `describe`/`it`; Vitest com mock global de `phaser` (`tests/setup.ts`); suítes podem sobrescrevê-lo com `vi.mock('phaser', ...)` |
| Imports | Caminhos relativos em `game/`, `store/` e na maior parte do restante (96 arquivos usam `../`); o alias `@/` aparece em 54 arquivos, 52 deles em `components/ui/` e nenhum em `game/` ou `store/` |
| UI | React + Tailwind; estado compartilhado com o jogo só pelo Zustand ([../architecture/state-management.md](../architecture/state-management.md)) |
| Sistemas de jogo | Classes em `src/game/systems/` que recebem a cena ([../architecture/phaser-patterns.md](../architecture/phaser-patterns.md)) |
| Comentários e textos | Comentários em português, com trechos em inglês; textos de UI em `i18n/ptBR.ts` e `enUS.ts` |
| Logs | `logger` de `src/utils/logger.ts` |
| Dados de domínio | JSON em `src/data/`, importado direto (`resolveJsonModule`) |
| Persistência | `localStorage` via funções `load*`/`save*` e schemas Zod (`src/utils/localStorage.ts`) |

## Hooks de commit

- `.husky/pre-commit` executa `pnpm run docs:check` e depois `pnpm run verify`.
- O `package.json` tem bloco `lint-staged` (`*.{ts,tsx}`: `vitest related`), mas `.husky/pre-commit` não o invoca.

## Limites da verificação

- Convenções de nomes e imports vêm de listagens de diretórios e de `grep`, não de análise exaustiva.
