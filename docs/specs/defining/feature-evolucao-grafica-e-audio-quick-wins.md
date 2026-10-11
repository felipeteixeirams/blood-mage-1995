# Spec — Evolução Gráfica & Auditiva (Quick Wins & Roadmap)

**Mestre:** [defining](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** parcial (verificado em 2026-10-10, leitura estática). Existem: distorção de medo (`PostFXSystem.triggerFearDistortion`, `ScreenEffects.triggerFearDistortion`, ponte `window.__triggerFearDistortion` em `GameScene.ts`, toggle `fearDistortionEnabled`), tinnitus de ameaça (`soundEngine.ts`, toggle `tinnitusEnabled`), cascata de luz por `floorDepth` (`LightingSystem.enable`, `PostFXSystem.applyBiomeMatrix`), efeitos de dano e variantes de inimigo (`Enemy.ts`), gibs (`DismembermentSystem.ts`), `StatusEffectSystem.ts`, `ShadowSystem.ts` e `ReflectionSystem.ts` instanciados em `GameScene.ts`. Falta: a aura de inimigo (A.2); `grep -n "aura" src/game/objects/Enemy.ts` não acha aura colorida por tipo de inimigo (só o halo de elite com cor por afixo).

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Implementar a aura de inimigo (A.2) e quando (proposta: junto da integração de sprites/atlas com normais, Eixo B).
2. Cores da aura por tipo (proposta: violeta para mágicos, vermelho para sangue, laranja para infernais).

---

## Pendente — A.2 Aura de Inimigo

- **Problema:** aura colorida direta sobre sprites planares procedurais, sem normal maps pré-assados, tende a gerar sobreposição e poluição visual.
- **Proposta:** halos aditivos (`Light2D`) por tipo de inimigo, depois que houver atlas com normais.
- **Critérios de aceite:** a definir (spec ainda sem EARS).
