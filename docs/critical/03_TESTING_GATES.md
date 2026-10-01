---
agent_context: all devs
target_module: root
priority: high
status: active
last_updated: 2026-08-09
tags: [critical, testing, quality-gate]
---
# 🧪 Portões de Teste e Validação (Testing Gates)

Este documento define os portões e critérios que um commit de código deve satisfazer antes de ser promovido para produção ou integrado na branch principal.

## 🏁 Critérios de Aceitação
1. **Compilação Segura (Typecheck)**:
   - Executar `pnpm run typecheck` deve retornar zero erros ou alertas de tipagem TypeScript no compilador.
2. **Suíte de Testes Unitários (Vitest)**:
   - Executar `pnpm test` deve executar e passar em todos os testes unitários da suíte (100% de sucesso).
3. **Validação e Integridade de Assets**:
   - Executar `pnpm run verify` para assegurar que a integridade dos assets binários, compilação do TypeScript e build via Vite estejam funcionais.
4. **Sem Chunks Grandes**:
   - O bundler Vite não deve reclamar de chunks ultrapassando limites máximos de 500kB sem divisão explícita.
