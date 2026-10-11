# Engenharia — Documento Mestre

**Contexto:** ferramentas e convenções do repositório como estão hoje: stack com versões reais, estrutura de diretórios, configurações, scripts e convenções de código em uso.
**Leia quando:** for configurar o ambiente, rodar ou alterar scripts/build/testes, saber onde um tipo de arquivo mora e como o código é escrito, ou mexer em arquivo de risco (`Player.ts`, `Enemy.ts`, `GameScene.ts`, `DungeonGenerator.ts`, `gameStore.ts`, `localStorage.ts`, `PhaserGame.tsx`), performance, CSP, logs e persistência.

| Satélite | Conteúdo | Status |
|---|---|---|
| [stack.md](stack.md) | Stack e versões (`package.json` e lock), dependências sem uso, configs de build/lint/test e scripts (nenhum executado) | verificado (scripts não executados) |
| [repository-structure.md](repository-structure.md) | Estrutura de diretórios, onde cada tipo de arquivo mora e papel de `artifacts/`, `lib/` e workspaces | verificado |
| [conventions.md](conventions.md) | Convenções de código em uso (nomes, testes, imports, idioma, logs, dados), hook de pre-commit e `lint-staged` | verificado |
| [risky-files.md](risky-files.md) | Arquivos sensíveis por nível de risco (`Player.ts`, `Enemy.ts`, `GameScene.ts`…), com o contrato atual de cada um | verificado |
| [performance.md](performance.md) | Técnicas de performance presentes no código e suas exceções | verificado |
| [performance-metrics.md](performance-metrics.md) | O que o código mede (sem metas numéricas medidas) | verificado |
| [security.md](security.md) | Cabeçalhos/CSP do `vercel.json`, telemetria, persistência e segredos | verificado |

Arquitetura do jogo: [../architecture/README.md](../architecture/README.md).
