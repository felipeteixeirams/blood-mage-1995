---
status: CONCLUIDO
phase: 2/4
priority: P1
start_date: 2026-08-10
completion_date: 2026-08-10
responsible: Jules (Google AI)
progress: 100% (Implementado e Validado)
agent_context: backend, frontend, game designer
target_module: artifacts/bloodmage/src/game
last_updated: 2026-08-10
tags: [specs, phase-2, death-screen, corpse-retrieval, gore]
---

# 🔴 Fase 2: Tela de Morte, Resgate de Cadáver (Corpse Retrieval) e Gore

> **Status:** Concluído | **Prioridade:** P1 (Alta)

---

## 📋 Visão Geral

**Objetivo:** Implementar a mecânica de morte definitiva após esgotar as tentativas de inconsciência, a criação do cadáver interativo (`Corpse`) com resgate de inventário, a nova tela de morte/game over, e o sistema de execuções com gore/desmembramento procedural.

**Impacto:** Adiciona peso e consequência tática às mortes do jogador, permitindo recuperar itens na próxima run enquanto aumenta a visceralidade do combate.

---

## 📝 Requisitos Funcionais

### Must Have (MVP)

- [x] **Morte Definitiva**: Após o 3º desmaio (da Fase 1), o jogador sofre morte definitiva.
- [x] **Instanciação de Cadáver (`Corpse`)**: Instanciar um objeto interativo no local exato da morte guardando o inventário/loot perdido.
- [x] **Marcação no Mapa**: Exibir ícone de lápide no minimapa e bússola indicando a localização do cadáver.
- [x] **Mecânica de Resgate**: Interagir com o cadáver na run seguinte recupera 100% do inventário perdido.
- [x] **Perda Permanente**: Se o jogador morrer novamente antes de resgatar o cadáver antigo, o cadáver é destruído permanentemente.
- [x] **Tela de Morte (Death Screen)**: Menu de Game Over estilizado com resumo da run, estats, e botão de tentar novamente / retornar ao menu.
- [x] **Hit-Stop & Screen Shake**: Pausa de 40–80ms em golpes fortes/críticos e tremor de câmera escalável.
- [x] **Sistema de Execução & Gore Procedural**: Desmembramento de monstros em fragmentos ao serem finalizados com HP ≤ 15% por habilidades sacrificiais.

### Nice to Have

- [ ] Animação de decomposição/partículas de névoa ao redor do cadáver.
- [ ] Trilha de lamento suave ao se aproximar do túmulo.
- [ ] Histórico de cadáveres no menu de recordes.

---

## 🏗️ Arquitetura e Estrutura Técnica

### Arquivos Envolvidos
- `src/game/entities/Corpse.ts`: Entidade física interativa do cadáver.
- `src/game/scenes/GameOverScene.ts` / `GameOverModal.tsx`: Interface de morte e resumo da run.
- `src/game/systems/CombatFeel.ts`: Centralização de hit-stop, screen shake, e haptics.
- `src/game/systems/GoreSystem.ts`: Divisão procedural de sprites e partículas de sangue.

---

## ✅ Critérios de Aceite

1. O cadáver é gerado no ponto exato da morte definitiva e guarda o inventário.
2. O minimapa mostra o ícone do cadáver na run subsequente.
3. Interagir com o cadáver restaura os itens; morrer antes de resgatar deleta o cadáver anterior.
4. Tela de Game Over exibe estatísticas precisas da run (tempo, kills, dano).
5. Execuções geram fragmentos de sprite procedural e splash de sangue 3× sem erros de performance.
