---
agent_context: all devs
target_module: root
priority: medium
status: active
last_updated: 2026-08-09
tags: [reference, tasks]
---
# 🛠️ Tarefas Comuns de Desenvolvimento

Guia passo a passo para estender recursos em Bloodmage 1995.

## ➕ Como Adicionar uma Nova Magia (Spell)
1. **Definição de Dados**: Registre as propriedades da nova magia (nome, custo de mana, dano base, tempo de recarga) sob o arquivo JSON `src/data/spells.json`.
2. **Implementação de Casting**: Adicione o método correspondente na classe `Player.ts` (ex: `castMySpell()`).
3. **Padrão Strategy**: Garanta que o método valide o custo de mana e aplique os efeitos físicos de projétil ou impacto na GameScene.
4. **VFX & SFX**: Adicione o feedback visual na cena e registre a reprodução da síntese de áudio correspondente no `soundEngine.ts`.
