---
agent_context: game-designer, frontend, game-engine
target_module: docs/specs/propostas
priority: medium
status: draft
last_updated: 2026-08-11
tags: [specs, proposta, skinning, visual, layers, texture-generator]
---

# 🎭 GDD & Especificação: Sistema de Skinning e Composição Dinâmica de Camadas

> Especificação técnica e conceitual para o desenvolvimento de um sistema de Skinning e customização visual em tempo real no Bloodmage 1995. Em vez de depender de arquivos estáticos gigantescos, propomos uma arquitetura baseada em um Compositor de Camadas Dinâmico operando diretamente no gerador procedural de texturas da engine HTML5 Canvas.

---

## 1. Contexto & Objetivos

Atualmente, o *Bloodmage 1995* possui uma base de customização cosmética sutil: o jogador pode adquirir paletas de cores alternativas (Sangue Carmesim, Sangue Corrupto, Sangue Dourado, Sangue Negro) utilizando Cristais de Sangue no menu de configurações. No entanto, essas paletas aplicam um filtro global (`setTint`) sobre a sprite estática do personagem principal.

Para entregar uma experiência visual satisfatória com o peso físico de *Dungeon Siege* e *Diablo*, os equipamentos que o jogador veste (armas rústicas e armaduras pesadas) e as Skins exclusivas devem se **refletir diretamente na aparência do personagem em tempo real** enquanto ele se move, ataca e conjura feitiços na tela.

### Objetivos do Sistema:
1.  **Reflexo Visual de Itens Equipados:** Permitir que a arma e a armadura equipadas no modal de Inventário alterem o sprite renderizado do jogador na cena física Phaser.
2.  **Sistema de Skins:** Implementar uma galeria de skins estéticas completas que modificam o modelo do corpo base do mago (ex: Mago Esquelético, Necromante de Armadura de Ossos, Ceifador Sombrio).
3.  **Manutenção da Filosofia Zero Assets:** Desenhar essas alterações visuais de forma procedural utilizando o gerador de texturas em tempo real (`textureGenerator.ts`), evitando carregar novos arquivos grandes de imagem e mantendo o PWA extremamente leve.

---

## 2. Arquitetura Técnica: Compositor Dinâmico de Camadas (Canvas-to-Texture)

Como o jogo renderiza os sprites do jogador em tempo real a partir de canvas gerados em runtime, a solução perfeita é criar um **Compositor Dinâmico de Camadas** no próprio `textureGenerator.ts`.

Em vez de gerar uma única textura unificada e imutável para a chave `'spr_bloodmage'`, o gerador gerará e sobreporá sequencialmente múltiplas subcamadas em um canvas virtual temporário antes de registrá-lo na Scene do Phaser.

```
       [ CANVAS PROCEDURAL TEMPORÁRIO ]
                      ▲
                      │ (Sobreposição Sequencial)
 ┌────────────────────┴────────────────────┐
 │ Camada 4: Efeitos de Luz (Glow / Aura)  │
 ├─────────────────────────────────────────┤
 │ Camada 3: Visual de Armas (Weapon Layer)│
 ├─────────────────────────────────────────┤
 │ Camada 2: Visual de Armaduras (Armor)   │
 ├─────────────────────────────────────────┤
 │ Camada 1: Corpo da Skin Selecionada     │
 └─────────────────────────────────────────┘
```

### Detalhes das Camadas da Composição:

1.  **Camada 1: Corpo da Skin Selecionada (Body Skin):** O contorno e formato anatômico básico do personagem (ex: corpo padrão de tecido, corpo de esqueleto com osso exposto, ou corpo envolto em mantos sombrios).
2.  **Camada 2: Visual de Armaduras (Armor Layer):** Caso haja uma armadura equipada (ex: Peitoral de Couro, Cota de Malha, Armadura de Ossos), o gerador desenha as linhas da armadura por cima do corpo, respeitando as cores e sombreamento pixelados góticos.
3.  **Camada 3: Visual de Armas (Weapon Layer):** Caso haja uma arma equipada, ela é desenhada nas mãos do personagem com o ângulo correto de rotação em relação ao vetor de mira do jogador (`aimVector`).
    *   *Tipos de Armas:* Foices, Cajados de Osso, Adagas Sacrificiais, Lâminas de Ferro.
4.  **Camada 4: Efeito de Brilho de Encantamento (VFX Glow Layer):** Uma camada translúcida com blend-mode aditivo que adiciona partículas leves ou a paleta de sangue ativa selecionada (ex: um glow roxo se a paleta ativa for a Corrompida).

---

## 3. Fluxo de Atualização de Texturas (Redesenho em Runtime)

Quando o jogador equipar um item no inventário ou trocar de skin na loja do vilarejo, a textura do Phaser deve ser atualizada de forma segura sem recriar o objeto físico `Player.ts`.

```
[ Ação: Equipar Item ] ──► [ Atualiza State do Zustand ]
                                      │
                                      ▼
             [ Dispara Evento 'rebuild-player-texture' ]
                                      │
                                      ▼
          [ textureGenerator reconstrói o Canvas e aplica ]
                                      │
                                      ▼
          [ player.setTexture('spr_bloodmage') atualizado ]
```

### Mecânica de Sincronização:
1.  O jogador equipa uma "Lâmina de Ferro Carmesim" no inventário. O estado global `equipment` no Zustand é atualizado.
2.  O `Player.ts` escuta a mudança ou recebe um evento de sinalização para atualizar seu visual.
3.  O `textureGenerator.ts` é acionado para apagar a textura de canvas anterior sob a chave `'spr_bloodmage'` e gerar um novo canvas composto com a base da Skin, a Armadura ativa e a Lâmina de Ferro nas mãos.
4.  A nova textura é registrada de volta de forma síncrona via `scene.textures.addCanvas('spr_bloodmage', newCanvas)`.
5.  O Phaser redesenha o personagem no próximo quadro com o novo visual completo.

---

## 4. UI/UX: Tela de Guarda-Roupa / Guarda-Armas (Skins & Arsenal)

Para interagir com este sistema, propomos a criação de uma nova aba no painel de inventário e compras chamado **Guarda-Roupa & Arsenal**.

### Características Visuais (Visual Retro 1995):
*   **Espelho Rúnico:** Uma visualização central ampliada em pixel art do modelo do seu mago atual sob uma moldura de pedra gótica cercada por velas pulsantes.
*   **Arsenal de Lâminas:** Uma grade de visualização com todos os visuais de armas desbloqueados. O jogador pode optar por equipar uma arma por seus atributos mecânicos, mas aplicar uma "Skin de Arma" diferente para a aparência estética (transmogrificação).
*   **Preço e Desbloqueio:** Exibe o custo das skins em Cristais de Sangue acumulados no metajogo, incentivando o ciclo de gameplay.

---

## Referências

- [[docs/specs/propostas/04_MOBILE_APP_E_MONETIZACAO_INDIE.md]] — Conexão com monetização de cosméticos
- [[docs/gameplay/04_LOOT_SYSTEM.md]] — Funcionamento do sistema de itens e equipamentos

## Registro de mudanças

| Data | O que mudou | Autor |
|------|-------------|-------|
| 2026-08-11 | Criação da proposta técnica de Skinning e Composição Canvas | Jules (Google AI) |
