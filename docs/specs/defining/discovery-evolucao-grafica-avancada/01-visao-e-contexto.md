# Avaliação arquitetural: Phaser 4.2.1 e renderização procedural avançada (parte 1: Visão, decisões e contexto)

**Mestre:** [discovery-evolucao-grafica-avancada](README.md)
**Estágio:** defining
**Aprovação do responsável:** pendente

**Estado vs código:** não verificado

## Decisões a confirmar

Comportamento e escopo abaixo são propostas sem aprovação registrada; nada aqui está decidido.

1. Priorização dos eixos A, B e C e a matriz de esforço/risco.
2. Uso de filtros postFX e Light2D com normal maps procedurais.
3. Gatilhos de ativação dos eixos B e C (arte e áudio externos).

---

> 💡 **TIPO: DISCOVERY & AVALIAÇÃO ARQUITETURAL (Backlog)**
>
> **Premissa & Hipótese de Avaliação:**
> Avaliar se a stack atual **Phaser 4.2.1 + WebGL** nos permite implementar shaders de pós-processamento (PostFX GPU), iluminação dinâmica 2D nativa (`Light2D`) e modelos procedurais com fidelidade visual tão elevada que possam rivalizar ou superar a qualidade de sprites externos, eliminando a dependência externa de assets e acelerando o ciclo de desenvolvimento do jogo sem onerar a performance mobile.

---

## 1. Contexto & Estado Atual

O jogo possui uma stack moderna com **Phaser 4.2.1 + Vite 7 + WebGL** (`Phaser.AUTO`, `pixelArt: true`). Atualmente, os efeitos de atmosfera e iluminação operam via overlays 2D/Canvas (`ScreenEffects.ts` e `WorldManager.ts`).

Com o suporte nativo do Phaser 4.2.1 para pipelines de filtros pós-processamento via GPU e iluminação dinâmica 2D, surge uma oportunidade arquitetural estratégica: **elevar o padrão gráfico para o nível de jogos comerciais góticos (Diablo / Dungeon Siege) usando o poder de processamento da GPU**, avaliando se a renderização procedural pode substituir a necessidade de criação e manutenção de centenas de arquivos de sprites externos.

---
