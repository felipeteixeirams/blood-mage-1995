---
node_type: Satellite
parent_node: /docs/AGENTS.md
domain: Operations & External Agent Integration
token_weight: Medium (~600 tokens)
---

# 📜 Satellite: Handover & Diretrizes de Integração (Jules + Stitch)

## 🏗️ Estado Atual do Projeto
- **Engine**: Phaser 3 (Canvas/Física/Loop a 60 FPS) + React 18 (HUD, Modais e UI).
- **Estética & Tom**: **Gothic & Dark Horror Clássico** (*Blood 1997, Doom, Quake, Diablo 1, Evil Dead, Dead Frontier 2*).
- **Mecânica de Combate**: Ataques corporais telegrafados (Windup -> Lunge Strike -> Recovery) com sistema de esquiva (**MISS!**), acertos críticos (**CRIT!**) e dano flutuante numérico.
- **Arquitetura Documental**: Estruturada no padrão `Graph Documental` (`Root -> Master -> Satélites`).

---

## 🛑 REGRAS DE INVARIÂNCIA & GUARDARAIS PARA O JULES (NÃO VIOLAR)

1. **PROIBIDO Estética Roguelike Casual/Infantil**: Não adicione cores pastel, ícones fofos, curvas excessivamente arredondadas ou artes no estilo "jogo simples de navegador". O jogo deve manter visual sombrio, pixel art rústica, sangue carmesim e atmosfera de terror dos anos 90.
2. **PROIBIDO Dano por Contato Passivo ("Touch Damage")**: Nenhum inimigo corporal deve causar dano apenas por encostar no jogador. Todo ataque físico deve passar pela FSM de telegrafia telegrafada definida em `/docs/satellites/SPEC_COMBAT_REALISM.md`.
3. **Preservar Arquitetura Híbrida**: O Phaser 3 gerencia física e renderização a 60 FPS. O React gerencia o HUD e modais através do store Zustand (`src/store/gameStore.ts`).
4. **Desempenho & Stack**: Respeitar o limite de execução em ambiente Cloud Run. Usar síntese de áudio Web Audio API (`soundEngine.ts`) e geração procedural no Phaser sem sobrecarregar a memória.

---

## 🤖 Prompt Recomendado para Iniciar Tarefas no Jules

> "Olá Jules! Você está trabalhando no projeto **Bloodmage 1995**. Antes de escrever qualquer código, leia o Nó Mestre `/docs/AGENTS.md` e o manual de estética `/docs/satellites/LORE_BLOODMAGE.md`. Respeite a estética de terror clássico dos anos 90 (Blood, Diablo, Doom, Evil Dead) e garanta que todas as mecânicas de combate sigam o padrão de ataques telegrafados em `/docs/satellites/SPEC_COMBAT_REALISM.md`."

---

## 📋 Próximas Tarefas Elegíveis para Delegar ao Jules

1. **Boss Encounters & Bullet Hell**: Implementação da especificação registrada em `/docs/satellites/SPEC_BOSS_FIGHTS.md`.
2. **Expansão do Bestiário de Horror**: Implementação dos novos tipos de monstros (Zumbis Shamblers, Vampiros Stalkers, Lobisomens Feral e Enxames de Morcegos) conforme `/docs/satellites/LORE_BLOODMAGE.md`.
3. **Efeitos Ambientais**: Névoa tóxica e armadilhas de chão telegrafadas no Phaser 3.

