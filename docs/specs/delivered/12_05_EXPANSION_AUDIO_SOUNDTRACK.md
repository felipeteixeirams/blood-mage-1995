---
agent_context: audio-engineer, sound-designer
target_module: docs/specs/delivered
priority: medium
status: completed
last_updated: 2026-08-27
tags: [specs, delivered, audio, fm-synth, web-audio, bgm, procedural]
---

# 🎵 Spec 12.05: Trilha Sonora Procedural 16-Bit (Web Audio FM Engine)

## Objetivo
Implementar um motor de trilha sonora procedural 16-bit utilizando exclusivamente a Web Audio API (FM Synthesizer), sem dependência de arquivos de áudio externos pesados, reduzindo o consumo de VRAM e garantindo atmosfera gótica dinâmica.

---

## Status
🟢 **COMPLETO**

---

## O que foi Entregue
- **Sintetizador FM Procedural Puro:**
  - Motor de sintetizador de frequências em código com relógio de lookahead (janela de `0.12s`) para sequenciamento em tempo real com zero drift e zero consumo de VRAM.
- **3 Temas Dinâmicos por Bioma:**
  - *Catacumbas dos Mártires (Floor 1-2):* Cravo gótico, baixo FM em escala menor harmônica de Lá (A minor), tambor de masmorra e sino de catedral.
  - *Santuário de Sangue (Floor 3-4):* Drone de ritual misterioso, corais harmônicos e sinos rituais.
  - *Fúria do Chefe / Plutonia 1995 (Boss Room):* Riff acelerado estilo Sound Blaster FM / DOOM Plutonia a 130 BPM, caixa de ruído industrial e bumbo duplo.
- **Reatividade Dinâmica e Muffle Filter:**
  - *Filtro de Abafamento Suave (Lowpass Muffle Filter):* Transição suave para 700Hz ao abrir qualquer modal (Inventário, Talentos, Bestiário, Configurações) e restauração para 20.000Hz ao fechar.
  - *Modo Pânico / HP Crítico (<25% HP):* Aceleração de BPM (+12%) e pulso de batimento cardíaco em tempo real.

---

## Referência no Código
- `src/utils/bgmSynthesizer.ts` — Motor principal do sintetizador FM Web Audio.
- `src/utils/soundEngine.ts` — Ponte de integração de efeitos sonoros e controle de volume BGM.
- `src/game/scenes/GameScene.ts` — Triggers de alternância de faixas por ambiente e detecção de HP crítico.
- `src/App.tsx` — Gatilhos de abafamento suave (lowpass filter) baseados no estado de abertura dos modais.

---

## Validação
- Testes dedicados em `src/utils/bgmSynthesizer.test.ts` (8 testes unitários passando).
- Validação de zero erros de compilação no TypeScript (`pnpm run typecheck`).
- Funcionamento verificado em navegadores desktop e dispositivos móveis sem latência audível.

---

## Notas
- O sintetizador respeita as preferências globais de volume e mudo configuradas no menu de opções (`localStorage.ts`).
