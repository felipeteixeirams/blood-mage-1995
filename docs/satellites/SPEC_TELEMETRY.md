# 📊 SPEC: Telemetria, Logging Estruturado e Observabilidade (Cliente)

## Objetivo Geral
Prover um sistema robusto de telemetria, logging estruturado com rastreabilidade por sessão, captura automática de erros e um painel visual de observabilidade no cliente para depuração em tempo real e relatórios de bugs.

## Escopo
- **Logger Estruturado Singleton (`Logger`)**: Níveis (`DEBUG`, `INFO`, `WARN`, `ERROR`), namespace estático/dinâmico e saída JSON no console.
- **Buffer Circular na Memória**: Armazenamento dos últimos 200 logs para inspeção visual e exportação em formato `.json`.
- **Rastreabilidade por Sessão**: Geração de `sessionId` único e `traceId` para correlação de eventos (Level Start, Wave, Boss Spawn, Loot Equip, Game Over, Error).
- **Métricas em Tempo Real**: Coleta de FPS, contagem de sprites/física, memória estimada e vozes do áudio sintético.
- **Painel de Observabilidade UI (`ObservabilityModal.tsx`)**: Modal interativo com filtro por namespace e nível de log, estatísticas de telemetria e exportação em 1-clique.
- **Global Error Boundary & Handler**: Captura de exceções não tratadas (`window.onerror` e `unhandledrejection`) vinculadas à sessão.

## Fora do Escopo
- Envio direto para servidor de monitoramento SaaS externo (OpenTelemetry/Datadog) — todo o processamento e retenção ocorrem no cliente em buffer circular.

## Arquitetura
- `src/utils/logger.ts`: Implementação do `Logger` singleton com namespaces, buffer circular e escutadores globais de erro.
- `src/utils/telemetry.ts`: Sistema de métricas de performance (FPS, contagem de entidades) e agregador de eventos de sessão.
- `src/components/ObservabilityModal.tsx`: Modal React com abas "Logs do Sistema" e "Métricas de Performance".
- Integração no `GameScene.ts`, `soundEngine.ts`, `LootSystem.ts` e `App.tsx`.

## Contratos
```typescript
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  sessionId: string;
}

export interface TelemetryMetrics {
  fps: number;
  frameTimeMs: number;
  entityCount: number;
  activeVoices: number;
  totalLogs: number;
  errorCount: number;
  sessionDurationSec: number;
}
```

## Critérios de Aceite
1. Logs emitidos em qualquer subsistema aparecem formatados no console e no buffer visual.
2. Botão/Atalho (Tecla [O] ou através das Configurações) abre o Painel de Observabilidade.
3. Exceções JavaScript não tratadas capturam o stack trace no buffer de logs com nível `ERROR`.
4. Exportação do diagnóstico gera download de arquivo JSON com contexto completo da sessão.
