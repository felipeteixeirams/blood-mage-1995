# 🤖 Guia de Configuração para Agentes de IA

Este guia orienta agentes de IA (como Google Jules ou Claude) a se ambientarem e executarem tarefas com o máximo de economia de tokens e eficácia.

## 🧭 Diretrizes de Operação
1. **Evite Leitura Excessiva de Arquivos**: Use a documentação estruturada em `docs/README.md` como mapa de referências antes de varrer o código de ponta a ponta.
2. **Execute Validação Local**: Use `pnpm run typecheck` e `pnpm test` com frequência para garantir integridade.
3. **Respeite os Arquivos Críticos**: Sempre leia `docs/CRITICAL/01_CRITICAL_FILES.md` antes de editar o core loop física do Player ou a FSM do Inimigo.
4. **Registros no Logger**: Use o Logger Global (`logger.ts`) em substituição a `console.log` para manter a observabilidade do jogo atualizada.
